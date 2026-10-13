/**
 * The different types of api error messages.
 *
 * @public
 */
export enum ApiErrors {
	BAD_AUTHENTICATION = 'Invalid authentication data',
	COULD_NOT_AUTHENTICATE = 'Failed to authenticate',
	EMPTY_STREAM = 'The stream ended without any response',
	RESOURCE_NOT_ALLOWED = 'Not authorized to access requested resource, a session token or an access token is required',
	SESSION_EXPIRED = 'The session is invalid or has expired, log in again',
}
