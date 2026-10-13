import { SharePermission } from '../../enums/Data';
import { IShare } from '../../types/data/Share';
import { IShareAccess as IRawShare } from '../../types/raw/base/Share';

/**
 * The access of a user to a shared chat or project.
 *
 * @public
 */
export class Share implements IShare {
	public isOwner: boolean;
	public permission: SharePermission;
	public userEmail: string;
	public userId: number;

	/**
	 * @param share - The raw share details.
	 */
	public constructor(share: IRawShare) {
		this.userId = share.userId;
		this.userEmail = share.userEmail;
		this.permission = share.permission === 'Write' ? SharePermission.WRITE : SharePermission.VIEW;
		this.isOwner = share.owner ?? false;
	}

	/**
	 * Deserializes a list of raw shares.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized shares.
	 */
	public static list(response: IRawShare[]): Share[] {
		return (Array.isArray(response) ? response : []).map((item) => new Share(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IShare {
		return {
			isOwner: this.isOwner,
			permission: this.permission,
			userEmail: this.userEmail,
			userId: this.userId,
		};
	}
}
