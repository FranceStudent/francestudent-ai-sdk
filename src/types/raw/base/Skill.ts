/* eslint-disable */

/**
 * Represents the raw data of a single skill.
 *
 * @remarks The API follows the format of OpenAI's Skills API; fields are not guaranteed.
 *
 * @public
 */
export interface ISkill {
	id: string;
	object?: string;
	name?: string;
	description?: string;
	default_version?: string;
	latest_version?: string;
	created_at?: number;
	[key: string]: unknown;
}

/**
 * Represents the raw data of a single version of a skill.
 *
 * @remarks The API follows the format of OpenAI's Skills API; fields are not guaranteed.
 *
 * @public
 */
export interface ISkillVersion {
	id?: string;
	object?: string;
	skill_id?: string;
	version: string;
	name?: string;
	description?: string;
	created_at?: number;
	[key: string]: unknown;
}

/**
 * Represents the raw result of a deletion.
 *
 * @public
 */
export interface IDeleted {
	id?: string;
	object?: string;
	deleted?: boolean;
	[key: string]: unknown;
}
