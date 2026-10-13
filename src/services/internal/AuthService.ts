import { AxiosResponse, isAxiosError } from 'axios';

import { ApiErrors } from '../../enums/Api';
import { LogActions } from '../../enums/Logging';
import { captureCookies, CookieJar, toCookieHeader } from '../../helper/CookieUtils';
import { AuthenticationError } from '../../models/errors/AuthenticationError';
import { IAccessToken } from '../../types/auth/AccessToken';

import { LogService } from './LogService';

import type { FranceStudentConfig } from '../../models/FranceStudentConfig';

/**
 * The name of the session cookie of the web application.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SESSION_COOKIE = 'next-auth.session-token';

/**
 * The name of the device ID cookie of the web application.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DEVICE_COOKIE = 'francestudent-device-id';

/** The margin (in ms) before expiration at which an access token is renewed. */
const TokenRefreshMarginMs = 60_000;

/** The lifetime (in s) assumed for an access token without expiration date. */
const DefaultTokenLifetimeS = 300;

/**
 * The service that handles authentication.
 *
 * @remarks
 * Authentication works as follows (observed on ia.francestudent.org):
 *
 * 1. The browser holds a long-lived session cookie, `next-auth.session-token`.
 * 2. `GET {origin}/api/auth/api-token`, called with this cookie, returns a short-lived JWT.
 * 3. The JWT is sent to the API in the `Authorization: Bearer ...` header.
 *
 * There is no refresh token: a new JWT is requested with the session cookie shortly before the
 * current one expires, and after any `401` response.
 *
 * @internal
 */
export class AuthService {
	/** The config object. */
	private readonly _config: FranceStudentConfig;

	/** The access token currently in use. */
	private _accessToken = '';

	/** The expiration time of the current access token, in ms since the epoch. */
	private _expiresAt = 0;

	/** The generation of the credentials, incremented each time they are replaced. */
	private _generation = 0;

	/** The renewal in progress, if any, shared by concurrent requests. */
	private _pending?: Promise<void>;

	/**
	 * @param config - The config for FranceStudent.
	 */
	public constructor(config: FranceStudentConfig) {
		this._config = config;
	}

	/** Whether the access token can be renewed, i.e, a session token is available. */
	public get canRenew(): boolean {
		return Boolean(this._config.sessionToken);
	}

	/** The expiration time of the current access token, in ms since the epoch, or 0 if none. */
	public get expiresAt(): number {
		return this._accessToken ? this._expiresAt : 0;
	}

	/**
	 * Extracts a short, safe description of an error body returned by the web application.
	 *
	 * @param body - The response body.
	 *
	 * @returns The description, if any.
	 */
	private static _describeBody(body: unknown): string | undefined {
		let text: string | undefined = undefined;

		if (typeof body === 'string') {
			text = body;
		} else if (body && typeof body === 'object') {
			const data = body as { error?: unknown; message?: unknown };
			const parts = [data.error, data.message].filter((item): item is string => typeof item === 'string');

			text = parts.join(': ');
		}

		text = text?.replace(/\s+/g, ' ').trim();

		return text ? text.slice(0, 200) : undefined;
	}

	/**
	 * Gets the expiration time of a JWT, in ms since the epoch.
	 *
	 * @param token - The JWT.
	 *
	 * @returns The expiration time, or `Infinity` if unknown.
	 */
	private static _getJwtExpiration(token: string): number {
		const exp = AuthService.decodeJwt(token)?.exp;

		return typeof exp === 'number' ? exp * 1000 : Number.POSITIVE_INFINITY;
	}

