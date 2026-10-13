import { Readable } from 'stream';

import { AxiosResponse } from 'axios';

import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { Agent } from '../../models/data/Agent';
import { Chat, ChatResponse, ChatUsage } from '../../models/data/Chat';
import { ChatStream } from '../../models/data/ChatStream';
import { CursoredData } from '../../models/data/CursoredData';
import { Share } from '../../models/data/Share';
import { StreamError } from '../../models/errors/StreamError';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import {
	IChatUpdates,
	IConversationImportOptions,
	INewChat,
	INewMessage,
	IShareTarget,
} from '../../types/args/PostArgs';
import { IAgent as IRawAgent } from '../../types/raw/base/Agent';
import { IChatDetail, IChatDocument, IChatUsage, IConversationImport } from '../../types/raw/base/Chat';
import { IShareAccess } from '../../types/raw/base/Share';
import { IChatHistory } from '../../types/raw/composite/ChatHistory';

import { FetcherService } from './FetcherService';

/**
 * Optional settings of a chat stream.
 *
 * @public
 */
export interface IStreamOptions {
	/** A signal used to abort the stream. */
	signal?: AbortSignal;
}

/**
 * Optional settings when waiting for a complete response.
 *
 * @public
 */
export interface IAskOptions extends IStreamOptions {
	/** Callback, called with each piece of text as it arrives. */
	onDelta?: (delta: string) => void;
}

/**
 * Handles interacting with resources related to agents and chats.
 *
 * @public
 */
