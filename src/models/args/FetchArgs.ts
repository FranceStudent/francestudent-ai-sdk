import { SortOrder } from '../../enums/Data';
import { IFetchArgs } from '../../types/args/FetchArgs';

/**
 * Options specifying the data that is to be fetched.
 *
 * @public
 */
export class FetchArgs implements IFetchArgs {
	public chatId?: string;
	public count?: number;
	public cursor?: string;
	public days?: number;
	public domain?: string;
	public flags?: string[];
	public id?: string;
	public imageId?: string;
	public includeDisabled?: boolean;
	public lastEventId?: string;
	public messageId?: string;
	public order?: SortOrder;
	public purpose?: string;
	public query?: string;
	public sortBy?: string;
	public version?: string;

	/**
	 * @param args - Additional user-defined arguments for fetching the resource.
	 */
	public constructor(args: IFetchArgs) {
		if (args.count !== undefined && (!Number.isInteger(args.count) || args.count < 1)) {
			throw new Error(`Invalid count '${args.count}', it must be a positive integer`);
		}

		Object.assign(this, args);
	}
}
