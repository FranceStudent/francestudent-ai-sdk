import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { Chat } from '../../models/data/Chat';
import { CursoredData } from '../../models/data/CursoredData';
import { Project } from '../../models/data/Project';
import { Share } from '../../models/data/Share';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IProjectUpdates } from '../../types/args/PostArgs';
import { IChatSummary } from '../../types/raw/base/Chat';
import { IProject as IRawProject } from '../../types/raw/base/Project';
import { IShareAccess } from '../../types/raw/base/Share';
import { IChatHistory } from '../../types/raw/composite/ChatHistory';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to projects.
 *
 * @public
 */
export class ProjectService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Add a chat to a project.
	 *
	 * @param id - The ID of the project.
	 * @param chatId - The ID of the chat to add.
	 *
	 * @returns The chat, as part of the project.
	 */
	public async addChat(id: string, chatId: string): Promise<Chat> {
		const resource = ResourceType.PROJECT_CHAT_LINK;

		// Adding the chat to the project
		const response = await this.request<IChatSummary>(resource, { id: id, chatId: chatId });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of chats of a project.
	 *
	 * @param id - The ID of the project.
	 * @param count - The number of chats to fetch.
	 * @param cursor - The cursor to the batch of chats to fetch.
	 *
	 * @returns The batch of chats.
	 */
	public async chats(id: string, count?: number, cursor?: string): Promise<CursoredData<Chat>> {
		const resource = ResourceType.PROJECT_CHATS;

		// Fetching raw list of chats
		const response = await this.request<IChatHistory>(resource, { id: id, count: count, cursor: cursor });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Create a project.
	 *
	 * @param name - The name of the project.
	 *
	 * @returns The created project.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Creating a project named 'Thesis'
	 * fs.project.create('Thesis')
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async create(name: string): Promise<Project> {
		const resource = ResourceType.PROJECT_CREATE;

		// Creating the project
		const response = await this.request<IRawProject>(resource, { name: name });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Delete a project.
	 *
	 * @param id - The ID of the project to delete.
	 */
	public async delete(id: string): Promise<void> {
		const resource = ResourceType.PROJECT_DELETE;

		// Deleting the project
		await this.request(resource, { id: id });
	}

	/**
	 * Get the details of a project.
	 *
	 * @param id - The ID of the project.
	 *
	 * @returns The details of the project.
	 */
	public async details(id: string): Promise<Project | undefined> {
		const resource = ResourceType.PROJECT_DETAILS;

		// Fetching raw project details
		const response = await this.request<IRawProject>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of projects of the user.
	 *
	 * @returns The list of projects.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the list of projects
	 * fs.project.list()
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async list(): Promise<Project[]> {
		const resource = ResourceType.PROJECT_LIST;

		// Fetching raw list of projects
		const response = await this.request<IRawProject[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Remove a chat from a project.
	 *
	 * @param id - The ID of the project.
	 * @param chatId - The ID of the chat to remove.
	 */
	public async removeChat(id: string, chatId: string): Promise<void> {
		const resource = ResourceType.PROJECT_CHAT_UNLINK;

		// Removing the chat from the project
		await this.request(resource, { id: id, chatId: chatId });
	}

	/**
	 * Share a project with a user.
	 *
	 * @param id - The ID of the project.
	 * @param userEmail - The email address of the user to share the project with.
	 *
	 * @returns The access granted.
	 */
	public async share(id: string, userEmail: string): Promise<Share> {
		const resource = ResourceType.PROJECT_SHARE_ADD;

		// Sharing the project
		const response = await this.request<IShareAccess>(resource, { id: id, share: { userEmail: userEmail } });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of projects shared with the user.
	 *
	 * @returns The list of shared projects.
	 */
	public async shared(): Promise<Project[]> {
		const resource = ResourceType.PROJECT_SHARED;

		// Fetching raw list of shared projects
		const response = await this.request<IRawProject[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of users a project is shared with.
	 *
	 * @param id - The ID of the project.
	 *
	 * @returns The list of accesses.
	 */
	public async shares(id: string): Promise<Share[]> {
		const resource = ResourceType.PROJECT_SHARES;

		// Fetching raw list of shares
		const response = await this.request<IShareAccess[]>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Stop sharing a project with a user.
	 *
	 * @param id - The ID of the project.
	 * @param userId - The ID of the user to stop sharing the project with.
	 */
	public async unshare(id: string, userId: number): Promise<void> {
		const resource = ResourceType.PROJECT_SHARE_REMOVE;

		// Removing the share
		await this.request(resource, { id: id, userId: userId });
	}

	/**
	 * Update a project.
	 *
	 * @param id - The ID of the project.
	 * @param updates - The updates to apply (name, flags).
	 *
	 * @returns The updated project.
	 */
	public async update(id: string, updates: IProjectUpdates): Promise<Project> {
		const resource = ResourceType.PROJECT_UPDATE;

		// Updating the project
		const response = await this.request<IRawProject>(resource, { id: id, projectUpdates: updates });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
