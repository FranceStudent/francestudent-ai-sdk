import { AxiosResponse, isAxiosError } from 'axios';

import { LogActions } from '../../enums/Logging';
import { captureCookies, CookieJar, toCookieHeader } from '../../helper/CookieUtils';
import {
	buildConsentBody,
	buildLoginBody,
	extractAlert,
	findConsentForm,
	findLoginForm,
	hasCaptchaWidget,
	IHtmlForm,
	looksLikeChallenge,
	looksLikeTwoFactor,
	pageTitle,
	parseForms,
} from '../../helper/HtmlForms';
import { AuthenticationError } from '../../models/errors/AuthenticationError';

import { DEVICE_COOKIE, SESSION_COOKIE } from './AuthService';
import { LogService } from './LogService';

import type { FranceStudentConfig } from '../../models/FranceStudentConfig';

/** The maximum number of redirections followed in a row. */
const MaxRedirects = 15;

/** The maximum number of pages (log in, consent, ...) handled. */
const MaxPageSteps = 6;

/** The timeout (in ms) of each request. */
const RequestTimeoutMs = 30_000;

/** The maximum number of characters of a page that are parsed. */
const MaxPageChars = 2_000_000;

/** The HTTP status codes of redirections. */
const RedirectStatuses = new Set([301, 302, 303, 307, 308]);

/**
 * The options of a single request of the log in flow.
 */
interface ILoginRequestOptions {
	method?: string;
	body?: string;
	headers?: { [key: string]: string };
	referer?: string;
}

/**
 * A response, along with the URL it was received from.
 */
interface ILocatedResponse {
	response: AxiosResponse<string>;
	url: string;
}

/**
 * The service that logs in with an email and a password.
 *
 * @remarks
 * The log in flow (observed in a network capture) is:
 *
 * 1. `GET {origin}/api/auth/providers`: a single `oauth` provider (WHMCS).
 * 2. `GET {origin}/api/auth/csrf`: CSRF token and cookie.
 * 3. `POST {origin}/api/auth/signin/whmcs` with `X-Auth-Return-Redirect: 1`: returns the OAuth (PKCE)
 *    authorization URL, and sets the state and PKCE cookies.
 * 4. On WHMCS: log in page, then credentials submission. The form is read dynamically (hidden fields,
 *    field names, action), without hard-coded names. A consent page, if any, is accepted.
 * 5. Back on `{origin}/api/auth/callback/whmcs`: sets `next-auth.session-token`.
 *
 * The password is only kept in memory during the log in; it is never logged nor stored.
 *
 * @internal
 */
export class LoginService {
	/** The config object. */
	private readonly _config: FranceStudentConfig;

	/** One cookie jar per host. */
	private readonly _jars = new Map<string, CookieJar>();

	/**
	 * @param config - The config for FranceStudent.
	 */
	public constructor(config: FranceStudentConfig) {
		this._config = config;
	}

	/** The host of the web application. */
	private get _originHost(): string {
		return new URL(this._config.origin).host;
	}

	/**
	 * Describes the given URL for logs and errors, without its query.
	 *
	 * @param url - The URL.
	 *
	 * @returns The host and path.
	 */
	private static _describeUrl(url: string): string {
		const parsed = new URL(url);

		return `${parsed.host}${parsed.pathname}`;
	}

	/**
	 * Builds the URL to submit a GET form to.
	 *
	 * @param action - The action of the form.
	 * @param body - The fields of the form.
	 *
	 * @returns The URL.
	 */
	private static _withQuery(action: string, body: URLSearchParams): string {
		const url = new URL(action);

		for (const [name, value] of body) {
			url.searchParams.set(name, value);
		}

		return url.toString();
	}

	/**
	 * Steps 4 and 5: WHMCS log in page, credentials submission, back to the callback.
	 *
	 * @param authorizeUrl - The OAuth authorization URL.
	 * @param email - The email address.
	 * @param password - The password.
	 */
	private async _completeAuthorization(authorizeUrl: string, email: string, password: string): Promise<void> {
		let { response, url } = await this._follow(await this._request(authorizeUrl), authorizeUrl);
		let isSubmitted = false;

		for (let step = 0; step < MaxPageSteps && !this._isLoggedIn(); step++) {
			const page = String(response.data ?? '').slice(0, MaxPageChars);

			this._guardPage(response, page, url);

			const forms = parseForms(page, url);
			const login = findLoginForm(forms);

			if (login) {
				if (isSubmitted) {
					const alert = extractAlert(page);

					throw new AuthenticationError(`Credentials rejected by WHMCS${alert ? `: ${alert}` : '.'}`, 401);
				}

				if (hasCaptchaWidget(page)) {
					throw new AuthenticationError(
						'The log in page requires a captcha, automatic log in is not possible. ' +
							'Use a session token (cookie of the browser) instead.',
					);
				}

				isSubmitted = true;
				({ response, url } = await this._submitForm(
					login.form,
					buildLoginBody(login, { email: email, secret: password }),
					url,
				));
				continue;
			}

			if (isSubmitted && looksLikeTwoFactor(page)) {
				throw new AuthenticationError(
					'Two-factor authentication is required, which is not supported. ' +
						'Use a session token (cookie of the browser) instead.',
				);
			}

			const consent = findConsentForm(forms);

			if (consent) {
				({ response, url } = await this._submitForm(consent.form, buildConsentBody(consent), url));
				continue;
			}

			const title = pageTitle(page);

			throw new AuthenticationError(
				`Unexpected page during log in (${LoginService._describeUrl(url)}, HTTP ${response.status}` +
					`${title ? `, "${title}"` : ''}).`,
				response.status,
			);
		}

		if (!this._isLoggedIn()) {
			const names = [...this._jarFor(this._originHost).keys()].join(', ') || 'none';

			throw new AuthenticationError(
				`Log in incomplete: the "${SESSION_COOKIE}" cookie was not received (cookies received: ${names}).`,
			);
		}
	}

