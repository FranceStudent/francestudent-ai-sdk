import { AxiosRequestConfig } from 'axios';

import { toFormData } from '../helper/FormUtils';
import { IUpload } from '../types/args/PostArgs';

/**
 * Collection of requests related to attachments (files v1).
 *
 * @public
 */
export class AttachmentRequests {
	/**
	 * @param id - The ID of the attachment to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/files/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the target attachment.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/files/${encodeURIComponent(id)}` };
	}

	/**
	 * Lists the attachments of the user.
	 */
	public static list(): AxiosRequestConfig {
		return { method: 'get', url: '/files' };
	}

	/**
	 * @param upload - The file to upload.
	 */
	public static upload(upload: IUpload): AxiosRequestConfig {
		return { method: 'post', url: '/files/upload', data: toFormData('file', [upload]) };
	}
}
