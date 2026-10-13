import { IFileObject } from '../base/File';

/**
 * Represents a raw page of stored files (OpenAI-compatible list).
 *
 * @public
 */
export interface IFileList {
	/* eslint-disable @typescript-eslint/naming-convention */
	object?: string;
	data: IFileObject[];
	first_id?: string;
	last_id?: string;
	has_more?: boolean;
	/* eslint-enable @typescript-eslint/naming-convention */
}
