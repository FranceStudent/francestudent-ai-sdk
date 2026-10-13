import { IAttachment } from '../../types/data/File';
import { IAttachment as IRawAttachment } from '../../types/raw/base/File';

/**
 * The details of an uploaded attachment (files v1), usable in the `images` of a chat or a message.
 *
 * @public
 */
export class Attachment implements IAttachment {
	/** The raw attachment details. */
	private readonly _raw: IRawAttachment;

	public base64Data?: string;
	public contentType?: string;
	public id: string;
	public pathname?: string;
	public url?: string;

	/**
	 * @param attachment - The raw attachment details.
	 */
	public constructor(attachment: IRawAttachment) {
		this._raw = { ...attachment };
		this.id = attachment.uuid ?? (attachment.id as string);
		this.pathname = attachment.pathname ?? undefined;
		this.contentType = attachment.contentType ?? undefined;
		this.url = attachment.url ?? undefined;
		this.base64Data = attachment.base64Data ?? undefined;
	}

	/** The raw attachment details. */
	public get raw(): IRawAttachment {
		return { ...this._raw };
	}

	/**
	 * Deserializes a list of raw attachments.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized attachments.
	 */
	public static list(response: IRawAttachment[]): Attachment[] {
		return (Array.isArray(response) ? response : [])
			.filter((item) => item && (item.uuid !== undefined || item.id !== undefined))
			.map((item) => new Attachment(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IAttachment {
		return {
			base64Data: this.base64Data,
			contentType: this.contentType,
			id: this.id,
			pathname: this.pathname,
			url: this.url,
		};
	}
}
