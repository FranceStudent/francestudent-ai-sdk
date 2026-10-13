/**
 * Represents a raw session of the user.
 *
 * @public
 */
export interface IUserSession {
	id: string;
	since?: string;
	os?: string;
	location?: string;
}
