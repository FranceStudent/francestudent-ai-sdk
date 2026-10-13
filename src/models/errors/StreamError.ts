/**
 * The reason a chat stream failed.
 *
 * @public
 */
export type StreamErrorReason = 'FAILED' | 'TIMEOUT';

/**
 * The error thrown when a chat stream reports a failure, or times out.
 *
 * @public
 */
export class StreamError extends Error {
	/** The raw error payload sent in the stream, if any. */
	public details: unknown;

	/** Why the stream failed: reported by the server (`FAILED`), or timed out (`TIMEOUT`). */
	public reason: StreamErrorReason;

	/**
	 * @param details - The raw error payload sent in the stream.
	 * @param reason - Why the stream failed.
	 */
	public constructor(details: unknown, reason: StreamErrorReason = 'FAILED') {
		const payload = details as { message?: unknown; error?: { message?: unknown } } | undefined;
		const message =
			typeof payload?.message === 'string'
				? payload.message
				: typeof payload?.error?.message === 'string'
					? payload.error.message
					: JSON.stringify(details);

		super(reason === 'TIMEOUT' ? message : `Stream error: ${message}`);
		this.name = 'STREAM_ERROR';
		this.details = details;
		this.reason = reason;
	}

	/**
	 * Creates the error reported when a stream times out.
	 *
	 * @param message - The description of the timeout.
	 *
	 * @returns The error.
	 */
	public static timeout(message: string): StreamError {
		return new StreamError({ message: `Stream timed out: ${message}` }, 'TIMEOUT');
	}
}
