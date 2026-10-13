import { IAgent } from './Agent';
import { IMessage } from './Message';
import { ITokenUsage } from './TokenUsage';

/**
 * The details of a single chat.
 *
 * @public
 */
export interface IChat {
	/** The agent of the chat, when known. */
	agent?: IAgent;

	/** The ID of the agent of the chat. */
	agentId?: number;

	/** The date and time of creation of the chat, in UTC string format. */
	createdAt: string;

	/** The raw flags (bit field) of the chat. */
	flags: number;

	/** The ID of the chat. */
	id: string;

	/** Whether the chat is archived, when known. */
	isArchived?: boolean;

	/** Whether the chat is pinned, when known. */
	isPinned?: boolean;

	/** Whether the chat is private, when known. */
	isPrivate?: boolean;

	/** The date and time of the last message, in UTC string format. */
	lastMessageAt?: string;

	/** The messages of the chat, when fetched with the details of the chat. */
	messages?: IMessage[];

	/** The ID of the project the chat belongs to, if any. */
	projectId?: string;

	/** The title of the chat. */
	title?: string;

	/** The token usage of the chat. */
	tokenUsage?: ITokenUsage;
}

/**
 * The token usage of a chat.
 *
 * @public
 */
export interface IChatUsage {
	/** The share of the context window used, in percent. */
	contextUsagePercent?: number;

	/** The token usage of the chat. */
	tokenUsage?: ITokenUsage;
}

/**
 * The complete response of an agent, obtained by consuming a chat stream.
 *
 * @public
 */
export interface IChatResponse {
	/** The ID of the chat. */
	chatId?: string;

	/** The text of the response. */
	content: string;

	/** The final message, if the stream returned it. */
	message?: IMessage;
}
