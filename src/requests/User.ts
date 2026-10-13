import { AxiosRequestConfig } from 'axios';

import {
	IInstructionsUpdates,
	INotificationPreferences,
	IProfileUpdates,
	ISafetyAppeal,
	IUserUpdates,
	IWebSearchDomains,
} from '../types/args/PostArgs';

/**
 * Collection of requests related to the authenticated user.
 *
 * @public
 */
export class UserRequests {
	/**
	 * @param id - The ID of the safety classification to appeal.
	 * @param appeal - The appeal.
	 */
	public static appeal(id: string, appeal: ISafetyAppeal): AxiosRequestConfig {
		return {
			method: 'put',
			url: `/safety-hub/request-review/${encodeURIComponent(id)}`,
			/* eslint-disable @typescript-eslint/naming-convention */
			data: { signal: appeal.signal, user_input: appeal.userInput },
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * Fetches the usage of the chat budget.
	 */
	public static chatBudget(): AxiosRequestConfig {
		return { method: 'get', url: '/user/chat-budget' };
	}

	/**
	 * Fetches the rate limit reset credits.
	 */
	public static credits(): AxiosRequestConfig {
		return { method: 'get', url: '/user/rate-limit-credits' };
	}

	/**
	 * Deletes the account of the user.
	 */
	public static delete(): AxiosRequestConfig {
		return { method: 'delete', url: '/user/me' };
	}

	/**
	 * Fetches the details of the user.
	 */
	public static details(): AxiosRequestConfig {
		return { method: 'get', url: '/user/me' };
	}

	/**
	 * Fetches the user flags.
	 */
	public static flags(): AxiosRequestConfig {
		return { method: 'get', url: '/user/flags' };
	}

	/**
	 * Fetches the personalization settings.
	 */
	public static instructions(): AxiosRequestConfig {
		return { method: 'get', url: '/user/instructions' };
	}

	/**
	 * @param email - The email address of the person to invite.
	 */
	public static invite(email: string): AxiosRequestConfig {
		return { method: 'post', url: '/user/invite', data: { email: email } };
	}

	/**
	 * Fetches the notification preferences.
	 */
	public static notificationPreferences(): AxiosRequestConfig {
		return { method: 'get', url: '/user/notification-preferences' };
	}

	/**
	 * Fetches the available pets.
	 */
	public static pets(): AxiosRequestConfig {
		return { method: 'get', url: '/user/pets' };
	}

	/**
	 * Activates a rate limit power-up.
	 */
	public static powerUp(): AxiosRequestConfig {
		return { method: 'post', url: '/user/rate-limit-credits/activate' };
	}

	/**
	 * Registers the user to the beta.
	 */
	public static registerBeta(): AxiosRequestConfig {
		return { method: 'post', url: '/user/register-beta' };
	}

	/**
	 * Fetches the Safety Hub of the user.
	 */
	public static safetyHub(): AxiosRequestConfig {
		return { method: 'get', url: '/safety-hub/@me' };
	}

	/**
	 * Fetches the sessions of the user.
	 */
	public static sessions(): AxiosRequestConfig {
		return { method: 'get', url: '/user/sessions' };
	}

	/**
	 * @param id - The ID of the session to terminate.
	 */
	public static terminateSession(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/user/sessions/${encodeURIComponent(id)}` };
	}

	/**
	 * Terminates all the sessions of the user.
	 */
	public static terminateSessions(): AxiosRequestConfig {
		return { method: 'delete', url: '/user/sessions' };
	}

	/**
	 * @param days - The number of days of history to fetch.
	 */
	public static tokenUsage(days?: number): AxiosRequestConfig {
		return { method: 'get', url: '/user/tokenusage', params: { tokenUsageDays: days } };
	}

	/**
	 * @param updates - The updates to apply to the user settings.
	 */
	public static update(updates: IUserUpdates): AxiosRequestConfig {
		return { method: 'patch', url: '/user/me', data: { ...updates } };
	}

	/**
	 * @param updates - The updates to apply to the personalization settings.
	 */
	public static updateInstructions(updates: IInstructionsUpdates): AxiosRequestConfig {
		return { method: 'patch', url: '/user/instructions', data: { ...updates } };
	}

	/**
	 * @param preferences - The notification preferences to set.
	 */
	public static updateNotificationPreferences(preferences: INotificationPreferences): AxiosRequestConfig {
		return { method: 'patch', url: '/user/notification-preferences', data: { ...preferences } };
	}

	/**
	 * @param updates - The updates to apply to the public profile.
	 */
	public static updateProfile(updates: IProfileUpdates): AxiosRequestConfig {
		return { method: 'patch', url: '/user/@me', data: { name: updates.name, avatar: updates.avatar } };
	}

	/**
	 * @param domains - The web search domain filter to set.
	 */
	public static updateWebSearchDomains(domains: IWebSearchDomains): AxiosRequestConfig {
		return {
			method: 'put',
			url: '/user/web-search-domains',
			data: {
				filterType: domains.filterType,
				allowedDomains: domains.allowedDomains,
				blockedDomains: domains.blockedDomains,
			},
		};
	}

	/**
	 * Fetches the rate limit usage of the user.
	 */
	public static usage(): AxiosRequestConfig {
		return { method: 'get', url: '/user/usage' };
	}

	/**
	 * @param count - The number of entries to fetch.
	 * @param cursor - The cursor to the batch of entries to fetch.
	 * @param domain - The web domain to filter with.
	 */
	public static webSearchAudit(count?: number, cursor?: string, domain?: string): AxiosRequestConfig {
		return {
			method: 'get',
			url: '/user/web-search-domains/audit-log',
			params: { limit: count, cursor: cursor || undefined, domain: domain },
		};
	}

	/**
	 * Fetches the web search domain filter of the user.
	 */
	public static webSearchDomains(): AxiosRequestConfig {
		return { method: 'get', url: '/user/web-search-domains' };
	}
}
