import { AxiosRequestConfig } from 'axios';

import { SortOrder } from '../enums/Data';
import { toFormData } from '../helper/FormUtils';
import { IFileExpiration, IUpload } from '../types/args/PostArgs';

/**
 * Collection of requests related to stored files (files v2).
 *
 * @public
 */
export class FileRequests {
	/**
	 * @param id - The ID of the target file.
	 */
	public static content(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/filesv2/${encodeURIComponent(id)}/content` };
	}

	/**
	 * @param id - The ID of the file to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/filesv2/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the target file.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/filesv2/${encodeURIComponent(id)}` };
	}

	/**
	 * @param count - The number of files to fetch.
	 * @param cursor - The ID of the last file of the previous batch.
	 * @param order - The sort order.
	 * @param purpose - The purpose of files to filter with.
	 */
	public static list(count?: number, cursor?: string, order?: SortOrder, purpose?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/filesv2',
			params: { after: cursor || undefined, limit: count, order: order, purpose: purpose },
		};
	}

	/**
	 * Lists the supported MIME types.
	 */
	public static mimeTypes(): AxiosRequestConfig {
		return { method: 'get', url: '/filesv2/supported-mime-types' };
	}

	/**
	 * @param upload - The file to upload.
	 * @param expiresAfter - The expiration policy of the file.
	 */
	public static upload(upload: IUpload, expiresAfter?: IFileExpiration): AxiosRequestConfig {
		return {
			method: 'post',
			url: '/filesv2',
			/* eslint-disable @typescript-eslint/naming-convention */
			params: {
				'expires_after[anchor]': expiresAfter?.anchor,
				'expires_after[seconds]': expiresAfter?.seconds,
			},
			/* eslint-enable @typescript-eslint/naming-convention */
			data: toFormData('file', [upload]),
		};
	}

	/**
	 * Fetches the storage usage of the user.
	 */
	public static usage(): AxiosRequestConfig {
		return { method: 'get', url: '/filesv2/usage' };
	}
}
