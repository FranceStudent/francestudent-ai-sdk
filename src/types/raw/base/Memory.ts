/**
 * Represents the raw details of a memory.
 *
 * @public
 */
export interface IUserMemory {
	id: string;
	path?: string;
	name?: string;
	sizeBytes?: number;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Represents the raw details of a memory, including its content.
 *
 * @public
 */
export interface IUserMemoryContent extends IUserMemory {
	content?: string;
}
