import { IChatSummary } from '../base/Chat';

/**
 * Represents a raw page of chats.
 *
 * @public
 */
export interface IChatHistory {
	chats: IChatSummary[];
	hasMore: boolean;
}
