import { Extractors } from '../../collections/Extractors';
import { SortOrder } from '../../enums/Data';
import { ResourceType } from '../../enums/Resource';
import { toUpload } from '../../helper/FileUtils';
import { CursoredData } from '../../models/data/CursoredData';
import { StoredFile } from '../../models/data/StoredFile';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IFileExpiration, IUpload } from '../../types/args/PostArgs';
import { IFileDeleted, IFileObject, IFilesUsage } from '../../types/raw/base/File';
import { IFileList } from '../../types/raw/composite/FileList';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with stored files (files v2), whose IDs are used in the `files` of a chat or a message.
 *
 * @public
 */
export class FileService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Download the content of a file.
	 *
	 * @param id - The ID of the target file.
	 *
	 * @returns The content of the file.
	 */
	public async content(id: string): Promise<Buffer> {
		const resource = ResourceType.FILE_V2_CONTENT;

		// Downloading the content
		const response = await this.request<ArrayBuffer>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Delete a file.
	 *
	 * @param id - The ID of the file to delete.
	 *
	 * @returns Whether the file was deleted.
	 */
	public async delete(id: string): Promise<boolean> {
		const resource = ResourceType.FILE_V2_DELETE;

		// Deleting the file
		const response = await this.request<IFileDeleted>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the details of a file.
	 *
	 * @param id - The ID of the target file.
	 *
	 * @returns The details of the file.
	 */
	public async details(id: string): Promise<StoredFile | undefined> {
		const resource = ResourceType.FILE_V2_DETAILS;

		// Fetching raw file details
		const response = await this.request<IFileObject>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of files of the user.
	 *
	 * @param count - The number of files to fetch.
	 * @param cursor - The cursor to the batch of files to fetch.
	 * @param order - The sort order.
	 * @param purpose - The purpose of files to filter with.
	 *
	 * @returns The batch of files.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the 20 most recent files
	 * fs.file.list(20)
	 * .then(res => {
	 * 	console.log(res.list, res.next);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async list(
		count?: number,
		cursor?: string,
		order?: SortOrder,
		purpose?: string,
	): Promise<CursoredData<StoredFile>> {
		const resource = ResourceType.FILE_V2_LIST;

		// Fetching raw list of files
		const response = await this.request<IFileList>(resource, {
			count: count,
			cursor: cursor,
			order: order,
			purpose: purpose,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of supported MIME types.
	 *
	 * @returns The list of MIME types, as returned by the API.
	 */
	public async mimeTypes(): Promise<unknown[]> {
		const resource = ResourceType.FILE_V2_MIME_TYPES;

		// Fetching raw list of MIME types
		const response = await this.request<unknown[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Upload a file.
	 *
	 * @param file - The file to upload, or the path to a local file.
	 * @param expiresAfter - The expiration policy of the file.
	 *
	 * @returns The uploaded file; its ID can be used in the `files` of a chat or a message.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Uploading a PDF, then asking about it
	 * const file = await fs.file.upload('./cours.pdf');
	 * const res = await fs.chat.ask({ agentId: -1002, content: 'Résume ce document', files: [file.id] });
	 * ```
	 */
	public async upload(file: IUpload | string, expiresAfter?: IFileExpiration): Promise<StoredFile> {
		const resource = ResourceType.FILE_V2_UPLOAD;

		// Uploading the file
		const response = await this.request<IFileObject>(resource, {
			upload: await toUpload(file),
			expiresAfter: expiresAfter,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the storage usage of the user.
	 *
	 * @returns The storage usage.
	 */
	public async usage(): Promise<IFilesUsage> {
		const resource = ResourceType.FILE_V2_USAGE;

		// Fetching raw storage usage
		const response = await this.request<IFilesUsage>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
