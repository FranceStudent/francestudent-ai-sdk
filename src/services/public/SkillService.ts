import { Extractors } from '../../collections/Extractors';
import { SortOrder } from '../../enums/Data';
import { ResourceType } from '../../enums/Resource';
import { CursoredData } from '../../models/data/CursoredData';
import { Skill, SkillVersion } from '../../models/data/Skill';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IUpload } from '../../types/args/PostArgs';
import { ISkill as IRawSkill, ISkillVersion as IRawSkillVersion } from '../../types/raw/base/Skill';
import { IList } from '../../types/raw/composite/List';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to skills.
 *
 * @public
 */
export class SkillService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Download the content of a skill, at its default version.
	 *
	 * @param id - The ID of the skill.
	 * @param version - The version to download. Defaults to the default version.
	 *
	 * @returns The content of the skill, as a ZIP archive.
	 */
	public async content(id: string, version?: string): Promise<Buffer> {
		if (version !== undefined) {
			const resource = ResourceType.SKILL_VERSION_CONTENT;

			// Downloading the version
			const response = await this.request<ArrayBuffer>(resource, { id: id, version: version });

			// Deserializing response
			const data = Extractors[resource](response.data);

			return data;
		}

		const resource = ResourceType.SKILL_CONTENT;

		// Downloading the skill
		const response = await this.request<ArrayBuffer>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Create a skill.
	 *
	 * @param files - The files of the skill (e.g, a `SKILL.md` file, or a ZIP archive).
	 * @param flags - The flags of the skill.
	 *
	 * @returns The created skill.
	 *
	 * @example
	 *
	 * ```ts
	 * import { readFile } from 'fs/promises';
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Creating a skill out of a local 'SKILL.md' file
	 * fs.skill.create([{ data: await readFile('SKILL.md'), name: 'SKILL.md' }])
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async create(files: IUpload[], flags?: string[]): Promise<Skill> {
		const resource = ResourceType.SKILL_CREATE;

		// Creating the skill
		const response = await this.request<IRawSkill>(resource, { uploads: files, flags: flags });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Create a new version of a skill.
	 *
	 * @param id - The ID of the skill.
	 * @param files - The files of the new version.
	 * @param isDefault - Whether the new version becomes the default one.
	 *
	 * @returns The created version.
	 */
	public async createVersion(id: string, files: IUpload[], isDefault?: boolean): Promise<SkillVersion> {
		const resource = ResourceType.SKILL_VERSION_CREATE;

		// Creating the version
		const response = await this.request<IRawSkillVersion>(resource, {
			id: id,
			uploads: files,
			isDefault: isDefault,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Delete a skill.
	 *
	 * @param id - The ID of the skill to delete.
	 */
	public async delete(id: string): Promise<void> {
		const resource = ResourceType.SKILL_DELETE;

		// Deleting the skill
		await this.request(resource, { id: id });
	}

	/**
	 * Delete a version of a skill.
	 *
	 * @param id - The ID of the skill.
	 * @param version - The version to delete.
	 */
	public async deleteVersion(id: string, version: string): Promise<void> {
		const resource = ResourceType.SKILL_VERSION_DELETE;

		// Deleting the version
		await this.request(resource, { id: id, version: version });
	}

	/**
	 * Get the details of a skill.
	 *
	 * @param id - The ID of the skill.
	 *
	 * @returns The details of the skill.
	 */
	public async details(id: string): Promise<Skill | undefined> {
		const resource = ResourceType.SKILL_DETAILS;

		// Fetching raw skill details
		const response = await this.request<IRawSkill>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of skills of the user.
	 *
	 * @param count - The number of skills to fetch.
	 * @param cursor - The cursor to the batch of skills to fetch.
	 * @param query - The text to search for.
	 * @param order - The sort order.
	 * @param flags - The flags to filter with.
	 *
	 * @returns The batch of skills.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Fetching the skills of the user
	 * fs.skill.list()
	 * .then(res => {
	 * 	console.log(res.list);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async list(
		count?: number,
		cursor?: string,
		query?: string,
		order?: SortOrder,
		flags?: string[],
	): Promise<CursoredData<Skill>> {
		const resource = ResourceType.SKILL_LIST;

		// Fetching raw list of skills
		const response = await this.request<IList<IRawSkill>>(resource, {
			count: count,
			cursor: cursor,
			query: query,
			order: order,
			flags: flags,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Set the default version of a skill.
	 *
	 * @param id - The ID of the skill.
	 * @param version - The version to make the default one.
	 *
	 * @returns The updated skill.
	 */
	public async setDefaultVersion(id: string, version: string): Promise<Skill | undefined> {
		const resource = ResourceType.SKILL_UPDATE;

		// Updating the skill
		const response = await this.request<IRawSkill>(resource, { id: id, version: version });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the details of a version of a skill.
	 *
	 * @param id - The ID of the skill.
	 * @param version - The version.
	 *
	 * @returns The details of the version.
	 */
	public async version(id: string, version: string): Promise<SkillVersion | undefined> {
		const resource = ResourceType.SKILL_VERSION_DETAILS;

		// Fetching raw version details
		const response = await this.request<IRawSkillVersion>(resource, { id: id, version: version });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of versions of a skill.
	 *
	 * @param id - The ID of the skill.
	 * @param count - The number of versions to fetch.
	 * @param cursor - The cursor to the batch of versions to fetch.
	 * @param order - The sort order.
	 *
	 * @returns The batch of versions.
	 */
	public async versions(
		id: string,
		count?: number,
		cursor?: string,
		order?: SortOrder,
	): Promise<CursoredData<SkillVersion>> {
		const resource = ResourceType.SKILL_VERSIONS;

		// Fetching raw list of versions
		const response = await this.request<IList<IRawSkillVersion>>(resource, {
			id: id,
			count: count,
			cursor: cursor,
			order: order,
		});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