	/**
	 * Follows redirections manually, to keep each cookie jar up to date.
	 *
	 * @param response - The response to follow.
	 * @param from - The URL of the response.
	 *
	 * @returns The final response, and its URL.
	 */
	private async _follow(response: AxiosResponse<string>, from: string): Promise<ILocatedResponse> {
		let current = response;
		let currentUrl = from;
		let hops = 0;

		while (!this._isLoggedIn() && RedirectStatuses.has(current.status)) {
			const location = current.headers.location as string | undefined;

			if (!location) {
				break;
			}
			if (++hops > MaxRedirects) {
				throw new AuthenticationError('Too many redirections during log in.');
			}

			const next = new URL(location, currentUrl).toString();

			current = await this._request(next, { referer: currentUrl });
			currentUrl = next;
		}

		return { response: current, url: currentUrl };
	}

	/**
	 * Throws if the page is a Cloudflare challenge or an HTTP error.
	 *
	 * @param response - The response.
	 * @param page - The body of the response.
	 * @param url - The URL of the response.
	 */
	private _guardPage(response: AxiosResponse<string>, page: string, url: string): void {
		if (looksLikeChallenge(response.status, response.headers, page)) {
			throw new AuthenticationError(
				'Cloudflare blocked the automatic log in. Use a session token (cookie of the browser) instead.',
				response.status,
			);
		}

		if (response.status >= 400) {
			throw new AuthenticationError(
				`The log in page responded HTTP ${response.status} (${LoginService._describeUrl(url)}).`,
				response.status,
			);
		}
	}

	/**
	 * Whether the session cookie was received.
	 */
	private _isLoggedIn(): boolean {
		return this._jarFor(this._originHost).has(SESSION_COOKIE);
	}

	/**
	 * Gets the cookie jar of the given host.
	 *
	 * @param host - The host.
	 *
	 * @returns The cookie jar.
	 */
	private _jarFor(host: string): CookieJar {
		let jar = this._jars.get(host);

		if (!jar) {
			jar = new Map();
			this._jars.set(host, jar);
		}

		return jar;
	}

	/**
	 * Parses the given body as JSON.
	 *
	 * @param body - The body.
	 *
	 * @returns The parsed body, or `undefined` if it is not JSON.
	 */
	private _parseJson<T>(body: string): T | undefined {
		try {
			return JSON.parse(body) as T;
		} catch {
			return undefined;
		}
	}

	/**
	 * Makes a single request of the log in flow, without following redirections.
	 *
	 * @param url - The URL.
	 * @param options - The options of the request.
	 *
	 * @returns The response.
	 */
	private async _request(url: string, options: ILoginRequestOptions = {}): Promise<AxiosResponse<string>> {
		const target = new URL(url);
		const method = options.method ?? 'GET';
		const jar = this._jarFor(target.host);
		const cookie = toCookieHeader(jar);
		const isOrigin = target.host === this._originHost;

		let response: AxiosResponse<string>;

		/* eslint-disable @typescript-eslint/naming-convention */
		try {
			response = await this._config.instance.request<string>({
				url: target.toString(),
				method: method,
				data: options.body,
				headers: {
					...(isOrigin ? this._config.headers : { 'User-Agent': this._config.userAgent }),
					Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
					'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
					Referer: options.referer ?? `${this._config.origin}/`,
					...(cookie ? { Cookie: cookie } : {}),
					...options.headers,
				},
				maxRedirects: 0,
				validateStatus: () => true,
				responseType: 'text',
				transformResponse: (data: unknown) => data,
				timeout: RequestTimeoutMs,
			});
		} catch (error) {
			// The raw error is not rethrown, since its config holds the cookies and the submitted credentials
			const code = isAxiosError(error) ? (error.code ?? 'NETWORK_ERROR') : 'UNKNOWN_ERROR';

			throw new AuthenticationError(
				`Log in request failed: ${method} ${LoginService._describeUrl(target.toString())} (${code}).`,
			);
		}
		/* eslint-enable @typescript-eslint/naming-convention */

		captureCookies(response.headers, jar);

		// Logging
		LogService.log(LogActions.LOGIN, {
			method: method,
			url: LoginService._describeUrl(target.toString()),
			status: response.status,
		});

		return response;
	}

