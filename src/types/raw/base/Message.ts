import { ITokenUsage } from './TokenUsage';

/**
 * Represents the raw data of a single chat message.
 *
 * @public
 */
export interface IChatMessage {
	id: string;
	chatId: string;
	userId?: number;
	agentId?: number;
	model?: string;
	modelProvider?: string;
	role: string;
	content: string;
	createdAt: string;
	isUpvoted?: boolean;
	webSearchDomains?: string[];
	tokenUsage?: ITokenUsage;
	usedFileIds?: string[];
	usedFilesV2Ids?: string[];
	parts?: unknown;
}

/**
 * Represents the raw data of a saved message.
 *
 * @public
 */
export interface ISavedMessage {
	id: string;
	chatId: string;
	messageId: string;
	savedAt: string;
	message?: IChatMessage;
}
