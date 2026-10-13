import { AxiosRequestConfig } from 'axios';

/**
 * Collection of requests related to the memories of the user.
 *
 * @public
 */
export class MemoryRequests {
	/**
	 * @param id - The ID of the memory to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/user/me/memories/${encodeURIComponent(id)}` };
	}

	/**
	 * Deletes all the memories of the user.
	 */
	public static deleteAll(): AxiosRequestConfig {
		return { method: 'delete', url: '/user/me/memories' };
	}

	/**
	 * @param id - The ID of the target memory.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/user/me/memories/${encodeURIComponent(id)}` };
	}

	/**
	 * Lists the memories of the user.
	 */
	public static list(): AxiosRequestConfig {
		return { method: 'get', url: '/user/me/memories' };
	}
}
