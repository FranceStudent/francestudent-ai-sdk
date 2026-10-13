import { IMessage, ISavedMessage } from '../../types/data/Message';
import { IChatMessage as IRawMessage, ISavedMessage as IRawSavedMessage } from '../../types/raw/base/Message';

import { TokenUsage } from './TokenUsage';

/**
 * The details of a single chat message.
 *
 * @public
 */
export class Message implements IMessage {
	/** The raw message details. */
	private readonly _raw: IRawMessage;

	public agentId?: number;
	public chatId: string;
	public content: string;
	public createdAt: string;
	public id: string;
	public isUpvoted?: boolean;
	public model?: string;
	public parts?: unknown;
	public provider?: string;
	public role: string;
	public tokenUsage?: TokenUsage;
	public usedFileIds: string[];
	public webSearchDomains: string[];

	/**
	 * @param message - The raw message details.
	 */
	public constructor(message: IRawMessage) {
		this._raw = { ...message };
		this.id = message.id;
		this.chatId = message.chatId;
		this.role = message.role;
		this.content = message.content ?? '';
		this.createdAt = message.createdAt ? new Date(message.createdAt).toISOString() : '';
		this.agentId = message.agentId ?? undefined;
		this.model = message.model ?? undefined;
		this.provider = message.modelProvider ?? undefined;
		this.isUpvoted = message.isUpvoted ?? undefined;
		this.parts = message.parts ?? undefined;
		this.tokenUsage = TokenUsage.optional(message.tokenUsage);
		this.usedFileIds = [...(message.usedFileIds ?? []), ...(message.usedFilesV2Ids ?? [])];
		this.webSearchDomains = message.webSearchDomains ?? [];
	}

	/** The raw message details. */
	public get raw(): IRawMessage {
		return { ...this._raw };
	}

	/**
	 * Deserializes a list of raw messages.
	 *
	 * @param messages - The raw messages.
	 *
	 * @returns The deserialized messages.
	 */
	public static list(messages?: IRawMessage[] | null): Message[] {
		return (messages ?? []).filter((item) => item?.id !== undefined).map((item) => new Message(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IMessage {
		return {
			agentId: this.agentId,
			chatId: this.chatId,
			content: this.content,
			createdAt: this.createdAt,
			id: this.id,
			isUpvoted: this.isUpvoted,
			model: this.model,
			parts: this.parts,
			provider: this.provider,
			role: this.role,
			tokenUsage: this.tokenUsage?.toJSON(),
			usedFileIds: this.usedFileIds,
			webSearchDomains: this.webSearchDomains,
		};
	}
}

/**
 * The details of a saved message.
 *
 * @public
 */
export class SavedMessage implements ISavedMessage {
	public chatId: string;
	public id: string;
	public message?: Message;
	public messageId: string;
	public savedAt: string;

	/**
	 * @param saved - The raw saved message.
	 */
	public constructor(saved: IRawSavedMessage) {
		this.id = saved.id;
		this.chatId = saved.chatId;
		this.messageId = saved.messageId;
		this.savedAt = saved.savedAt ? new Date(saved.savedAt).toISOString() : '';
		this.message = saved.message ? new Message(saved.message) : undefined;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ISavedMessage {
		return {
			chatId: this.chatId,
			id: this.id,
			message: this.message?.toJSON(),
			messageId: this.messageId,
			savedAt: this.savedAt,
		};
	}
}
