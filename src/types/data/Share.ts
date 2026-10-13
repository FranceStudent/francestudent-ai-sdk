import { SharePermission } from '../../enums/Data';

/**
 * The access of a user to a shared chat or project.
 *
 * @public
 */
export interface IShare {
	/** Whether the user is the owner. */
	isOwner: boolean;

	/** The permission of the user. */
	permission: SharePermission;

	/** The email address of the user. */
	userEmail: string;

	/** The ID of the user. */
	userId: number;
}
