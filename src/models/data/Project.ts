import { IProject } from '../../types/data/Project';
import { IProject as IRawProject } from '../../types/raw/base/Project';

/**
 * The details of a single project.
 *
 * @public
 */
export class Project implements IProject {
	/** The raw project details. */
	private readonly _raw: IRawProject;

	public createdAt: string;
	public customInstructions?: string;
	public flags: number;
	public id: string;
	public name: string;
	public ownerId?: number;

	/**
	 * @param project - The raw project details.
	 */
	public constructor(project: IRawProject) {
		this._raw = { ...project };
		this.id = project.id;
		this.name = project.name;
		this.ownerId = project.ownerId ?? undefined;
		this.customInstructions = project.customInstructions || undefined;
		this.flags = project.flags ?? 0;
		this.createdAt = project.createdAt ? new Date(project.createdAt).toISOString() : '';
	}

	/** The raw project details. */
	public get raw(): IRawProject {
		return { ...this._raw };
	}

	/**
	 * Deserializes a list of raw projects.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized projects.
	 */
	public static list(response: IRawProject[]): Project[] {
		return (Array.isArray(response) ? response : [])
			.filter((item) => item?.id !== undefined)
			.map((item) => new Project(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IProject {
		return {
			createdAt: this.createdAt,
			customInstructions: this.customInstructions,
			flags: this.flags,
			id: this.id,
			name: this.name,
			ownerId: this.ownerId,
		};
	}
}
