import { ITokenUsage } from './TokenUsage';

/**
 * The details of the authenticated user.
 *
 * @public
 */
export interface IUser {
	/** The URL of the avatar of the user. */
	avatar?: string;

	/** The email address of the user. */
	email: string;

	/** The ID of the user. */
	id: number;

	/** The language of the interface (`en`, `fr`). */
	language?: string;

	/** The date and time at which the changelog was last viewed, in UTC string format. */
	lastChangelogViewedAt?: string;

	/** The name of the user. */
	name: string;

	/** The pet of the user. */
	pet?: string;

	/** The ID of the user's account at the authentication provider. */
	providerAccountId?: string;

	/** The language used for speech to text (`en`, `fr`). */
	speechToTextLanguage?: string;

	/** The theme of the interface. */
	theme?: string;

	/** The token usage of the user. */
	tokenUsage?: ITokenUsage;
}

/**
 * The details of a session of the user.
 *
 * @public
 */
export interface IUserSession {
	/** The ID of the session. */
	id: string;

	/** The approximate location of the session. */
	location?: string;

	/** The operating system of the session. */
	os?: string;

	/** Since when the session is active, as returned by the API. */
	since?: string;
}
