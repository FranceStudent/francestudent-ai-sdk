import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { Chat } from '../../models/data/Chat';
import { CursoredData } from '../../models/data/CursoredData';
import { Message, SavedMessage } from '../../models/data/Message';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IChatDetail } from '../../types/raw/base/Chat';
import { IChatMessage, ISavedMessage } from '../../types/raw/base/Message';
import { ISavedMessagesPage } from '../../types/raw/composite/SavedMessagesPage';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to messages.
 *
 * @public
 */
export class MessageService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Edit a message, which forks the chat from that message.
	 *
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message to edit.
	 * @param content - The new content of the message.
	 *
	 * @returns The forked chat.
	 */
	public async edit(chatId: string, messageId: string, content: string): Promise<Chat | undefined> {
		const resource = ResourceType.MESSAGE_EDIT;

		// Editing the message
		const response = await this.request<IChatDetail>(resource, {
			chatId: chatId,
			messageId: messageId,
			content: content,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Download an image generated in a message.
	 *
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message.
	 * @param imageId - The ID of the image.
	 *
	 * @returns The content of the image.
	 */
	public async image(chatId: string, messageId: string, imageId: string): Promise<Buffer> {
		const resource = ResourceType.MESSAGE_IMAGE;

		// Downloading the image
		const response = await this.request<ArrayBuffer>(resource, {
			chatId: chatId,
			messageId: messageId,
			imageId: imageId,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Save a message.
	 *
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message to save.
	 *
	 * @returns The saved message.
	 */
	public async save(chatId: string, messageId: string): Promise<SavedMessage> {
		const resource = ResourceType.MESSAGE_SAVE;

		// Saving the message
		const response = await this.request<ISavedMessage>(resource, { chatId: chatId, messageId: messageId });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of saved messages.
	 *
	 * @param count - The number of saved messages to fetch.
	 * @param cursor - The cursor to the batch of saved messages to fetch.
	 *
	 * @returns The batch of saved messages.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the saved messages
	 * fs.message.saved()
	 * .then(res => {
	 * 	console.log(res.list, res.next);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async saved(count?: number, cursor?: string): Promise<CursoredData<SavedMessage>> {
		const resource = ResourceType.MESSAGE_SAVED;

		// Fetching raw list of saved messages
		const response = await this.request<ISavedMessagesPage>(resource, { count: count, cursor: cursor });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Unsave a message.
	 *
	 * @param chatId - The ID of the chat.
	 * @param messageId - The ID of the message to unsave.
	 */
	public async unsave(chatId: string, messageId: string): Promise<void> {
		const resource = ResourceType.MESSAGE_UNSAVE;

		// Unsaving the message
		await this.request(resource, { chatId: chatId, messageId: messageId });
	}

	/**
	 * Upvote or downvote a message.
	 *
	 * @param messageId - The ID of the message.
	 * @param isUpvoted - Whether the message is upvoted (`true`) or downvoted (`false`).
	 *
	 * @returns The updated message.
	 */
	public async vote(messageId: string, isUpvoted: boolean): Promise<Message> {
		const resource = ResourceType.MESSAGE_VOTE;

		// Voting on the message
		const response = await this.request<IChatMessage>(resource, { messageId: messageId, isUpvoted: isUpvoted });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
