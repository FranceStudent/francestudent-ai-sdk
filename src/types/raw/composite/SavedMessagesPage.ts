import { ISavedMessage } from '../base/Message';

/**
 * Represents a raw page of saved messages.
 *
 * @public
 */
export interface ISavedMessagesPage {
	savedMessages: ISavedMessage[];
	hasMore: boolean;
	nextCursor?: string;
}
