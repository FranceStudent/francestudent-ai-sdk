import { AxiosRequestConfig } from 'axios';

import { IProjectUpdates, IShareTarget } from '../types/args/PostArgs';

/**
 * Collection of requests related to projects.
 *
 * @public
 */
export class ProjectRequests {
	/**
	 * @param id - The ID of the target project.
	 * @param count - The number of chats to fetch.
	 * @param cursor - The ID of the last chat of the previous batch.
	 */
	public static chats(id: string, count?: number, cursor?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: `/projects/${encodeURIComponent(id)}/chats`,
			/* eslint-disable @typescript-eslint/naming-convention */
			params: { limit: count, cursor_chat_id: cursor || undefined },
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * @param name - The name of the project to create.
	 */
	public static create(name: string): AxiosRequestConfig {
		return { method: 'post', url: '/projects', data: { name: name } };
	}

	/**
	 * @param id - The ID of the project to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/projects/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the target project.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/projects/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the target project.
	 * @param chatId - The ID of the chat to add to the project.
	 */
	public static linkChat(id: string, chatId: string): AxiosRequestConfig {
		return {
			method: 'put',
			url: `/projects/${encodeURIComponent(id)}/chats/${encodeURIComponent(chatId)}`,
		};
	}

	/**
	 * Lists the projects of the user.
	 */
	public static list(): AxiosRequestConfig {
		return { method: 'get', url: '/projects' };
	}

	/**
	 * @param id - The ID of the target project.
	 * @param share - The user to share the project with.
	 */
	public static shareAdd(id: string, share: IShareTarget): AxiosRequestConfig {
		return {
			method: 'post',
			url: `/projects/${encodeURIComponent(id)}/shares`,
			data: { userEmail: share.userEmail },
		};
	}

	/**
	 * @param id - The ID of the target project.
	 * @param userId - The ID of the user to stop sharing the project with.
	 */
	public static shareRemove(id: string, userId: number): AxiosRequestConfig {
		return {
			method: 'delete',
			url: `/projects/${encodeURIComponent(id)}/shares/${encodeURIComponent(String(userId))}`,
		};
	}

	/**
	 * Lists the projects shared with the user.
	 */
	public static shared(): AxiosRequestConfig {
		return { method: 'get', url: '/projects/shared' };
	}

	/**
	 * @param id - The ID of the target project.
	 */
	public static shares(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/projects/${encodeURIComponent(id)}/shares` };
	}

	/**
	 * @param id - The ID of the target project.
	 * @param chatId - The ID of the chat to remove from the project.
	 */
	public static unlinkChat(id: string, chatId: string): AxiosRequestConfig {
		return {
			method: 'delete',
			url: `/projects/${encodeURIComponent(id)}/chats/${encodeURIComponent(chatId)}`,
		};
	}

	/**
	 * @param id - The ID of the project to update.
	 * @param updates - The updates to apply.
	 */
	public static update(id: string, updates: IProjectUpdates): AxiosRequestConfig {
		return { method: 'patch', url: `/projects/${encodeURIComponent(id)}`, data: { ...updates } };
	}
}
