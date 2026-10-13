import { randomUUID } from 'crypto';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

import { AxiosInstance, AxiosProxyConfig, AxiosRequestConfig, AxiosResponse, create } from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

import { AuthService } from '../services/internal/AuthService';
import { IErrorHandler } from '../types/ErrorHandler';
import { IFranceStudentConfig } from '../types/FranceStudentConfig';

/**
 * The default values of the configuration.
 *
 * @public
 */
const Defaults = {
	apiUrl: 'https://api.francestudent.ai',
	origin: 'https://ia.francestudent.org',
	clientPlatform: 'web_fs_ai',
	clientVersion: '4005601',
	streamFirstByteTimeout: 60_000,
	streamIdleTimeout: 90_000,
	streamTimeout: 310_000,
	userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0',
};

/**
 * The configuration for initializing a new FranceStudent instance.
 *
 * @public
 */
export class FranceStudentConfig implements IFranceStudentConfig {
	// Parameters for internal use
	private _accessToken?: string;
	private _auth: AuthService;
	private _headers: { [key: string]: string };
	private _httpAgent: HttpAgent;
	private _httpsAgent: HttpsAgent;
	private _instance: AxiosInstance;
	private _proxy?: AxiosProxyConfig | string | null;
	private _sessionToken?: string;

	// Parameters that can be set once, upon initialization
	public readonly apiUrl: string;
	public readonly clientPlatform: string;
	public readonly clientVersion: string;
	public readonly delay?: number | (() => number | Promise<number>);
	public readonly deviceId: string;
	public readonly errorHandler?: IErrorHandler;
	public readonly fetch?: typeof fetch;
	public readonly logging?: boolean;
	public readonly maxRetries: number;
	public readonly onSessionUpdate?: (sessionToken: string) => void | Promise<void>;
	public readonly origin: string;
	public readonly responseMiddleware?: (response: AxiosResponse) => void | Promise<void>;
	public readonly streamFirstByteTimeout: number;
	public readonly streamIdleTimeout: number;
	public readonly streamTimeout: number;
	public readonly timeout?: number;
	public readonly userAgent: string;

	/**
	 * @param config - The config for FranceStudent of type {@link IFranceStudentConfig}.
	 */
	public constructor(config?: IFranceStudentConfig) {
		this.apiUrl = (config?.apiUrl ?? Defaults.apiUrl).replace(/\/+$/, '');
		this.origin = (config?.origin ?? Defaults.origin).replace(/\/+$/, '');
		this.clientPlatform = config?.clientPlatform ?? Defaults.clientPlatform;
		this.clientVersion = config?.clientVersion ?? Defaults.clientVersion;
		this.userAgent = config?.userAgent ?? Defaults.userAgent;
		this.deviceId = config?.deviceId ?? randomUUID();
		this.delay = config?.delay ?? 0;
		this.fetch = config?.fetch;
		this.maxRetries = config?.maxRetries ?? 0;
		this.errorHandler = config?.errorHandler;
		this.responseMiddleware = config?.responseMiddleware;
		this.onSessionUpdate = config?.onSessionUpdate;
		this.logging = config?.logging;
		this.timeout = config?.timeout;
		this.streamFirstByteTimeout = config?.streamFirstByteTimeout ?? Defaults.streamFirstByteTimeout;
		this.streamIdleTimeout = config?.streamIdleTimeout ?? Defaults.streamIdleTimeout;
		this.streamTimeout = config?.streamTimeout ?? Defaults.streamTimeout;
		this._proxy = config?.proxy;
		this._sessionToken = AuthService.normalizeSessionToken(config?.sessionToken);
		this._accessToken = config?.accessToken;
		this._headers = this._buildHeaders(config?.headers);

		// Initializing the HTTP(S) agent(s)
		const agents = this._getRequestAgents(config?.proxy);
		this._httpAgent = agents.httpAgent;
		this._httpsAgent = agents.httpsAgent;

		// Creating the shared Axios instance
		this._instance = this._createAxiosInstance();

		// Creating the shared authentication state
		this._auth = new AuthService(this);
	}

	/** The access token (JWT) set by the user, if any. */
	public get accessToken(): string | undefined {
		return this._accessToken;
	}

	/** The shared authentication service. */
	public get auth(): AuthService {
		return this._auth;
	}

