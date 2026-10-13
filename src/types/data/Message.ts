import { ITokenUsage } from './TokenUsage';

/**
 * The details of a single chat message.
 *
 * @public
 */
export interface IMessage {
	/** The ID of the agent which wrote the message, for assistant messages. */
	agentId?: number;

	/** The ID of the chat the message belongs to. */
	chatId: string;

	/** The text of the message. */
	content: string;

	/** The date and time of creation of the message, in UTC string format. */
	createdAt: string;

	/** The ID of the message. */
	id: string;

	/** Whether the message was upvoted (`true`), downvoted (`false`), or not voted. */
	isUpvoted?: boolean;

	/** The model which wrote the message, for assistant messages. */
	model?: string;

	/** The structured parts of the message (tool calls, images, ...), as returned by the API. */
	parts?: unknown;

	/** The provider of the model. */
	provider?: string;

	/** The author of the message (`user`, `assistant`, ...). */
	role: string;

	/** The token usage of the message. */
	tokenUsage?: ITokenUsage;

	/** The IDs of the files used to write the message. */
	usedFileIds: string[];

	/** The web domains searched to write the message. */
	webSearchDomains: string[];
}

/**
 * The details of a saved message.
 *
 * @public
 */
export interface ISavedMessage {
	/** The ID of the chat. */
	chatId: string;

	/** The ID of the saved entry. */
	id: string;

	/** The saved message. */
	message?: IMessage;

	/** The ID of the message. */
	messageId: string;

	/** The date and time at which the message was saved, in UTC string format. */
	savedAt: string;
}
