/**
 * The details of a single project.
 *
 * @public
 */
export interface IProject {
	/** The date and time of creation of the project, in UTC string format. */
	createdAt: string;

	/** The custom instructions of the project. */
	customInstructions?: string;

	/** The raw flags (bit field) of the project. */
	flags: number;

	/** The ID of the project. */
	id: string;

	/** The name of the project. */
	name: string;

	/** The ID of the owner of the project. */
	ownerId?: number;
}
