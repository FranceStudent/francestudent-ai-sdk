import { writeFile } from 'fs/promises';

import { Command, createCommand } from 'commander';

import { SortOrder } from '../enums/Data';
import { FranceStudent } from '../FranceStudent';
import { output, parseInteger, readUpload } from '../helper/CliUtils';

type ListOptions = {
	query?: string;
	order?: SortOrder;
};

/**
 * Creates a new 'skill' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'skill' command.
 */
function createSkillCommand(fs: FranceStudent): Command {
	// Creating the 'skill' command
	const skill = createCommand('skill').description('Access resources related to skills');

	// List
	skill
		.command('list')
		.description('List the skills of the user')
		.argument('[count]', 'The number of skills to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of skills to fetch')
		.option('-q, --query <text>', 'The text to search for')
		.option('-o, --order <order>', 'The sort order (asc or desc)')
		.action(async (count?: number, cursor?: string, options?: ListOptions) => {
			try {
				output(await fs.skill.list(count, cursor, options?.query, options?.order));
			} catch (error) {
				output(error);
			}
		});

	// Details
	skill
		.command('details')
		.description('Fetch the details of a skill')
		.argument('<id>', 'The ID of the skill')
		.action(async (id: string) => {
			try {
				output(await fs.skill.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Create
	skill
		.command('create')
		.description('Create a skill out of local files (e.g, a SKILL.md file or a ZIP archive)')
		.argument('<paths...>', 'The paths to the files of the skill')
		.option('--flag <flag...>', 'The flags of the skill')
		.action(async (paths: string[], options?: { flag?: string[] }) => {
			try {
				const files = await Promise.all(paths.map((path) => readUpload(path)));

				output(await fs.skill.create(files, options?.flag));
			} catch (error) {
				output(error);
			}
		});

	// Delete
	skill
		.command('delete')
		.description('Delete a skill')
		.argument('<id>', 'The ID of the skill')
		.action(async (id: string) => {
			try {
				await fs.skill.delete(id);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Download
	skill
		.command('download')
		.description('Download the content of a skill (ZIP), to the given path or to stdout')
		.argument('<id>', 'The ID of the skill')
		.argument('[path]', 'The path to write the ZIP archive to')
		.option('-v, --version <version>', 'The version to download (the default version otherwise)')
		.action(async (id: string, path?: string, options?: { version?: string }) => {
			try {
				const content = await fs.skill.content(id, options?.version);

				if (path) {
					await writeFile(path, content);
					output(path);
				} else {
					process.stdout.write(content);
				}
			} catch (error) {
				output(error);
			}
		});

	// Versions
	skill
		.command('versions')
		.description('List the versions of a skill')
		.argument('<id>', 'The ID of the skill')
		.argument('[count]', 'The number of versions to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of versions to fetch')
		.option('-o, --order <order>', 'The sort order (asc or desc)')
		.action(async (id: string, count?: number, cursor?: string, options?: ListOptions) => {
			try {
				output(await fs.skill.versions(id, count, cursor, options?.order));
			} catch (error) {
				output(error);
			}
		});

	// Version
	skill
		.command('version')
		.description('Fetch the details of a version of a skill')
		.argument('<id>', 'The ID of the skill')
		.argument('<version>', 'The version')
		.action(async (id: string, version: string) => {
			try {
				output(await fs.skill.version(id, version));
			} catch (error) {
				output(error);
			}
		});

	// Publish
	skill
		.command('publish')
		.description('Create a new version of a skill out of local files')
		.argument('<id>', 'The ID of the skill')
		.argument('<paths...>', 'The paths to the files of the new version')
		.option('-d, --default', 'Make the new version the default one')
		.action(async (id: string, paths: string[], options?: { default?: boolean }) => {
			try {
				const files = await Promise.all(paths.map((path) => readUpload(path)));

				output(await fs.skill.createVersion(id, files, options?.default));
			} catch (error) {
				output(error);
			}
		});

	// Set default version
	skill
		.command('set-default')
		.description('Set the default version of a skill')
		.argument('<id>', 'The ID of the skill')
		.argument('<version>', 'The version to make the default one')
		.action(async (id: string, version: string) => {
			try {
				output(await fs.skill.setDefaultVersion(id, version));
			} catch (error) {
				output(error);
			}
		});

	// Delete version
	skill
		.command('delete-version')
		.description('Delete a version of a skill')
		.argument('<id>', 'The ID of the skill')
		.argument('<version>', 'The version to delete')
		.action(async (id: string, version: string) => {
			try {
				await fs.skill.deleteVersion(id, version);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	return skill;
}

export default createSkillCommand;
