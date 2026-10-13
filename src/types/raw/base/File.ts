/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Represents the raw data of an uploaded attachment (files v1).
 *
 * @public
 */
export interface IAttachment {
	uuid: string;
	pathname?: string;
	contentType?: string;
	url?: string;
	base64Data?: string;
	[key: string]: unknown;
}

/**
 * Represents the raw data of a stored file (files v2, OpenAI-compatible file object).
 *
 * @remarks The schema is not documented by the API; the fields are those of the OpenAI file object.
 *
 * @public
 */
export interface IFileObject {
	id: string;
	object?: string;
	bytes?: number;
	created_at?: number;
	filename?: string;
	purpose?: string;
	status?: string;
	expires_at?: number | null;
	[key: string]: unknown;
}

/**
 * Represents the raw result of deleting a stored file (OpenAI-compatible).
 *
 * @public
 */
export interface IFileDeleted {
	id?: unknown;
	object?: unknown;
	deleted?: unknown;
	[key: string]: unknown;
}

/**
 * Represents the raw storage usage of the user.
 *
 * @public
 */
export interface IFilesUsage {
	filesBytes?: number;
	filesGb?: number;
	skillsBytes?: number;
	skillsGb?: number;
	usedBytes?: number;
	usedGb?: number;
	maxBytes?: number;
	maxGb?: number;
	remainingBytes?: number;
	remainingGb?: number;
}
