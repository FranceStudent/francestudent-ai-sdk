import { IAgent, IAgentId } from './Agent';
import { IChatMessage } from './Message';
import { ITokenUsage } from './TokenUsage';
import { IUserDocument } from './User';

/**
 * Represents the raw summary of a chat, as returned in chat lists.
 *
 * @public
 */
export interface IChatSummary {
	id: string;
	projectId?: string;
	title?: string;
	flags?: number;
	isPrivate?: boolean;
	isPinned?: boolean;
	createdAt: string;
	agent?: IAgent;
	lastMessageAt?: string;
	tokenUsage?: ITokenUsage;
	sharePermissionFlags?: number;
}

/**
 * Represents the raw details of a chat, including its messages.
 *
 * @public
 */
export interface IChatDetail {
	id: string;
	projectId?: string;
	title?: string;
	flags?: number;
	createdAt: string;
	agent?: IAgentId;
	chatMessages?: IChatMessage[];
	lastMessageAt?: string;
}

/**
 * Represents the raw chat document, as returned after an update.
 *
 * @public
 */
export interface IChatDocument {
	id: string;
	title?: string;
	flags?: number;
	createdAt: string;
	agentId?: number;
	model?: string;
	modelProvider?: string;
	userId?: number;
	projectId?: string;
	lastMessageAt?: string;
	remoteConversationId?: string;
	remoteLastResponseId?: string;
	agent?: IAgent;
	user?: IUserDocument;
	chatMessages?: IChatMessage[];
	tokenUsage?: ITokenUsage;
	chatFlags?: string[];
	isApi?: boolean;
	isDeleted?: boolean;
	isEphemeral?: boolean;
	isArchived?: boolean;
	isPrivate?: boolean;
	isPinned?: boolean;
}

/**
 * Represents the raw token usage of a chat.
 *
 * @public
 */
export interface IChatUsage {
	tokenUsage?: ITokenUsage;
	contextUsagePercent?: number;
}

/**
 * Represents the raw result of importing a shared OpenAI conversation.
 *
 * @public
 */
export interface IConversationImport {
	chatId: string;
	title?: string;
	source?: string;
	sourceConversationId?: string;
	sourceModel?: string;
	localModel?: string;
	importedMessagesCount?: number;
	importedAt?: string;
}
