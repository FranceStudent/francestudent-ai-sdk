import { AxiosError, AxiosResponse, isAxiosError, isCancel } from 'axios';

import {
	AllowGuestAuthenticationGroup,
	BinaryResourcesGroup,
	FetchResourcesGroup,
	StreamResourcesGroup,
} from '../../collections/Groups';
import { Requests } from '../../collections/Requests';
import { ApiErrors } from '../../enums/Api';
import { LogActions } from '../../enums/Logging';
import { ResourceType } from '../../enums/Resource';
import { isStream, readStream } from '../../helper/Sse';
import { FetchArgs } from '../../models/args/FetchArgs';
import { PostArgs } from '../../models/args/PostArgs';
import { AuthenticationError } from '../../models/errors/AuthenticationError';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IFetchArgs } from '../../types/args/FetchArgs';
import { IPostArgs } from '../../types/args/PostArgs';
import { IErrorHandler } from '../../types/ErrorHandler';
import { ErrorService } from '../internal/ErrorService';
import { LogService } from '../internal/LogService';

/** The HTTP statuses after which an idempotent request is retried, if retries are enabled. */
const RetryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

/** The HTTP statuses after which a non-idempotent request is retried: the server rejected it without processing it. */
const RejectedStatuses = new Set([429, 503]);

/** The network error codes that guarantee the request never reached the server. */
const UnsentErrorCodes = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);

/** The HTTP methods that can be safely replayed. */
const IdempotentMethods = new Set(['get', 'head', 'put', 'delete', 'options']);

/** The placeholder used in logs in place of secrets. */
const Redacted = '[REDACTED]';

/**
 * Builds a copy of the given args that is safe to log: no secrets, no binary data.
 *
 * @param args - The args of the request.
 *
 * @returns The redacted copy.
 */
function redactArgs(args: IFetchArgs | IPostArgs): Record<string, unknown> {
	const post = args as IPostArgs;
	const copy: Record<string, unknown> = { ...args };

	/** Describes an upload without its content. */
	const describe = (upload: NonNullable<IPostArgs['upload']>): Record<string, unknown> => ({
		name: upload.name,
		type: upload.type,
		size: upload.data instanceof Blob ? upload.data.size : upload.data?.byteLength,
	});

	/** Redacts the credentials of an MCP server. */
	const redactServer = (server: object): Record<string, unknown> => {
		const result: Record<string, unknown> = { ...server };

		for (const key of ['authorization', 'headers']) {
			if (result[key] !== undefined) {
				result[key] = Redacted;
			}
		}

		return result;
	};

	if (post.upload !== undefined) {
		copy.upload = describe(post.upload);
	}
	if (post.uploads !== undefined) {
		copy.uploads = post.uploads.map(describe);
	}
	if (post.mcpServer !== undefined) {
		copy.mcpServer = redactServer(post.mcpServer);
	}
	if (post.mcpServerUpdates !== undefined) {
		copy.mcpServerUpdates = redactServer(post.mcpServerUpdates);
	}
	if (post.oauth !== undefined) {
		copy.oauth = { code: Redacted, state: Redacted };
	}
	if (post.email !== undefined) {
		copy.email = Redacted;
	}

	return copy;
}

/**
 * The base service that handles all HTTP requests.
 *
 * @public
 */
export class FetcherService {
	/** The delay/delay function to use (ms). */
	private readonly _delay?: number | (() => number | Promise<number>);

	/** The service used to handle HTTP and API errors */
	private readonly _errorHandler: IErrorHandler;

	/** The config object. */
	protected readonly config: FranceStudentConfig;

	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 */
	public constructor(config: FranceStudentConfig) {
		LogService.enabled = config.logging ?? false;
		this.config = config;
		this._delay = config.delay;
		this._errorHandler = config.errorHandler ?? new ErrorService();
	}

