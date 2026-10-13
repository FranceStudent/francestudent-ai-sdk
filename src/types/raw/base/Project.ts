/**
 * Represents the raw data of a single project.
 *
 * @public
 */
export interface IProject {
	id: string;
	name: string;
	ownerId?: number;
	customInstructions?: string;
	flags?: number;
	createdAt: string;
}
