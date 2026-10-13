import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { toUpload } from '../../helper/FileUtils';
import { Attachment } from '../../models/data/Attachment';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IUpload } from '../../types/args/PostArgs';
import { IAttachment as IRawAttachment } from '../../types/raw/base/File';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with attachments (files v1), whose IDs are used in the `images` of a chat or a message.
 *
 * @public
 */
export class AttachmentService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Delete an attachment.
	 *
	 * @param id - The ID of the attachment to delete.
	 */
	public async delete(id: string): Promise<void> {
		const resource = ResourceType.FILE_DELETE;

		// Deleting the attachment
		await this.request(resource, { id: id });
	}

	/**
	 * Get the details of an attachment, including its content (base64).
	 *
	 * @param id - The ID of the target attachment.
	 *
	 * @returns The details of the attachment.
	 */
	public async details(id: string): Promise<Attachment | undefined> {
		const resource = ResourceType.FILE_DETAILS;

		// Fetching raw attachment details
		const response = await this.request<IRawAttachment>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of attachments of the user.
	 *
	 * @returns The list of attachments.
	 */
	public async list(): Promise<Attachment[]> {
		const resource = ResourceType.FILE_LIST;

		// Fetching raw list of attachments
		const response = await this.request<IRawAttachment[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Upload an attachment (typically an image).
	 *
	 * @param file - The file to upload, or the path to a local file.
	 *
	 * @returns The uploaded attachment; its ID can be used in the `images` of a chat or a message.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Uploading an image, then asking about it
	 * const image = await fs.attachment.upload('./photo.png');
	 * const res = await fs.chat.ask({ agentId: -1002, content: 'Décris cette image', images: [image.id] });
	 * ```
	 */
	public async upload(file: IUpload | string): Promise<Attachment> {
		const resource = ResourceType.FILE_UPLOAD;

		// Uploading the attachment
		const response = await this.request<IRawAttachment>(resource, { upload: await toUpload(file) });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
