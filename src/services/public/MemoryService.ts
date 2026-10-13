import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { Memory } from '../../models/data/Memory';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IUserMemoryContent } from '../../types/raw/base/Memory';
import { IUserMemories } from '../../types/raw/composite/UserMemories';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to the memories of the user.
 *
 * @public
 */
export class MemoryService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Delete a memory.
	 *
	 * @param id - The ID of the memory to delete.
	 */
	public async delete(id: string): Promise<void> {
		const resource = ResourceType.MEMORY_DELETE;

		// Deleting the memory
		await this.request(resource, { id: id });
	}

	/**
	 * Delete all the memories of the user.
	 *
	 * @remarks This cannot be undone.
	 */
	public async deleteAll(): Promise<void> {
		const resource = ResourceType.MEMORY_DELETE_ALL;

		// Deleting all the memories
		await this.request(resource, {});
	}

	/**
	 * Get the details of a memory, including its content.
	 *
	 * @param id - The ID of the target memory.
	 *
	 * @returns The details of the memory.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the content of the memory with ID 'MEMORY_ID'
	 * fs.memory.details('MEMORY_ID')
	 * .then(res => {
	 * 	console.log(res?.content);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async details(id: string): Promise<Memory | undefined> {
		const resource = ResourceType.MEMORY_DETAILS;

		// Fetching raw memory details
		const response = await this.request<IUserMemoryContent>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of memories of the user.
	 *
	 * @returns The list of memories, without their content.
	 */
	public async list(): Promise<Memory[]> {
		const resource = ResourceType.MEMORY_LIST;

		// Fetching raw list of memories
		const response = await this.request<IUserMemories>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
