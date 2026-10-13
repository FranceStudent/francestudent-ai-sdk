import { AxiosRequestConfig } from 'axios';

/**
 * Collection of public requests, which do not require authentication.
 *
 * @public
 */
export class PublicRequests {
	/**
	 * Fetches the public alerts.
	 */
	public static alerts(): AxiosRequestConfig {
		return { method: 'get', url: '/public/alerts' };
	}

	/**
	 * Fetches the health status of the application.
	 */
	public static health(): AxiosRequestConfig {
		return { method: 'get', url: '/public/health' };
	}
}