	/**
	 * Checks the authorization status based on the requested resource.
	 *
	 * @param resource - The requested resource.
	 *
	 * @throws An error if not authorized to access the requested resource.
	 */
	private _checkAuthorization(resource: ResourceType): void {
		// Logging
		LogService.log(LogActions.AUTHORIZATION, { authenticated: this.config.hasCredentials });

		// Checking authorization status
		if (!AllowGuestAuthenticationGroup.includes(resource) && !this.config.hasCredentials) {
			throw new AuthenticationError(ApiErrors.RESOURCE_NOT_ALLOWED, undefined, true);
		}
	}

	/**
	 * Whether the given error is worth retrying.
	 *
	 * @param error - The error, whose body has already been read.
	 * @param method - The HTTP method of the request.
	 *
	 * @returns Whether to retry.
	 */
	private _isRetryable(error: unknown, method?: string): boolean {
		if (!isAxiosError(error) || isCancel(error)) {
			return false;
		}

		const status = error.response?.status;
		const isIdempotent = IdempotentMethods.has((method ?? 'get').toLowerCase());

		// An exhausted budget will not be restored by retrying
		if (status === 429 && /budget exhausted/i.test(JSON.stringify(error.response?.data ?? ''))) {
			return false;
		}

		// Network errors carry no response
		if (status === undefined) {
			return isIdempotent || UnsentErrorCodes.has(error.code ?? '');
		}

		return isIdempotent ? RetryableStatuses.has(status) : RejectedStatuses.has(status);
	}

	/**
	 * Reads the body of an error response when it is a stream, so that it can be reported.
	 *
	 * @param error - The error.
	 */
	private async _readErrorBody(error: unknown): Promise<void> {
		const response = (error as AxiosError).response;

		if (!isAxiosError(error) || !response || !isStream(response.data)) {
			return;
		}

		try {
			const text = await readStream(response.data);

			try {
				response.data = JSON.parse(text);
			} catch {
				response.data = text;
			}
		} catch {
			response.data = undefined;
		}
	}

	/**
	 * Waits for the given duration, unless the given signal is aborted.
	 *
	 * @param ms - The duration to wait (ms).
	 * @param signal - The signal which interrupts the wait.
	 */
	private async _sleep(ms: number, signal?: AbortSignal): Promise<void> {
		if (signal?.aborted) {
			return;
		}

		await new Promise<void>((resolve) => {
			const timer = setTimeout(done, ms);

			function done(): void {
				clearTimeout(timer);
				signal?.removeEventListener('abort', done);
				resolve();
			}

			signal?.addEventListener('abort', done, { once: true });
		});
	}

	/**
	 * Validates the given args against the given resource.
	 *
	 * @param resource - The resource against which validation is to be done.
	 * @param args - The args to be validated.
	 *
	 * @returns The validated args.
	 */
	private _validateArgs(resource: ResourceType, args: IFetchArgs | IPostArgs): FetchArgs | PostArgs {
		if (FetchResourcesGroup.includes(resource)) {
			// Logging
			LogService.log(LogActions.VALIDATE, { target: 'FETCH_ARGS' });

			return new FetchArgs(args);
		} else {
			// Logging
			LogService.log(LogActions.VALIDATE, { target: 'POST_ARGS' });

			return new PostArgs(args);
		}
	}

	/**
	 * Introduces a delay using the configured delay/delay function.
	 */
	private async _wait(): Promise<void> {
		// If no delay is set, skip
		if (!this._delay) {
			return;
		}

		/** The delay (in ms) to use. */
		const delay = typeof this._delay == 'number' ? this._delay : await this._delay();

		// Awaiting for the delay time
		await this._sleep(delay);
	}