	/**
	 * Steps 1 to 3: gets the OAuth authorization URL.
	 *
	 * @returns The authorization URL.
	 */
	private async _startOAuth(): Promise<string> {
		const origin = this._config.origin;
		/* eslint-disable @typescript-eslint/naming-convention */
		const jsonHeaders = { Accept: 'application/json' };
		/* eslint-enable @typescript-eslint/naming-convention */
		let signinUrl = `${origin}/api/auth/signin/whmcs`;

		// Looking for the OAuth provider, falling back to the default URL
		try {
			const response = await this._request(`${origin}/api/auth/providers`, { headers: jsonHeaders });

			if (response.status >= 200 && response.status < 300) {
				const providers = this._parseJson<{ [key: string]: { type?: string; signinUrl?: string } }>(
					response.data,
				);
				const oauth = Object.values(providers ?? {}).find(
					(provider) => provider?.type === 'oauth' && typeof provider.signinUrl === 'string',
				);

				if (oauth?.signinUrl?.startsWith(origin)) {
					signinUrl = oauth.signinUrl;
				}
			}
		} catch (error) {
			LogService.log(LogActions.WARNING, { target: 'PROVIDERS', message: (error as Error).message });
		}

		const csrfResponse = await this._request(`${origin}/api/auth/csrf`, { headers: jsonHeaders });

		if (csrfResponse.status < 200 || csrfResponse.status >= 300) {
			throw new AuthenticationError(`csrf: HTTP ${csrfResponse.status}`, csrfResponse.status);
		}

		const csrfToken = this._parseJson<{ csrfToken?: string }>(csrfResponse.data)?.csrfToken;

		if (!csrfToken) {
			throw new AuthenticationError('csrf: no token received.');
		}

		/* eslint-disable @typescript-eslint/naming-convention */
		const response = await this._request(signinUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Origin: origin,
				'X-Auth-Return-Redirect': '1',
			},
			body: new URLSearchParams({ csrfToken: csrfToken, callbackUrl: '/' }).toString(),
		});
		/* eslint-enable @typescript-eslint/naming-convention */

		const target =
			(response.headers.location as string | undefined) ??
			this._parseJson<{ url?: string }>(String(response.data ?? ''))?.url;

		if (!target) {
			throw new AuthenticationError(`signin: no authorization URL received (HTTP ${response.status}).`);
		}

		return new URL(target, origin).toString();
	}

	/**
	 * Submits the given form, and follows the redirections.
	 *
	 * @param form - The form.
	 * @param body - The fields to submit.
	 * @param referer - The URL of the page of the form.
	 *
	 * @returns The final response, and its URL.
	 */
	private async _submitForm(form: IHtmlForm, body: URLSearchParams, referer: string): Promise<ILocatedResponse> {
		const isPost = form.method === 'POST';
		const target = isPost ? form.action : LoginService._withQuery(form.action, body);

		/* eslint-disable @typescript-eslint/naming-convention */
		const response = await this._request(target, {
			method: isPost ? 'POST' : 'GET',
			referer: referer,
			body: isPost ? body.toString() : undefined,
			headers: isPost
				? { 'Content-Type': 'application/x-www-form-urlencoded', Origin: new URL(referer).origin }
				: {},
		});
		/* eslint-enable @typescript-eslint/naming-convention */

		return this._follow(response, target);
	}

	/**
	 * Logs in with an email and a password.
	 *
	 * @param email - The email address of the account.
	 * @param password - The password of the account.
	 *
	 * @returns The session token, i.e, the value of the `next-auth.session-token` cookie.
	 */
	public async login(email: string, password: string): Promise<string> {
		if (!email || !password) {
			throw new AuthenticationError('An email and a password are required.');
		}

		// Starting from fresh cookie jars, with the device ID of this instance
		this._jars.clear();
		this._jarFor(this._originHost).set(DEVICE_COOKIE, this._config.deviceId);

		try {
			const authorizeUrl = await this._startOAuth();

			await this._completeAuthorization(authorizeUrl, email, password);

			return this._jarFor(this._originHost).get(SESSION_COOKIE)!;
		} catch (error) {
			// Only safe, purpose-built errors may leave the log in flow
			if (error instanceof AuthenticationError) {
				throw error;
			}

			throw new AuthenticationError(
				`Log in failed: ${error instanceof Error ? error.message.slice(0, 200) : 'unknown error'}`,
			);
		} finally {
			this._jars.clear();
		}
	}
}
