import { IMemory } from '../../types/data/Memory';
import { IUserMemoryContent as IRawMemory } from '../../types/raw/base/Memory';
import { IUserMemories } from '../../types/raw/composite/UserMemories';

/**
 * The details of a single memory of the user.
 *
 * @public
 */
export class Memory implements IMemory {
	/** The raw memory details. */
	private readonly _raw: IRawMemory;

	public content?: string;
	public createdAt?: string;
	public id: string;
	public name?: string;
	public path?: string;
	public sizeBytes: number;
	public updatedAt?: string;

	/**
	 * @param memory - The raw memory details.
	 */
	public constructor(memory: IRawMemory) {
		this._raw = { ...memory };
		this.id = memory.id;
		this.name = memory.name ?? undefined;
		this.path = memory.path ?? undefined;
		this.sizeBytes = memory.sizeBytes ?? 0;
		this.createdAt = memory.createdAt ? new Date(memory.createdAt).toISOString() : undefined;
		this.updatedAt = memory.updatedAt ? new Date(memory.updatedAt).toISOString() : undefined;
		this.content = memory.content ?? undefined;
	}

	/** The raw memory details. */
	public get raw(): IRawMemory {
		return { ...this._raw };
	}

	/**
	 * Deserializes the list of memories of the user.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized memories.
	 */
	public static list(response: IUserMemories): Memory[] {
		return (response?.memories ?? []).filter((item) => item?.id !== undefined).map((item) => new Memory(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IMemory {
		return {
			content: this.content,
			createdAt: this.createdAt,
			id: this.id,
			name: this.name,
			path: this.path,
			sizeBytes: this.sizeBytes,
			updatedAt: this.updatedAt,
		};
	}
}
