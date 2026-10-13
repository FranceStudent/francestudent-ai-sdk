/**
 * The error thrown by the FranceStudent API.
 *
 * @public
 */
export interface IFranceStudentError extends Error {
	/** The raw response body, if any. */
	body?: unknown;

	/** The network error code (e.g, `ECONNREFUSED`, `ETIMEDOUT`), for failures without a response. */
	code?: string;

	/** The error message in the response. */
	message: string;

	/** The name of the error. */
	name: string;

	/** The date and time at which a rate limit or a budget resets, if known. */
	resetAt?: string;

	/** The response status code, or `0` if no response was received (network failure). */
	status: number;
}
