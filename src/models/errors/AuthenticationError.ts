/**
 * The error thrown when authenticating (log in, access token renewal) fails.
 *
 * @public
 */
export class AuthenticationError extends Error {
	/** Whether a new log in is required to recover. */
	public needsLogin: boolean;

	/** The HTTP status code, if any. */
	public status?: number;

	/**
	 * @param message - The error message.
	 * @param status - The HTTP status code, if any.
	 * @param needsLogin - Whether a new log in is required to recover.
	 */
	public constructor(message: string, status?: number, needsLogin = false) {
		super(message);
		this.name = 'AUTHENTICATION_ERROR';
		this.status = status;
		this.needsLogin = needsLogin;
	}
}
