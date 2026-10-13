/**
 * Represents the raw access of a user to a shared chat or project.
 *
 * @public
 */
export interface IShareAccess {
	userId: number;
	userEmail: string;
	permission: 'View' | 'Write';
	owner: boolean;
}
