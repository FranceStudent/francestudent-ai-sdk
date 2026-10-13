/**
 * The details of a single skill.
 *
 * @public
 */
export interface ISkill {
	/** The date and time of creation of the skill, in UTC string format. */
	createdAt?: string;

	/** The default version of the skill. */
	defaultVersion?: string;

	/** The description of the skill. */
	description?: string;

	/** The ID of the skill. */
	id: string;

	/** The latest version of the skill. */
	latestVersion?: string;

	/** The name of the skill. */
	name?: string;
}

/**
 * The details of a single version of a skill.
 *
 * @public
 */
export interface ISkillVersion {
	/** The date and time of creation of the version, in UTC string format. */
	createdAt?: string;

	/** The description of the skill, in this version. */
	description?: string;

	/** The ID of the version. */
	id?: string;

	/** The name of the skill, in this version. */
	name?: string;

	/** The ID of the skill. */
	skillId?: string;

	/** The version. */
	version: string;
}
