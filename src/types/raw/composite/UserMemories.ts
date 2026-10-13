import { IUserMemory } from '../base/Memory';

/**
 * Represents the raw list of memories of the user.
 *
 * @public
 */
export interface IUserMemories {
	count?: number;
	totalSizeBytes?: number;
	memories?: IUserMemory[];
}
