/**
 * Represents the raw error body returned by the API.
 *
 * @remarks The API does not use a single error format; all known shapes are covered.
 *
 * @public
 */
export interface IErrorData {
	error?: boolean | string;
	message?: string;
	status?: number;
	path?: string;
	timestamp?: string;
	detail?: string;
	title?: string;
}
