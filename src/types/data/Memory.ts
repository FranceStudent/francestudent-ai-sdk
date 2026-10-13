/**
 * The details of a single memory of the user.
 *
 * @public
 */
export interface IMemory {
	/** The content of the memory, when fetched with its details. */
	content?: string;

	/** The date and time of creation of the memory, in UTC string format. */
	createdAt?: string;

	/** The ID of the memory. */
	id: string;

	/** The name of the memory. */
	name?: string;

	/** The path of the memory. */
	path?: string;

	/** The size of the memory, in bytes. */
	sizeBytes: number;

	/** The date and time of the last update of the memory, in UTC string format. */
	updatedAt?: string;
}
