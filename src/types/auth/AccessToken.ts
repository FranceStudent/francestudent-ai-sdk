/**
 * The access token returned by the web application, in exchange for a session token.
 *
 * @public
 */
export interface IAccessToken {
	/** The access token (JWT). */
	accessToken: string;

	/** The expiration date, in seconds since the epoch. */
	expiresAt?: number;

	/** The lifetime of the token, in seconds. */
	expiresIn?: number;

	/** The type of token (`Bearer`). */
	tokenType?: string;
}
