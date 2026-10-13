import { AxiosRequestConfig } from 'axios';

/**
 * Collection of requests related to messages.
 *
 * @public
 */
export class MessageRequests {
	/**
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message to edit.
	 * @param content - The new content of the message.
	 */
	public static edit(chatId: string, messageId: string, content: string): AxiosRequestConfig {
		return {
			method: 'patch',
			url: `/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`,
			data: { content: content },
		};
	}

	/**
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message.
	 * @param imageId - The ID of the generated image.
	 */
	public static image(chatId: string, messageId: string, imageId: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: `/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/images/${encodeURIComponent(imageId)}`,
		};
	}

	/**
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message to save.
	 */
	public static save(chatId: string, messageId: string): AxiosRequestConfig {
		return {
			method: 'put',
			url: `/user/@me/saved-messages/${encodeURIComponent(chatId)}/${encodeURIComponent(messageId)}`,
		};
	}

	/**
	 * @param count - The number of saved messages to fetch.
	 * @param cursor - The cursor to the batch of saved messages to fetch.
	 */
	public static saved(count?: number, cursor?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/user/@me/saved-messages',
			params: { limit: count, cursor: cursor || undefined },
		};
	}

	/**
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message to unsave.
	 */
	public static unsave(chatId: string, messageId: string): AxiosRequestConfig {
		return {
			method: 'delete',
			url: `/user/@me/saved-messages/${encodeURIComponent(chatId)}/${encodeURIComponent(messageId)}`,
		};
	}

	/**
	 * @param messageId - The ID of the message to vote on.
	 * @param isUpvoted - Whether the message is upvoted (`true`) or downvoted (`false`).
	 */
	public static vote(messageId: string, isUpvoted: boolean): AxiosRequestConfig {
		return {
			method: 'patch',
			url: `/messages/${encodeURIComponent(messageId)}`,
			data: { isUpvoted: isUpvoted },
		};
	}
}
