import { IChat, IChatResponse, IChatUsage } from '../../types/data/Chat';
import { IChatDetail, IChatDocument, IChatSummary, IChatUsage as IRawChatUsage } from '../../types/raw/base/Chat';
import { IChatHistory } from '../../types/raw/composite/ChatHistory';

import { Agent } from './Agent';
import { CursoredData } from './CursoredData';
import { Message } from './Message';
import { TokenUsage } from './TokenUsage';

/**
 * Any of the raw formats of a chat.
 *
 * @public
 */
export type RawChat = IChatSummary | IChatDetail | IChatDocument;

/**
 * The details of a single chat.
 *
 * @public
 */
export class Chat implements IChat {
	/** The raw chat details. */
	private readonly _raw: RawChat;

	public agent?: Agent;
	public agentId?: number;
	public createdAt: string;
	public flags: number;
	public id: string;
	public isArchived?: boolean;
	public isPinned?: boolean;
	public isPrivate?: boolean;
	public lastMessageAt?: string;
	public messages?: Message[];
	public projectId?: string;
	public title?: string;
	public tokenUsage?: TokenUsage;

	/**
	 * @param chat - The raw chat details, in any of the formats returned by the API.
	 */
	public constructor(chat: RawChat) {
		const document = chat as IChatDocument;

		this._raw = { ...chat };
		this.id = chat.id;
		this.title = chat.title ?? undefined;
		this.projectId = chat.projectId ?? undefined;
		this.flags = chat.flags ?? 0;
		this.createdAt = chat.createdAt ? new Date(chat.createdAt).toISOString() : '';
		this.lastMessageAt = chat.lastMessageAt ? new Date(chat.lastMessageAt).toISOString() : undefined;
		this.agentId = document.agentId ?? chat.agent?.id;
		this.agent = document.agent?.name !== undefined ? new Agent(document.agent) : undefined;
		this.isPrivate = document.isPrivate ?? undefined;
		this.isPinned = document.isPinned ?? undefined;
		this.isArchived = document.isArchived ?? undefined;
		this.messages = 'chatMessages' in chat && chat.chatMessages ? Message.list(chat.chatMessages) : undefined;
		this.tokenUsage = TokenUsage.optional((chat as IChatSummary).tokenUsage);
	}

	/** The raw chat details. */
	public get raw(): RawChat {
		return { ...this._raw };
	}

	/**
	 * Deserializes a page of chats.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized page; the cursor to the next page is the ID of the last chat.
	 */
	public static history(response: IChatHistory): CursoredData<Chat> {
		const chats = (response?.chats ?? []).filter((item) => item?.id !== undefined).map((item) => new Chat(item));

		return new CursoredData(chats, response?.hasMore && chats.length ? chats[chats.length - 1].id : '');
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IChat {
		return {
			agent: this.agent?.toJSON(),
			agentId: this.agentId,
			createdAt: this.createdAt,
			flags: this.flags,
			id: this.id,
			isArchived: this.isArchived,
			isPinned: this.isPinned,
			isPrivate: this.isPrivate,
			lastMessageAt: this.lastMessageAt,
			messages: this.messages?.map((item) => item.toJSON()),
			projectId: this.projectId,
			title: this.title,
			tokenUsage: this.tokenUsage?.toJSON(),
		};
	}
}

/**
 * The token usage of a chat.
 *
 * @public
 */
export class ChatUsage implements IChatUsage {
	public contextUsagePercent?: number;
	public tokenUsage?: TokenUsage;

	/**
	 * @param usage - The raw chat usage.
	 */
	public constructor(usage: IRawChatUsage) {
		this.contextUsagePercent = usage?.contextUsagePercent ?? undefined;
		this.tokenUsage = TokenUsage.optional(usage?.tokenUsage);
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IChatUsage {
		return { contextUsagePercent: this.contextUsagePercent, tokenUsage: this.tokenUsage?.toJSON() };
	}
}

/**
 * The complete response of an agent, obtained by consuming a chat stream.
 *
 * @public
 */
export class ChatResponse implements IChatResponse {
	public chatId?: string;
	public content: string;
	public message?: Message;

	/**
	 * @param content - The text of the response.
	 * @param chatId - The ID of the chat.
	 * @param message - The final message, if any.
	 */
	public constructor(content: string, chatId?: string, message?: Message) {
		this.content = content;
		this.chatId = chatId;
		this.message = message;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IChatResponse {
		return { chatId: this.chatId, content: this.content, message: this.message?.toJSON() };
	}
}
