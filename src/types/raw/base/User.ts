import { ITokenUsage } from './TokenUsage';

/**
 * Represents the raw data of the authenticated user.
 *
 * @public
 */
export interface IUser {
	id: number;
	name: string;
	email: string;
	avatar?: string;
	providerAccountId?: string;
	pets?: string;
	theme?: string;
	language?: string;
	speechToTextLanguage?: string;
	lastChangelogViewedAt?: string;
	tokenUsage?: ITokenUsage;
}

/**
 * Represents the raw data of a user, as embedded in a chat document.
 *
 * @public
 */
export interface IUserDocument extends IUser {
	flags?: number;
	lastActiveAt?: string;
	userFlags?: string[];
}