export class ChatService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Opens a stream for the given resource.
	 *
	 * @param resource - The streamed resource.
	 * @param args - The args of the request.
	 * @param options - The stream options.
	 * @param chatId - The ID of the chat, if already known.
	 *
	 * @returns The stream.
	 */
	private async _stream(
		resource: ResourceType,
		args: Parameters<FetcherService['request']>[1],
		options?: IStreamOptions,
		chatId?: string,
	): Promise<ChatStream> {
		const controller = new AbortController();
		const { streamFirstByteTimeout, streamIdleTimeout, streamTimeout } = this.config;
		const deadline = streamTimeout > 0 ? Date.now() + streamTimeout : undefined;
		const signal = options?.signal;

		/** The timeout which aborted the request, if any. */
		let timeout: StreamError | undefined = undefined;

		/** Aborts the request because of a timeout. */
		const expire = (message: string): void => {
			timeout ??= StreamError.timeout(message);
			controller.abort();
		};

		const onUserAbort = (): void => controller.abort();

		if (signal?.aborted) {
			controller.abort();
		}
		signal?.addEventListener('abort', onUserAbort, { once: true });

		// Waiting for the response headers, within the first byte timeout and the overall deadline
		const timers = [
			streamFirstByteTimeout > 0
				? setTimeout(
						() => expire(`no response received within ${streamFirstByteTimeout} ms`),
						streamFirstByteTimeout,
					).unref()
				: undefined,
			deadline !== undefined
				? setTimeout(() => expire('the stream lasted longer than allowed'), streamTimeout).unref()
				: undefined,
		];

		let response: AxiosResponse<Readable | ReadableStream<Uint8Array>>;

		try {
			response = await this.request<Readable | ReadableStream<Uint8Array>>(resource, args, controller.signal);
		} catch (error) {
			// Reporting the timeout instead of the resulting cancellation, unless the user aborted
			throw timeout !== undefined && !signal?.aborted ? timeout : error;
		} finally {
			timers.forEach((timer) => clearTimeout(timer));
			signal?.removeEventListener('abort', onUserAbort);
		}

		return new ChatStream(response.data as AsyncIterable<Uint8Array>, controller, chatId, {
			deadline: deadline,
			idleTimeout: streamIdleTimeout,
			signal: signal,
		});
	}

	/**
	 * Get the list of available agents (models).
	 *
	 * @param includeDisabled - Whether to include disabled agents.
	 *
	 * @returns The list of agents.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the list of agents
	 * fs.chat.agents()
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async agents(includeDisabled?: boolean): Promise<Agent[]> {
		const resource = ResourceType.AGENT_LIST;

		// Fetching raw list of agents
		const response = await this.request<IRawAgent[]>(resource, { includeDisabled: includeDisabled });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Archive a chat.
	 *
	 * @param id - The ID of the chat to archive.
	 */
	public async archive(id: string): Promise<void> {
		const resource = ResourceType.CHAT_ARCHIVE;

		// Archiving the chat
		await this.request(resource, { id: id });
	}

	/**
	 * Get the list of archived chats.
	 *
	 * @param count - The number of chats to fetch.
	 * @param cursor - The cursor to the batch of chats to fetch.
	 *
	 * @returns The batch of archived chats.
	 */
	public async archived(count?: number, cursor?: string): Promise<CursoredData<Chat>> {
		const resource = ResourceType.CHAT_ARCHIVED;

		// Fetching raw list of archived chats
		const response = await this.request<IChatHistory>(resource, { count: count, cursor: cursor });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Create a new chat, and wait for the complete response of the agent.
	 *
	 * @param chat - The chat to create.
	 * @param options - Optional settings (progress callback, abort signal).
	 *
	 * @returns The complete response, including the ID of the new chat.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Asking a question to the agent with ID -1002, printing the answer as it arrives
	 * fs.chat.ask({ agentId: -1002, content: 'Bonjour !' }, { onDelta: (text) => process.stdout.write(text) })
	 * .then(res => {
	 * 	console.log(res.chatId);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async ask(chat: INewChat, options?: IAskOptions): Promise<ChatResponse> {
		const stream = await this.stream(chat, options);

		return stream.response(options?.onDelta);
	}

	/**
	 * Attach to the stream of a chat whose response is still being generated.
	 *
	 * @param id - The ID of the chat.
	 * @param lastEventId - The ID of the last event received, to resume from.
	 * @param options - Optional settings (abort signal).
	 *
	 * @returns The stream.
	 */
	public async attach(id: string, lastEventId?: string, options?: IStreamOptions): Promise<ChatStream> {
		return this._stream(ResourceType.CHAT_STREAM_ATTACH, { id: id, lastEventId: lastEventId }, options, id);
	}

	/**
	 * Stop the generation of the response of a chat.
	 *
	 * @param id - The ID of the chat.
	 */
	public async cancel(id: string): Promise<void> {
		const resource = ResourceType.CHAT_STREAM_CANCEL;

		// Stopping the generation
		await this.request(resource, { id: id });
	}

	/**
	 * Delete a chat.
	 *
	 * @param id - The ID of the chat to delete.
	 */
	public async delete(id: string): Promise<void> {
		const resource = ResourceType.CHAT_DELETE;

		// Deleting the chat
		await this.request(resource, { id: id });
	}

	/**
	 * Delete all the chats of the user.
	 *
	 * @remarks This cannot be undone.
	 */
	public async deleteAll(): Promise<void> {
		const resource = ResourceType.CHAT_DELETE_ALL;

		// Deleting all the chats
		await this.request(resource, {});
	}

	/**
	 * Get the details of a chat, including its messages.
	 *
	 * @param id - The ID of the target chat.
	 *
	 * @returns The details of the chat.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the details of the chat with ID 'CHAT_ID'
	 * fs.chat.details('CHAT_ID')
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async details(id: string): Promise<Chat | undefined> {
		const resource = ResourceType.CHAT_DETAILS;

		// Fetching raw chat details
		const response = await this.request<IChatDetail>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Download the messages of an archived chat.
	 *
	 * @param id - The ID of the archived chat.
	 *
	 * @returns The raw content of the archive (JSON).
	 */
	public async download(id: string): Promise<Buffer> {
		const resource = ResourceType.CHAT_ARCHIVE_DOWNLOAD;

		// Downloading the archive
		const response = await this.request<ArrayBuffer>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Import a shared OpenAI (ChatGPT) conversation as a new chat.
	 *
	 * @param options - The share link and the local model to use.
	 *
	 * @returns The result of the import, including the ID of the new chat.
	 */
	public async importOpenAi(options: IConversationImportOptions): Promise<IConversationImport> {
		const resource = ResourceType.CHAT_IMPORT_OPENAI;

		// Importing the conversation
		const response = await this.request<IConversationImport>(resource, { conversationImport: options });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of chats of the user, most recent first.
	 *
	 * @param count - The number of chats to fetch. Defaults to 20.
	 * @param cursor - The cursor to the batch of chats to fetch.
	 * @param sortBy - The sort key.
	 *
	 * @returns The batch of chats.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the 20 most recent chats
	 * fs.chat.list(20)
	 * .then(res => {
	 * 	console.log(res.list, res.next);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async list(count?: number, cursor?: string, sortBy?: string): Promise<CursoredData<Chat>> {
		const resource = ResourceType.CHAT_LIST;

		// Fetching raw list of chats
		const response = await this.request<IChatHistory>(resource, { count: count, cursor: cursor, sortBy: sortBy });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of available models, as returned by the API.
	 *
	 * @returns The raw list of models.
	 */
	public async models(): Promise<unknown> {
		const resource = ResourceType.MODEL_LIST;

		// Fetching raw list of models
		const response = await this.request<unknown>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Pin a chat.
	 *
	 * @param id - The ID of the chat to pin.
	 */
	public async pin(id: string): Promise<void> {
		const resource = ResourceType.CHAT_PIN;

		// Pinning the chat
		await this.request(resource, { id: id });
	}

	/**
	 * Send a message to an existing chat, and wait for the complete response of the agent.
	 *
	 * @param id - The ID of the chat.
	 * @param message - The message to send.
	 * @param options - Optional settings (progress callback, abort signal).
	 *
	 * @returns The complete response.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Continuing the chat with ID 'CHAT_ID'
	 * fs.chat.reply('CHAT_ID', { content: 'Et en anglais ?' })
	 * .then(res => {
	 * 	console.log(res.content);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async reply(id: string, message: INewMessage, options?: IAskOptions): Promise<ChatResponse> {
		const stream = await this.send(id, message, options);

		return stream.response(options?.onDelta);
	}

	/**
	 * Restore an archived chat.
	 *
	 * @param id - The ID of the chat to restore.
	 */
	public async restore(id: string): Promise<void> {
		const resource = ResourceType.CHAT_RESTORE;

		// Restoring the chat
		await this.request(resource, { id: id });
	}

	/**
	 * Search the chats of the user.
	 *
	 * @param query - The text to search for.
	 * @param count - The number of chats to fetch.
	 *
	 * @returns The matching chats.
	 */
	public async search(query: string, count?: number): Promise<CursoredData<Chat>> {
		const resource = ResourceType.CHAT_SEARCH;

		// Searching the chats
		const response = await this.request<IChatHistory>(resource, { query: query, count: count });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Send a message to an existing chat, and stream the response of the agent.
	 *
	 * @param id - The ID of the chat.
	 * @param message - The message to send.
	 * @param options - Optional settings (abort signal).
	 *
	 * @returns The stream of the response.
	 */
	public async send(id: string, message: INewMessage, options?: IStreamOptions): Promise<ChatStream> {
		return this._stream(ResourceType.CHAT_SEND, { id: id, message: message }, options, id);
	}

	/**
	 * Share a chat with a user.
	 *
	 * @param id - The ID of the chat.
	 * @param share - The user (ID or email) to share the chat with, and the permission.
	 *
	 * @returns The access granted.
	 */
	public async share(id: string, share: IShareTarget): Promise<Share> {
		const resource = ResourceType.CHAT_SHARE_ADD;

		// Sharing the chat
		const response = await this.request<IShareAccess>(resource, { id: id, share: share });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of users a chat is shared with.
	 *
	 * @param id - The ID of the chat.
	 *
	 * @returns The list of accesses.
	 */
	public async shares(id: string): Promise<Share[]> {
		const resource = ResourceType.CHAT_SHARES;

		// Fetching raw list of shares
		const response = await this.request<IShareAccess[]>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Create a new chat, and stream the response of the agent.
	 *
	 * @param chat - The chat to create.
	 * @param options - Optional settings (abort signal).
	 *
	 * @returns The stream of the response; its `chatId` is set once received.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Streaming the answer of the agent with ID -1002
	 * const stream = await fs.chat.stream({ agentId: -1002, content: 'Raconte une blague' });
	 *
	 * for await (const event of stream) {
	 * 	if (event.delta) {
	 * 		process.stdout.write(event.delta);
	 * 	}
	 * }
	 * ```
	 */
	public async stream(chat: INewChat, options?: IStreamOptions): Promise<ChatStream> {
		return this._stream(ResourceType.CHAT_CREATE, { chat: chat }, options, chat.chatId);
	}

	/**
	 * Unpin a chat.
	 *
	 * @param id - The ID of the chat to unpin.
	 */
	public async unpin(id: string): Promise<void> {
		const resource = ResourceType.CHAT_UNPIN;

		// Unpinning the chat
		await this.request(resource, { id: id });
	}

	/**
	 * Stop sharing a chat with a user.
	 *
	 * @param id - The ID of the chat.
	 * @param share - The user (ID or email) to stop sharing the chat with.
	 */
	public async unshare(id: string, share: IShareTarget): Promise<void> {
		const resource = ResourceType.CHAT_SHARE_REMOVE;

		// Removing the share
		await this.request(resource, { id: id, share: share });
	}

	/**
	 * Update a chat.
	 *
	 * @param id - The ID of the chat.
	 * @param updates - The updates to apply (title, privacy).
	 *
	 * @returns The updated chat.
	 */
	public async update(id: string, updates: IChatUpdates): Promise<Chat> {
		const resource = ResourceType.CHAT_UPDATE;

		// Updating the chat
		const response = await this.request<IChatDocument>(resource, { id: id, chatUpdates: updates });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Update the permission of a user on a shared chat.
	 *
	 * @param id - The ID of the chat.
	 * @param share - The user (ID or email), and the new permission.
	 *
	 * @returns The updated access.
	 */
	public async updateShare(id: string, share: IShareTarget): Promise<Share> {
		const resource = ResourceType.CHAT_SHARE_UPDATE;

		// Updating the share
		const response = await this.request<IShareAccess>(resource, { id: id, share: share });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the token usage of a chat.
	 *
	 * @param id - The ID of the chat.
	 *
	 * @returns The token usage, and the share of the context window used.
	 */
	public async usage(id: string): Promise<ChatUsage> {
		const resource = ResourceType.CHAT_USAGE;

		// Fetching raw usage
		const response = await this.request<IChatUsage>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
