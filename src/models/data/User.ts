import { IUser, IUserSession } from '../../types/data/User';
import { IUserSession as IRawUserSession } from '../../types/raw/base/Session';
import { IUser as IRawUser } from '../../types/raw/base/User';

import { TokenUsage } from './TokenUsage';

/**
 * The details of the authenticated user.
 *
 * @public
 */
export class User implements IUser {
	/** The raw user details. */
	private readonly _raw: IRawUser;

	public avatar?: string;
	public email: string;
	public id: number;
	public language?: string;
	public lastChangelogViewedAt?: string;
	public name: string;
	public pet?: string;
	public providerAccountId?: string;
	public speechToTextLanguage?: string;
	public theme?: string;
	public tokenUsage?: TokenUsage;

	/**
	 * @param user - The raw user details.
	 */
	public constructor(user: IRawUser) {
		this._raw = { ...user };
		this.id = user.id;
		this.name = user.name;
		this.email = user.email;
		this.avatar = user.avatar || undefined;
		this.providerAccountId = user.providerAccountId ?? undefined;
		this.pet = user.pets ?? undefined;
		this.theme = user.theme ?? undefined;
		this.language = user.language ?? undefined;
		this.speechToTextLanguage = user.speechToTextLanguage ?? undefined;
		this.lastChangelogViewedAt = user.lastChangelogViewedAt
			? new Date(user.lastChangelogViewedAt).toISOString()
			: undefined;
		this.tokenUsage = TokenUsage.optional(user.tokenUsage);
	}

	/** The raw user details. */
	public get raw(): IRawUser {
		return { ...this._raw };
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IUser {
		return {
			avatar: this.avatar,
			email: this.email,
			id: this.id,
			language: this.language,
			lastChangelogViewedAt: this.lastChangelogViewedAt,
			name: this.name,
			pet: this.pet,
			providerAccountId: this.providerAccountId,
			speechToTextLanguage: this.speechToTextLanguage,
			theme: this.theme,
			tokenUsage: this.tokenUsage?.toJSON(),
		};
	}
}

/**
 * The details of a session of the user.
 *
 * @public
 */
export class UserSession implements IUserSession {
	public id: string;
	public location?: string;
	public os?: string;
	public since?: string;

	/**
	 * @param session - The raw session details.
	 */
	public constructor(session: IRawUserSession) {
		this.id = session.id;
		this.since = session.since ?? undefined;
		this.os = session.os ?? undefined;
		this.location = session.location ?? undefined;
	}

	/**
	 * Deserializes a list of raw sessions.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized sessions.
	 */
	public static list(response: IRawUserSession[]): UserSession[] {
		return (Array.isArray(response) ? response : [])
			.filter((item) => item?.id !== undefined)
			.map((item) => new UserSession(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IUserSession {
		return { id: this.id, location: this.location, os: this.os, since: this.since };
	}
}