	/**
	 * Requests a new access token in exchange for the session token.
	 *
	 * @param generation - The generation of the credentials the renewal was started with.
	 *
	 * @remarks If the credentials are replaced while the renewal is in progress, its result is discarded.
	 */
	private async _renew(generation: number): Promise<void> {
		const sessionToken = this._config.sessionToken;

		// A user-provided access token cannot be renewed
		if (!sessionToken) {
			if (this._config.accessToken) {
				this._accessToken = this._config.accessToken;
				this._expiresAt = AuthService._getJwtExpiration(this._config.accessToken);

				return;
			}

			throw new AuthenticationError(ApiErrors.RESOURCE_NOT_ALLOWED, undefined, true);
		}

		// Logging
		LogService.log(LogActions.TOKEN, { action: 'RENEW' });

		const jar: CookieJar = new Map([
			[SESSION_COOKIE, sessionToken],
			[DEVICE_COOKIE, this._config.deviceId],
		]);

		let response: AxiosResponse<IAccessToken | string>;

		try {
			response = await this._config.instance.get<IAccessToken | string>(
				`${this._config.origin}/api/auth/api-token`,
				{
					headers: {
						...this._config.headers,
						/* eslint-disable @typescript-eslint/naming-convention */
						Accept: '*/*',
						Cookie: toCookieHeader(jar),
						/* eslint-enable @typescript-eslint/naming-convention */
					},
					timeout: this._config.timeout ?? 30_000,
					validateStatus: () => true,
				},
			);
		} catch (error) {
			// The raw error is not rethrown, since its config holds the session cookie
			const code = isAxiosError(error) ? (error.code ?? 'NETWORK_ERROR') : 'UNKNOWN_ERROR';

			throw new AuthenticationError(
				`${ApiErrors.COULD_NOT_AUTHENTICATE} (GET ${new URL(this._config.origin).host}/api/auth/api-token failed: ${code})`,
			);
		}

		// Discarding the result if the credentials were replaced in the meantime
		if (generation !== this._generation) {
			return;
		}

		// Keeping track of a renewed session cookie
		captureCookies(response.headers, jar);
		await this._updateSession(jar.get(SESSION_COOKIE));

		if (response.status < 200 || response.status >= 300) {
			const details = AuthService._describeBody(response.data);
			const suffix = `api-token responded HTTP ${response.status}${details ? `: ${details}` : ''}`;

			// Only a 401 means that the session is invalid; a 403 is usually a block by Cloudflare
			if (response.status === 401) {
				throw new AuthenticationError(`${ApiErrors.SESSION_EXPIRED} (${suffix})`, response.status, true);
			}

			throw new AuthenticationError(`${ApiErrors.COULD_NOT_AUTHENTICATE} (${suffix})`, response.status);
		}

		const data = response.data;

		if (!data || typeof data !== 'object' || typeof data.accessToken !== 'string' || !data.accessToken) {
			throw new AuthenticationError(`${ApiErrors.BAD_AUTHENTICATION}: no access token received`, undefined, true);
		}

		// The credentials may have been replaced while the session update was being handled
		if (generation !== this._generation) {
			return;
		}

		this._accessToken = data.accessToken;
		this._expiresAt = data.expiresAt
			? Number(data.expiresAt) * 1000
			: Date.now() + (Number(data.expiresIn) || DefaultTokenLifetimeS) * 1000;

		// Logging
		LogService.log(LogActions.TOKEN, { validFor: Math.round((this._expiresAt - Date.now()) / 1000) });
	}

	/**
	 * Updates the session token if the server renewed it.
	 *
	 * @param sessionToken - The session token received.
	 */
	private async _updateSession(sessionToken?: string): Promise<void> {
		if (!sessionToken || sessionToken === this._config.sessionToken) {
			return;
		}

		// Logging
		LogService.log(LogActions.TOKEN, { action: 'SESSION_RENEWED' });

		// Bypassing the setter, which would discard the current access token
		this._config.updateSessionToken(sessionToken);
		await this._config.onSessionUpdate?.(sessionToken);
	}

	/**
	 * Decodes the payload of a JWT, without verifying it.
	 *
	 * @param token - The JWT.
	 *
	 * @returns The payload, if it could be decoded.
	 */
	public static decodeJwt(token: string): Record<string, unknown> | undefined {
		try {
			const payload = token.split('.')[1];

			return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
		} catch {
			return undefined;
		}
	}

	/**
	 * Normalizes a session token given by the user (quotes, `name=value` cookie strings, ...).
	 *
	 * @param sessionToken - The session token given by the user.
	 *
	 * @returns The bare value of the session cookie.
	 */
	public static normalizeSessionToken(sessionToken?: string): string | undefined {
		if (!sessionToken) {
			return undefined;
		}

		// Extracting the session cookie out of a full cookie header, if needed
		const fromHeader = sessionToken
			.split(';')
			.map((item) => item.trim())
			.find((item) => /^[\w.-]*session-token=/i.test(item));

		const value = (fromHeader ?? sessionToken)
			.trim()
			.replace(/^["']|["']$/g, '')
			.replace(/^[\w.-]*session-token=/i, '')
			.trim();

		return value || undefined;
	}

	/**
	 * Gets a valid access token, renewing it if needed.
	 *
	 * @param force - Whether to renew the token even if it is still valid.
	 *
	 * @returns The access token.
	 */
	public async getAccessToken(force = false): Promise<string> {
		const isFresh = this._accessToken && this._expiresAt - Date.now() > TokenRefreshMarginMs;

		if (isFresh && !force) {
			return this._accessToken;
		}

		// A user-provided access token is used as is until it expires
		if (!this._config.sessionToken && this._config.accessToken && this._accessToken && !force) {
			return this._accessToken;
		}

		while (true) {
			const generation = this._generation;

			if (!this._pending) {
				const pending: Promise<void> = this._renew(generation).finally(() => {
					if (this._pending === pending) {
						this._pending = undefined;
					}
				});

				this._pending = pending;
			}

			try {
				await this._pending;
			} catch (error) {
				// A failure with outdated credentials is not relevant anymore
				if (generation === this._generation) {
					throw error;
				}
			}

			// Retrying if the credentials were replaced during the renewal
			if (generation === this._generation) {
				return this._accessToken;
			}
		}
	}

	/**
	 * Gets the authentication headers to send to the API.
	 *
	 * @returns The authentication headers.
	 */
	public async getAuthHeaders(): Promise<{ [key: string]: string }> {
		/* eslint-disable @typescript-eslint/naming-convention */
		return { Authorization: `Bearer ${await this.getAccessToken()}` };
		/* eslint-enable @typescript-eslint/naming-convention */
	}

	/**
	 * Discards the current access token, and any renewal in progress.
	 *
	 * @remarks Called whenever the credentials are replaced.
	 */
	public reset(): void {
		this._generation++;
		this._pending = undefined;
		this._accessToken = '';
		this._expiresAt = 0;
	}
}
