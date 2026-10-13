import { IStoredFile } from '../../types/data/File';
import { IFileObject } from '../../types/raw/base/File';
import { IFileList } from '../../types/raw/composite/FileList';

import { CursoredData } from './CursoredData';

/**
 * Converts a timestamp in seconds since the epoch into an ISO string.
 *
 * @param seconds - The timestamp, in seconds.
 *
 * @returns The ISO string, if the timestamp is valid.
 */
function fromUnix(seconds?: number | null): string | undefined {
	return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : undefined;
}

/**
 * The details of a stored file (files v2), usable in the `files` of a chat or a message.
 *
 * @public
 */
export class StoredFile implements IStoredFile {
	/** The raw file details. */
	private readonly _raw: IFileObject;

	public bytes?: number;
	public createdAt?: string;
	public expiresAt?: string;
	public filename?: string;
	public id: string;
	public purpose?: string;
	public status?: string;

	/**
	 * @param file - The raw file details.
	 */
	public constructor(file: IFileObject) {
		this._raw = { ...file };
		this.id = file.id;
		this.bytes = file.bytes ?? undefined;
		this.filename = file.filename ?? undefined;
		this.purpose = file.purpose ?? undefined;
		this.status = file.status ?? undefined;
		this.createdAt = fromUnix(file.created_at);
		this.expiresAt = fromUnix(file.expires_at);
	}

	/** The raw file details. */
	public get raw(): IFileObject {
		return { ...this._raw };
	}

	/**
	 * Deserializes a page of stored files.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized page; the cursor to the next page is the ID of the last file.
	 */
	public static list(response: IFileList): CursoredData<StoredFile> {
		const files = (response?.data ?? [])
			.filter((item) => item?.id !== undefined)
			.map((item) => new StoredFile(item));
		const last = response?.last_id ?? (files.length ? files[files.length - 1].id : '');

		return new CursoredData(files, response?.has_more ? last : '');
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IStoredFile {
		return {
			bytes: this.bytes,
			createdAt: this.createdAt,
			expiresAt: this.expiresAt,
			filename: this.filename,
			id: this.id,
			purpose: this.purpose,
			status: this.status,
		};
	}
}