	/**
	 * The Axios proxy configuration to use.
	 *
	 * @remarks If `proxy` is set, Axios' built-in env-variable-based proxy is disabled.
	 */
	public get axiosProxyConfig(): AxiosProxyConfig | false | undefined {
		if (this._proxy === null || typeof this._proxy === 'string') {
			return false;
		}
		if (this._proxy !== undefined) {
			return this._proxy;
		}

		return undefined;
	}

	/** Whether credentials (session token or access token) are available. */
	public get hasCredentials(): boolean {
		return Boolean(this._sessionToken || this._accessToken);
	}

	/** The headers sent with every request, to the API and to the web application. */
	public get headers(): { [key: string]: string } {
		return this._headers;
	}

	/** The HTTP agent instance to use. */
	public get httpAgent(): HttpAgent {
		return this._httpAgent;
	}

	/** The HTTPS agent instance to use. */
	public get httpsAgent(): HttpsAgent {
		return this._httpsAgent;
	}

	/** The shared HTTP client instance used for all HTTP requests. */
	public get instance(): AxiosInstance {
		return this._instance;
	}

	/** The session token, if any. */
	public get sessionToken(): string | undefined {
		return this._sessionToken;
	}

	public set accessToken(accessToken: string | undefined) {
		this._accessToken = accessToken;
		this._auth?.reset();
	}

	public set headers(headers: { [key: string]: string } | undefined) {
		this._headers = this._buildHeaders(headers);
	}

	public set proxy(proxy: AxiosProxyConfig | string | null | undefined) {
		// Update HTTP(s) agents
		const agents = this._getRequestAgents(proxy);
		this._httpAgent = agents.httpAgent;
		this._httpsAgent = agents.httpsAgent;
		this._proxy = proxy;

		// Update the shared instance defaults
		this._instance.defaults.httpAgent = this._httpAgent;
		this._instance.defaults.httpsAgent = this._httpsAgent;
		this._instance.defaults.proxy = this.axiosProxyConfig;
	}

	public set sessionToken(sessionToken: string | undefined) {
		this._sessionToken = AuthService.normalizeSessionToken(sessionToken);
		this._auth?.reset();
	}

	/**
	 * Builds the headers sent with every request.
	 *
	 * @param headers - The custom headers.
	 *
	 * @returns The headers.
	 */
	private _buildHeaders(headers?: { [key: string]: string }): { [key: string]: string } {
		return {
			/* eslint-disable @typescript-eslint/naming-convention */
			Accept: 'application/json, text/plain, */*',
			'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
			'User-Agent': this.userAgent,
			Origin: this.origin,
			Referer: `${this.origin}/`,
			'francestudent-client-platform': this.clientPlatform,
			'francestudent-client-version': this.clientVersion,
			'francestudent-device-id': this.deviceId,
			...headers,
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * Creates the shared HTTP client instance with the current configuration.
	 *
	 * @returns The configured Axios instance.
	 */
	private _createAxiosInstance(): AxiosInstance {
		const config: AxiosRequestConfig = {
			httpAgent: this._httpAgent,
			httpsAgent: this._httpsAgent,
			proxy: this.axiosProxyConfig,
		};

		if (this.fetch !== undefined) {
			config.adapter = 'fetch';
			config.env = { fetch: this.fetch };
		}

		if (this.timeout !== undefined) {
			config.timeout = this.timeout;
		}

		return create(config);
	}

	/**
	 * Returns the appropriate HTTP(s) agents based on the type of proxy config.
	 *
	 * @param proxy - The proxy configuration.
	 *
	 * @returns The HTTP(s) agents.
	 */
	private _getRequestAgents(proxy?: AxiosProxyConfig | string | null): {
		httpAgent: HttpAgent;
		httpsAgent: HttpsAgent;
	} {
		if (typeof proxy === 'string' && (proxy.startsWith('http://') || proxy.startsWith('https://'))) {
			return { httpAgent: new HttpProxyAgent(proxy), httpsAgent: new HttpsProxyAgent(proxy) };
		} else if (typeof proxy === 'string' && proxy.startsWith('socks')) {
			return { httpAgent: new SocksProxyAgent(proxy), httpsAgent: new SocksProxyAgent(proxy) };
		}

		return { httpAgent: new HttpAgent({ keepAlive: true }), httpsAgent: new HttpsAgent({ keepAlive: true }) };
	}

	/**
	 * Replaces the session token, without discarding the current access token.
	 *
	 * @param sessionToken - The new session token, renewed by the server.
	 *
	 * @internal
	 */
	public updateSessionToken(sessionToken: string): void {
		this._sessionToken = sessionToken;
	}
}

export { Defaults as DefaultFranceStudentConfig };
