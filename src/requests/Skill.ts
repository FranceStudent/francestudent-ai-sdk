import { AxiosRequestConfig } from 'axios';

import { SortOrder } from '../enums/Data';
import { toFormData } from '../helper/FormUtils';
import { IUpload } from '../types/args/PostArgs';

/**
 * Collection of requests related to skills.
 *
 * @public
 */
export class SkillRequests {
	/**
	 * @param id - The ID of the target skill.
	 */
	public static content(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/skills/${encodeURIComponent(id)}/content` };
	}

	/**
	 * @param uploads - The files of the skill.
	 * @param flags - The flags of the skill.
	 */
	public static create(uploads: IUpload[], flags?: string[]): AxiosRequestConfig {
		return {
			method: 'post',
			url: '/skills',
			params: { flags: flags },
			paramsSerializer: { indexes: null },
			data: toFormData('files', uploads),
		};
	}

	/**
	 * @param id - The ID of the skill to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/skills/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the target skill.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/skills/${encodeURIComponent(id)}` };
	}

	/**
	 * @param count - The number of skills to fetch.
	 * @param cursor - The ID of the last skill of the previous batch.
	 * @param order - The sort order.
	 * @param query - The text to search for.
	 * @param flags - The flags to filter with.
	 */
	public static list(
		count?: number,
		cursor?: string,
		order?: SortOrder,
		query?: string,
		flags?: string[],
	): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/skills',
			params: { after: cursor || undefined, limit: count, order: order, query: query, flags: flags },
			paramsSerializer: { indexes: null },
		};
	}

	/**
	 * @param id - The ID of the target skill.
	 * @param version - The version to make the default one.
	 */
	public static update(id: string, version: string): AxiosRequestConfig {
		return {
			method: 'post',
			url: `/skills/${encodeURIComponent(id)}`,
			/* eslint-disable @typescript-eslint/naming-convention */
			data: { default_version: version },
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * @param id - The ID of the target skill.
	 * @param version - The target version.
	 */
	public static versionContent(id: string, version: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: `/skills/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}/content`,
		};
	}

	/**
	 * @param id - The ID of the target skill.
	 * @param uploads - The files of the new version.
	 * @param isDefault - Whether the new version becomes the default one.
	 */
	public static versionCreate(id: string, uploads: IUpload[], isDefault?: boolean): AxiosRequestConfig {
		return {
			method: 'post',
			url: `/skills/${encodeURIComponent(id)}/versions`,
			params: { default: isDefault },
			data: toFormData('files', uploads),
		};
	}

	/**
	 * @param id - The ID of the target skill.
	 * @param version - The version to delete.
	 */
	public static versionDelete(id: string, version: string): AxiosRequestConfig {
		return { method: 'delete', url: `/skills/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}` };
	}

	/**
	 * @param id - The ID of the target skill.
	 * @param version - The target version.
	 */
	public static versionDetails(id: string, version: string): AxiosRequestConfig {
		return { method: 'get', url: `/skills/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}` };
	}

	/**
	 * @param id - The ID of the target skill.
	 * @param count - The number of versions to fetch.
	 * @param cursor - The ID of the last version of the previous batch.
	 * @param order - The sort order.
	 */
	public static versions(id: string, count?: number, cursor?: string, order?: SortOrder): AxiosRequestConfig {
		return {
			method: 'get',
			url: `/skills/${encodeURIComponent(id)}/versions`,
			params: { after: cursor || undefined, limit: count, order: order },
		};
	}
}
