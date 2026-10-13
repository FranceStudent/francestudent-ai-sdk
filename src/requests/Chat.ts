import { AxiosRequestConfig } from 'axios';

import { IChatUpdates, IConversationImportOptions, INewChat, INewMessage, IShareTarget } from '../types/args/PostArgs';

/**
 * Collection of requests related to agents and chats.
 *
 * @public
 */
export class ChatRequests {
	/**
	 * @param includeDisabled - Whether to include disabled agents.
	 */
	public static agents(includeDisabled?: boolean): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/chats/agents',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			params: { 'include-disabled': includeDisabled },
		};
	}

	/**
	 * @param id - The ID of the chat to archive.
	 */
	public static archive(id: string): AxiosRequestConfig {
		return { method: 'put', url: `/chats/${encodeURIComponent(id)}/archive` };
	}

	/**
	 * @param count - The number of chats to fetch.
	 * @param cursor - The ID of the last chat of the previous batch.
	 */
	public static archived(count?: number, cursor?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/chats/archived',
			/* eslint-disable @typescript-eslint/naming-convention */
			params: { limit: count, cursor_chat_id: cursor || undefined },
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * @param id - The ID of the target chat.
	 * @param lastEventId - The ID of the last event received, to resume from.
	 */
	public static attach(id: string, lastEventId?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: `/chats/${encodeURIComponent(id)}/stream`,
			/* eslint-disable @typescript-eslint/naming-convention */
			params: { last_event_id: lastEventId },
			headers: lastEventId !== undefined ? { 'Last-Event-ID': lastEventId } : {},
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * @param id - The ID of the chat whose generation is to be stopped.
	 */
	public static cancel(id: string): AxiosRequestConfig {
		return { method: 'post', url: `/chats/${encodeURIComponent(id)}/stream/cancel` };
	}

	/**
	 * @param chat - The chat to create.
	 */
	public static create(chat: INewChat): AxiosRequestConfig {
		return {
			method: 'post',
			url: '/chats/stream',
			data: {
				agentId: chat.agentId,
				chatId: chat.chatId ?? null,
				enableCanvas: chat.enableCanvas ?? false,
				enableWebSearch: chat.enableWebSearch ?? false,
				files: chat.files ?? [],
				images: chat.images ?? [],
				initialContent: chat.content,
				isIncognito: chat.isIncognito ?? false,
				isPrivate: chat.isPrivate ?? true,
				...(chat.projectId !== undefined ? { projectId: chat.projectId } : {}),
			},
		};
	}

	/**
	 * @param id - The ID of the chat to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/chats/${encodeURIComponent(id)}` };
	}

	/**
	 * Deletes all the chats of the user.
	 */
	public static deleteAll(): AxiosRequestConfig {
		return { method: 'delete', url: '/chats' };
	}

	/**
	 * @param id - The ID of the target chat.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/chats/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the archived chat to download.
	 */
	public static download(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/chats/${encodeURIComponent(id)}/archive/download` };
	}

	/**
	 * @param options - The shared conversation to import.
	 */
	public static importOpenAi(options: IConversationImportOptions): AxiosRequestConfig {
		return {
			method: 'post',
			url: '/conversation-imports/openai',
			data: { link: options.link, model: options.model },
		};
	}

	/**
	 * @param count - The number of chats to fetch.
	 * @param cursor - The ID of the last chat of the previous batch.
	 * @param sortBy - The sort key.
	 */
	public static list(count?: number, cursor?: string, sortBy?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/chats',
			/* eslint-disable @typescript-eslint/naming-convention */
			params: { limit: count ?? 20, cursor_chat_id: cursor || undefined, sortedBy: sortBy },
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * Lists the available models.
	 */
	public static models(): AxiosRequestConfig {
		return { method: 'get', url: '/models' };
	}

	/**
	 * @param id - The ID of the chat to pin.
	 */
	public static pin(id: string): AxiosRequestConfig {
		return { method: 'put', url: `/chats/${encodeURIComponent(id)}/pins` };
	}

	/**
	 * @param id - The ID of the archived chat to restore.
	 */
	public static restore(id: string): AxiosRequestConfig {
		return { method: 'put', url: `/chats/${encodeURIComponent(id)}/restore` };
	}

	/**
	 * @param query - The text to search for.
	 * @param count - The number of chats to fetch.
	 */
	public static search(query: string, count?: number): AxiosRequestConfig {
		return { method: 'get', url: '/chats/search', params: { query: query, limit: count } };
	}

	/**
	 * @param id - The ID of the target chat.
	 * @param message - The message to send.
	 */
	public static send(id: string, message: INewMessage): AxiosRequestConfig {
		return {
			method: 'post',
			url: `/chats/${encodeURIComponent(id)}`,
			data: {
				content: message.content,
				enableWebSearch: message.enableWebSearch ?? false,
				files: message.files ?? [],
				images: message.images ?? [],
				...(message.agentId !== undefined ? { agentId: message.agentId } : {}),
			},
		};
	}

	/**
	 * @param id - The ID of the target chat.
	 * @param share - The user to share the chat with, and the permission.
	 */
	public static shareAdd(id: string, share: IShareTarget): AxiosRequestConfig {
		return {
			method: 'post',
			url: `/chats/${encodeURIComponent(id)}/shares`,
			data: { userId: share.userId, userEmail: share.userEmail, permission: share.permission ?? 'View' },
		};
	}

	/**
	 * @param id - The ID of the target chat.
	 * @param share - The user to stop sharing the chat with.
	 */
	public static shareRemove(id: string, share: IShareTarget): AxiosRequestConfig {
		return {
			method: 'delete',
			url: `/chats/${encodeURIComponent(id)}/shares`,
			data: { userId: share.userId, userEmail: share.userEmail },
		};
	}

	/**
	 * @param id - The ID of the target chat.
	 * @param share - The user whose permission is to be updated, and the new permission.
	 */
	public static shareUpdate(id: string, share: IShareTarget): AxiosRequestConfig {
		return {
			method: 'patch',
			url: `/chats/${encodeURIComponent(id)}/shares`,
			data: { userId: share.userId, userEmail: share.userEmail, permission: share.permission ?? 'View' },
		};
	}

	/**
	 * @param id - The ID of the target chat.
	 */
	public static shares(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/chats/${encodeURIComponent(id)}/shares` };
	}

	/**
	 * @param id - The ID of the chat to unpin.
	 */
	public static unpin(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/chats/${encodeURIComponent(id)}/pins` };
	}

	/**
	 * @param id - The ID of the chat to update.
	 * @param updates - The updates to apply.
	 */
	public static update(id: string, updates: IChatUpdates): AxiosRequestConfig {
		return { method: 'patch', url: `/chats/${encodeURIComponent(id)}`, data: { ...updates } };
	}

	/**
	 * @param id - The ID of the target chat.
	 */
	public static usage(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/chats/${encodeURIComponent(id)}/usage` };
	}
}