	/**
	 * Makes an HTTP request according to the given parameters.
	 *
	 * @param resource - The requested resource.
	 * @param args - The args to be used for the request.
	 * @param signal - An optional signal used to abort the request.
	 *
	 * @typeParam T - The type of the returned response data.
	 *
	 * @returns The raw Axios response.
	 *
	 * @remarks
	 * <br>
	 * - The response of a streamed resource is a readable stream of Server-Sent Events.
	 * - The response of a binary resource is an `ArrayBuffer`.
	 * - A `401` response is retried once, after renewing the access token (if a session token is available).
	 * - Up to `maxRetries` retries, with an exponential back-off (1 s, 2 s, 4 s, ... up to 15 s):
	 *   - `GET`, `HEAD`, `PUT`, `DELETE`: network errors, `408`, `429` and `5xx` responses.
	 *   - `POST`, `PATCH` (not idempotent, e.g, sending a message): only errors where the request
	 *     certainly did not reach the server (`ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`), and `429` / `503`
	 *     responses, so that a message is never sent twice.
	 *   - A `429` response caused by an exhausted chat budget is never retried.
	 * - An aborted request is never retried: the cancellation error is thrown as is.
	 *
	 * @example
	 *
	 * #### Fetching the raw details of the authenticated user
	 * ```ts
	 * import { FetcherService, FranceStudentConfig, ResourceType } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FetcherService instance using the given 'SESSION_TOKEN'
	 * const fetcher = new FetcherService(new FranceStudentConfig({ sessionToken: SESSION_TOKEN }));
	 *
	 * // Fetching the details of the authenticated user
	 * fetcher.request(ResourceType.USER_DETAILS, {})
	 * .then(res => {
	 * 	console.log(res.data);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async request<T = unknown>(
		resource: ResourceType,
		args: IFetchArgs | IPostArgs,
		signal?: AbortSignal,
	): Promise<AxiosResponse<T>> {
		/** The current retry number. */
		let retry = 0;

		/** Whether the access token has already been renewed after a 401. */
		let renewed = false;

		// Logging
		LogService.log(LogActions.REQUEST, { resource: resource, args: redactArgs(args) });

		// Checking authorization for the requested resource
		this._checkAuthorization(resource);

		// Validating args
		const validArgs = this._validateArgs(resource, args);

		// Getting request configuration
		const config = Requests[resource](validArgs);

		config.baseURL = this.config.apiUrl;
		config.signal = signal;

		if (StreamResourcesGroup.includes(resource)) {
			config.responseType = 'stream';
			config.timeout = 0;
			// eslint-disable-next-line @typescript-eslint/naming-convention
			config.headers = { Accept: 'text/event-stream', ...config.headers };
		} else if (BinaryResourcesGroup.includes(resource)) {
			config.responseType = 'arraybuffer';
			// eslint-disable-next-line @typescript-eslint/naming-convention
			config.headers = { Accept: '*/*', ...config.headers };
		}

		while (true) {
			try {
				// Setting the headers, with an up-to-date access token
				config.headers = {
					...this.config.headers,
					...config.headers,
					...(AllowGuestAuthenticationGroup.includes(resource) && !this.config.hasCredentials
						? {}
						: await this.config.auth.getAuthHeaders()),
				};

				// Introducing a delay
				await this._wait();

				// Getting the response
				const response = await this.config.instance.request<T>(config);

				// Calling the response middleware, if configured
				if (this.config.responseMiddleware !== undefined) {
					await this.config.responseMiddleware(response);
				}

				return response;
			} catch (error) {
				// Cancellations are neither retried nor converted
				if (isCancel(error) || signal?.aborted) {
					throw error;
				}

				// Renewing the access token once, if it was rejected
				if (isAxiosError(error) && error.response?.status === 401 && !renewed && this.config.auth.canRenew) {
					renewed = true;
					await this._readErrorBody(error);

					// Logging
					LogService.log(LogActions.RETRY, { resource: resource, reason: 'ACCESS_TOKEN_REJECTED' });

					await this.config.auth.getAccessToken(true);
					continue;
				}

				await this._readErrorBody(error);

				// Retrying transient errors
				if (retry < this.config.maxRetries && this._isRetryable(error, config.method)) {
					retry++;

					// Logging
					LogService.log(LogActions.RETRY, {
						resource: resource,
						retry: retry,
						status: (error as AxiosError).response?.status,
					});

					// Backing off, since the server may still be busy with the previous attempt
					await this._sleep(Math.min(1000 * 2 ** (retry - 1), 15_000), signal);

					continue;
				}

				// Delegating error handling
				this._errorHandler.handle(error);

				throw error;
			}
		}
	}
}
