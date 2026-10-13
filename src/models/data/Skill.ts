import { ISkill, ISkillVersion } from '../../types/data/Skill';
import { ISkill as IRawSkill, ISkillVersion as IRawSkillVersion } from '../../types/raw/base/Skill';
import { IList } from '../../types/raw/composite/List';

import { CursoredData } from './CursoredData';

/**
 * Converts a UNIX timestamp (in seconds) to a UTC string.
 *
 * @param timestamp - The timestamp.
 *
 * @returns The UTC string, if the timestamp is valid.
 */
function toIsoString(timestamp?: number | string): string | undefined {
	if (timestamp === undefined || timestamp === null) {
		return undefined;
	}

	const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);

	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * The details of a single skill.
 *
 * @public
 */
export class Skill implements ISkill {
	/** The raw skill details. */
	private readonly _raw: IRawSkill;

	public createdAt?: string;
	public defaultVersion?: string;
	public description?: string;
	public id: string;
	public latestVersion?: string;
	public name?: string;

	/**
	 * @param skill - The raw skill details.
	 */
	public constructor(skill: IRawSkill) {
		this._raw = { ...skill };
		this.id = skill.id;
		this.name = skill.name ?? undefined;
		this.description = skill.description || undefined;
		this.defaultVersion = skill.default_version !== undefined ? String(skill.default_version) : undefined;
		this.latestVersion = skill.latest_version !== undefined ? String(skill.latest_version) : undefined;
		this.createdAt = toIsoString(skill.created_at);
	}

	/** The raw skill details. */
	public get raw(): IRawSkill {
		return { ...this._raw };
	}

	/**
	 * Deserializes a page of skills.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized page; the cursor to the next page is the ID of the last skill.
	 */
	public static list(response: IList<IRawSkill>): CursoredData<Skill> {
		const skills = (response?.data ?? []).filter((item) => item?.id !== undefined).map((item) => new Skill(item));

		return new CursoredData(skills, response?.has_more ? (response.last_id ?? skills[skills.length - 1]?.id) : '');
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ISkill {
		return {
			createdAt: this.createdAt,
			defaultVersion: this.defaultVersion,
			description: this.description,
			id: this.id,
			latestVersion: this.latestVersion,
			name: this.name,
		};
	}
}

/**
 * The details of a single version of a skill.
 *
 * @public
 */
export class SkillVersion implements ISkillVersion {
	/** The raw version details. */
	private readonly _raw: IRawSkillVersion;

	public createdAt?: string;
	public description?: string;
	public id?: string;
	public name?: string;
	public skillId?: string;
	public version: string;

	/**
	 * @param version - The raw version details.
	 */
	public constructor(version: IRawSkillVersion) {
		this._raw = { ...version };
		this.id = version.id ?? undefined;
		this.skillId = version.skill_id ?? undefined;
		this.version = String(version.version);
		this.name = version.name ?? undefined;
		this.description = version.description || undefined;
		this.createdAt = toIsoString(version.created_at);
	}

	/** The raw version details. */
	public get raw(): IRawSkillVersion {
		return { ...this._raw };
	}

	/**
	 * Deserializes a page of versions.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized page; the cursor to the next page is the ID of the last version.
	 */
	public static list(response: IList<IRawSkillVersion>): CursoredData<SkillVersion> {
		const versions = (response?.data ?? [])
			.filter((item) => item?.version !== undefined)
			.map((item) => new SkillVersion(item));

		return new CursoredData(
			versions,
			response?.has_more ? (response.last_id ?? versions[versions.length - 1]?.id) : '',
		);
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ISkillVersion {
		return {
			createdAt: this.createdAt,
			description: this.description,
			id: this.id,
			name: this.name,
			skillId: this.skillId,
			version: this.version,
		};
	}
}
