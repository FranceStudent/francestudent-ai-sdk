import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { User, UserSession } from '../../models/data/User';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import {
	IInstructionsUpdates,
	INotificationPreferences as INotificationPreferencesArgs,
	IProfileUpdates,
	ISafetyAppeal,
	IUserUpdates,
	IWebSearchDomains,
} from '../../types/args/PostArgs';
import { ISafetyAppealResponse, ISafetyHub } from '../../types/raw/base/Safety';
import { IUserSession as IRawUserSession } from '../../types/raw/base/Session';
import {
	INotificationPreferences,
	IUserFlag,
	IUserPersonalization,
	IUserReferralInvite,
} from '../../types/raw/base/Settings';
import {
	IBudgetUsage,
	IRateLimitCredits,
	IRateLimitPowerUp,
	IUserTokenUsage,
	IUserUsage,
} from '../../types/raw/base/Usage';
import { IUser as IRawUser } from '../../types/raw/base/User';
import { IUserWebSearchDomains } from '../../types/raw/base/WebSearch';
import { IWebSearchAuditPage } from '../../types/raw/composite/WebSearchAuditPage';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to the authenticated user.
 *
 * @public
 */
export class UserService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Activate a rate limit power-up, using one of the available credits.
	 *
	 * @returns The state of the power-up.
	 */
	public async activatePowerUp(): Promise<IRateLimitPowerUp> {
		const resource = ResourceType.USER_RATE_LIMIT_POWER_UP;

		// Activating the power-up
		const response = await this.request<IRateLimitPowerUp>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Appeal a safety classification.
	 *
	 * @param id - The ID of the safety classification.
	 * @param appeal - The appeal (signal and explanation).
	 *
	 * @returns The ID of the appeal.
	 */
	public async appeal(id: string, appeal: ISafetyAppeal): Promise<ISafetyAppealResponse> {
		const resource = ResourceType.USER_SAFETY_APPEAL;

		// Submitting the appeal
		const response = await this.request<ISafetyAppealResponse>(resource, { id: id, appeal: appeal });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the usage of the chat budget.
	 *
	 * @returns The usage of the chat budget.
	 */
	public async chatBudget(): Promise<IBudgetUsage> {
		const resource = ResourceType.USER_CHAT_BUDGET;

		// Fetching raw budget usage
		const response = await this.request<IBudgetUsage>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the rate limit reset credits of the user.
	 *
	 * @returns The available credits.
	 */
	public async credits(): Promise<IRateLimitCredits> {
		const resource = ResourceType.USER_RATE_LIMIT_CREDITS;

		// Fetching raw credits
		const response = await this.request<IRateLimitCredits>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Delete the account of the user.
	 *
	 * @remarks This cannot be undone.
	 */
	public async delete(): Promise<void> {
		const resource = ResourceType.USER_DELETE;

		// Deleting the account
		await this.request(resource, {});
	}

	/**
	 * Get the details of the authenticated user.
	 *
	 * @returns The details of the user.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the details of the authenticated user
	 * fs.user.details()
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async details(): Promise<User | undefined> {
		const resource = ResourceType.USER_DETAILS;

		// Fetching raw user details
		const response = await this.request<IRawUser>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of user flags.
	 *
	 * @returns The list of flags.
	 */
	public async flags(): Promise<IUserFlag[]> {
		const resource = ResourceType.USER_FLAGS;

		// Fetching raw list of flags
		const response = await this.request<IUserFlag[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the personalization settings (custom instructions, default model, memory, web search, ...).
	 *
	 * @returns The personalization settings.
	 */
	public async instructions(): Promise<IUserPersonalization> {
		const resource = ResourceType.USER_INSTRUCTIONS;

		// Fetching raw personalization settings
		const response = await this.request<IUserPersonalization>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Invite a person to FranceStudent.
	 *
	 * @param email - The email address of the person to invite.
	 *
	 * @returns The invitation.
	 */
	public async invite(email: string): Promise<IUserReferralInvite> {
		const resource = ResourceType.USER_INVITE;

		// Sending the invitation
		const response = await this.request<IUserReferralInvite>(resource, { email: email });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the notification preferences.
	 *
	 * @returns The notification preferences.
	 */
	public async notificationPreferences(): Promise<INotificationPreferences> {
		const resource = ResourceType.USER_NOTIFICATION_PREFERENCES;

		// Fetching raw notification preferences
		const response = await this.request<INotificationPreferences>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of available pets, as returned by the API.
	 *
	 * @returns The list of pets.
	 */
	public async pets(): Promise<unknown[]> {
		const resource = ResourceType.USER_PETS;

		// Fetching raw list of pets
		const response = await this.request<unknown[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Register to the beta.
	 *
	 * @returns The updated details of the user.
	 */
	public async registerBeta(): Promise<User | undefined> {
		const resource = ResourceType.USER_REGISTER_BETA;

		// Registering to the beta
		const response = await this.request<IRawUser>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the Safety Hub of the user (safety classifications and account standing).
	 *
	 * @returns The Safety Hub.
	 */
	public async safetyHub(): Promise<ISafetyHub> {
		const resource = ResourceType.USER_SAFETY_HUB;

		// Fetching raw Safety Hub
		const response = await this.request<ISafetyHub>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of sessions of the user.
	 *
	 * @returns The list of sessions.
	 */
	public async sessions(): Promise<UserSession[]> {
		const resource = ResourceType.USER_SESSIONS;

		// Fetching raw list of sessions
		const response = await this.request<IRawUserSession[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Terminate all the sessions of the user.
	 *
	 * @remarks This cannot be undone. The current session token may stop working.
	 */
	public async terminateAllSessions(): Promise<void> {
		const resource = ResourceType.USER_SESSIONS_TERMINATE_ALL;

		// Terminating all the sessions
		await this.request(resource, {});
	}

	/**
	 * Terminate a session of the user.
	 *
	 * @param id - The ID of the session to terminate.
	 */
	public async terminateSession(id: string): Promise<void> {
		const resource = ResourceType.USER_SESSION_TERMINATE;

		// Terminating the session
		await this.request(resource, { id: id });
	}

	/**
	 * Get the token usage of the user.
	 *
	 * @param days - The number of days of history to fetch.
	 *
	 * @returns The token usage, in total and per day.
	 */
	public async tokenUsage(days?: number): Promise<IUserTokenUsage> {
		const resource = ResourceType.USER_TOKEN_USAGE;

		// Fetching raw token usage
		const response = await this.request<IUserTokenUsage>(resource, { days: days });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Update the settings of the user (name, pet, theme, language, ...).
	 *
	 * @param updates - The updates to apply.
	 *
	 * @returns The updated details of the user.
	 */
	public async update(updates: IUserUpdates): Promise<User | undefined> {
		const resource = ResourceType.USER_UPDATE;

		// Updating the user
		const response = await this.request<IRawUser>(resource, { userUpdates: updates });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Update the personalization settings (custom instructions, default model, memory, web search, ...).
	 *
	 * @param updates - The updates to apply.
	 *
	 * @returns The updated personalization settings.
	 */
	public async updateInstructions(updates: IInstructionsUpdates): Promise<IUserPersonalization> {
		const resource = ResourceType.USER_INSTRUCTIONS_UPDATE;

		// Updating the personalization settings
		const response = await this.request<IUserPersonalization>(resource, { instructions: updates });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Update the notification preferences.
	 *
	 * @param preferences - The notification preferences to set.
	 *
	 * @returns The updated notification preferences.
	 */
	public async updateNotificationPreferences(
		preferences: INotificationPreferencesArgs,
	): Promise<INotificationPreferences> {
		const resource = ResourceType.USER_NOTIFICATION_PREFERENCES_UPDATE;

		// Updating the notification preferences
		const response = await this.request<INotificationPreferences>(resource, {
			notificationPreferences: preferences,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Update the public profile of the user (name, avatar).
	 *
	 * @param updates - The updates to apply.
	 *
	 * @returns The updated details of the user.
	 */
	public async updateProfile(updates: IProfileUpdates): Promise<User | undefined> {
		const resource = ResourceType.USER_PROFILE_UPDATE;

		// Updating the public profile
		const response = await this.request<IRawUser>(resource, { profileUpdates: updates });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Replace the web search domain lists, and choose the active one.
	 *
	 * @param domains - The web search domain filter to set.
	 *
	 * @returns The updated web search domain filter.
	 */
	public async updateWebSearchDomains(domains: IWebSearchDomains): Promise<IUserWebSearchDomains> {
		const resource = ResourceType.USER_WEB_SEARCH_DOMAINS_UPDATE;

		// Updating the web search domain filter
		const response = await this.request<IUserWebSearchDomains>(resource, { webSearchDomains: domains });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the rate limit usage of the user.
	 *
	 * @returns The usage of each rate limit, and of the chat budget.
	 */
	public async usage(): Promise<IUserUsage> {
		const resource = ResourceType.USER_USAGE;

		// Fetching raw rate limit usage
		const response = await this.request<IUserUsage>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the web search history of the user.
	 *
	 * @param count - The number of entries to fetch.
	 * @param cursor - The cursor to the batch of entries to fetch (`nextCursor` of the previous page).
	 * @param domain - The web domain to filter with.
	 *
	 * @returns The batch of entries.
	 */
	public async webSearchAudit(count?: number, cursor?: string, domain?: string): Promise<IWebSearchAuditPage> {
		const resource = ResourceType.USER_WEB_SEARCH_AUDIT;

		// Fetching raw web search history
		const response = await this.request<IWebSearchAuditPage>(resource, {
			count: count,
			cursor: cursor,
			domain: domain,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the web search domain filter of the user.
	 *
	 * @returns The web search domain filter.
	 */
	public async webSearchDomains(): Promise<IUserWebSearchDomains> {
		const resource = ResourceType.USER_WEB_SEARCH_DOMAINS;

		// Fetching raw web search domain filter
		const response = await this.request<IUserWebSearchDomains>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
