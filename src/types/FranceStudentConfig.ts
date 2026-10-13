import { AxiosProxyConfig, AxiosResponse } from 'axios';

import { IErrorHandler } from './ErrorHandler';

/**
 * The configuration for initializing a new FranceStudent instance.
 *
 * @public
 */
export interface IFranceStudentConfig {
	/**
	 * The session token, i.e, the value of the `next-auth.session-token` cookie of ia.francestudent.org.
	 *
	 * @remarks
	 * <br>
	 * - Used to obtain short-lived access tokens (JWT), which are renewed automatically.
	 * - A full `name=value` cookie string is also accepted.
	 */
	sessionToken?: string;

	/**
	 * An access token (JWT) to use directly.
	 *
	 * @remarks Access tokens expire after a few minutes and cannot be renewed without a `sessionToken`.
	 */
	accessToken?: string;

	/** The device ID sent with each request. A random UUID is generated if not set. */
	deviceId?: string;

	/** The base URL of the API. Defaults to `https://api.francestudent.ai`. */
	apiUrl?: string;

	/** The origin of the web application, used for authentication. Defaults to `https://ia.francestudent.org`. */
	origin?: string;

	/** The client version sent with each request. */
	clientVersion?: string;

	/** The client platform sent with each request. Defaults to `web_fs_ai`. */
	clientPlatform?: string;

	/** The User-Agent sent with each request. */
	userAgent?: string;

	/**
	 * The proxy to use.
	 *
	 * @remarks
	 * <br>
	 * - If set to anything besides `undefined`, disables Axios' built-in environment variable-set proxy.
	 *
	 * @example
	 * ```
	 * // Use custom proxy config via config object
	 * { proxy: { host: '127.0.0.1', port: 8080 } }
	 *
	 * // Use custom proxy config via URL
	 * { proxy: 'https://127.0.0.1:8080' }
	 * ```
	 */
	proxy?: AxiosProxyConfig | string | null;

	/** The max wait time (in milli-seconds) for a response. Not applied to chat streams. */
	timeout?: number;

	/**
	 * The max wait time (in milli-seconds) for the response headers of a chat stream.
	 *
	 * @remarks Defaults to 60 000 (60 s). Set to 0 to disable.
	 */
	streamFirstByteTimeout?: number;

	/**
	 * The max time (in milli-seconds) without receiving any data, once a chat stream has started.
	 *
	 * @remarks Defaults to 90 000 (90 s). Set to 0 to disable.
	 */
	streamIdleTimeout?: number;

	/**
	 * The max total duration (in milli-seconds) of a chat stream, from the request to the last event.
	 *
	 * @remarks Defaults to 310 000 (310 s). Set to 0 to disable.
	 */
	streamTimeout?: number;

	/** Whether to write logs to console or not. */
	logging?: boolean;

	/**
	 * Optional custom HTTP headers to add to all requests to the API.
	 */
	headers?: { [key: string]: string };

	/**
	 * The delay (in ms) to use between concurrent request.
	 *
	 * Can either be a number or a function that returns a number synchronously or asynchronously.
	 */
	delay?: number | (() => number | Promise<number>);

	/**
	 * The maximum number of retries on transient errors, with an exponential back-off (1 s, 2 s, 4 s, ... up to 15 s).
	 *
	 * @remarks
	 * <br>
	 * - `GET`, `HEAD`, `PUT`, `DELETE`: network errors, `408`, `429` and `5xx` responses are retried.
	 * - `POST`, `PATCH` (e.g, sending a message, uploading a file): only errors where the request never reached the
	 *   server (`ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`) and `429` / `503` responses are retried, so that nothing is
	 *   sent twice.
	 * - A `429` caused by an exhausted chat budget, and aborted requests, are never retried.
	 * - A `401` response is always retried once, after renewing the access token.
	 */
	maxRetries?: number;

	/** Optional custom error handler to define error conditions and process API/HTTP errors in responses. */
	errorHandler?: IErrorHandler;

	/**
	 * Optional response middleware to be executed on obtaining a successful response.
	 *
	 * @param response - The raw `AxiosResponse` object.
	 */
	responseMiddleware?: (response: AxiosResponse) => void | Promise<void>;

	/**
	 * Optional callback, called when the server renews the session token.
	 *
	 * @remarks Use it to persist the new session token, since the previous one may stop working.
	 *
	 * @param sessionToken - The new session token.
	 */
	onSessionUpdate?: (sessionToken: string) => void | Promise<void>;

	/**
	 * A custom `fetch` implementation to use for making HTTP requests.
	 *
	 * @remarks When specified, the underlying HTTP client switches to a fetch-based transport.
	 */
	fetch?: typeof fetch;
}
