import { SortOrder } from '../../enums/Data';

/**
 * Options specifying the data that is to be fetched.
 *
 * @public
 */
export interface IFetchArgs {
	/** The ID of the target resource (chat, project, file, skill, MCP server, transcript, memory, ...). */
	id?: string;

	/** The ID of the target chat, when it is not the main target. */
	chatId?: string;

	/** The ID of the target message. */
	messageId?: string;

	/** The ID of the target image. */
	imageId?: string;

	/** The version of the target skill. */
	version?: string;

	/** The number of items to fetch. */
	count?: number;

	/** The cursor to the batch of data to fetch. */
	cursor?: string;

	/** The text to search for, or to filter with. */
	query?: string;

	/** The sort key to use. */
	sortBy?: string;

	/** The sort order to use. */
	order?: SortOrder;

	/** The purpose of files to filter with. */
	purpose?: string;

	/** Whether to include disabled agents. */
	includeDisabled?: boolean;

	/** The number of days of history to fetch. */
	days?: number;

	/** The web domain to filter with. */
	domain?: string;

	/** The ID of the last stream event received, to resume a stream from. */
	lastEventId?: string;

	/** The flags to filter with. */
	flags?: string[];
}
