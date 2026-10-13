/**
 * The details of an uploaded attachment (files v1), usable in the `images` of a chat or a message.
 *
 * @public
 */
export interface IAttachment {
	/** The content of the attachment, base64-encoded, when fetched with its details. */
	base64Data?: string;

	/** The MIME type of the attachment. */
	contentType?: string;

	/** The ID (UUID) of the attachment. */
	id: string;

	/** The storage path of the attachment. */
	pathname?: string;

	/** The URL of the attachment. */
	url?: string;
}

/**
 * The details of a stored file (files v2), usable in the `files` of a chat or a message.
 *
 * @public
 */
export interface IStoredFile {
	/** The size of the file, in bytes. */
	bytes?: number;

	/** The date and time of creation of the file, in UTC string format. */
	createdAt?: string;

	/** The date and time of expiration of the file, in UTC string format, if any. */
	expiresAt?: string;

	/** The name of the file. */
	filename?: string;

	/** The ID of the file. */
	id: string;

	/** The purpose of the file. */
	purpose?: string;

	/** The processing status of the file. */
	status?: string;
}
