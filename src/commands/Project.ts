import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output, parseInteger } from '../helper/CliUtils';

/**
 * Creates a new 'project' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'project' command.
 */
function createProjectCommand(fs: FranceStudent): Command {
	// Creating the 'project' command
	const project = createCommand('project').description('Access resources related to projects');

	// List
	project
		.command('list')
		.description('List the projects of the user')
		.option('-s, --shared', 'List the projects shared with the user instead')
		.action(async (options?: { shared?: boolean }) => {
			try {
				output(options?.shared ? await fs.project.shared() : await fs.project.list());
			} catch (error) {
				output(error);
			}
		});

	// Details
	project
		.command('details')
		.description('Fetch the details of a project')
		.argument('<id>', 'The ID of the project')
		.action(async (id: string) => {
			try {
				output(await fs.project.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Create
	project
		.command('create')
		.description('Create a project')
		.argument('<name>', 'The name of the project')
		.action(async (name: string) => {
			try {
				output(await fs.project.create(name));
			} catch (error) {
				output(error);
			}
		});

	// Update
	project
		.command('update')
		.description('Update a project')
		.argument('<id>', 'The ID of the project')
		.option('-n, --name <name>', 'The new name of the project')
		.option('--flags <flags>', 'The new raw flags of the project', parseInteger)
		.action(async (id: string, options: { name?: string; flags?: number }) => {
			try {
				output(await fs.project.update(id, { name: options.name, flags: options.flags }));
			} catch (error) {
				output(error);
			}
		});

	// Delete
	project
		.command('delete')
		.description('Delete a project')
		.argument('<id>', 'The ID of the project')
		.option('-y, --yes', 'Confirm the deletion')
		.action(async (id: string, options: { yes?: boolean }) => {
			try {
				if (!options.yes) {
					throw new Error('Deleting a project cannot be undone, confirm with --yes');
				}

				await fs.project.delete(id);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Chats
	project
		.command('chats')
		.description('List the chats of a project')
		.argument('<id>', 'The ID of the project')
		.argument('[count]', 'The number of chats to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of chats to fetch')
		.action(async (id: string, count?: number, cursor?: string) => {
			try {
				output(await fs.project.chats(id, count, cursor));
			} catch (error) {
				output(error);
			}
		});

	// Add chat
	project
		.command('add-chat')
		.description('Add a chat to a project')
		.argument('<id>', 'The ID of the project')
		.argument('<chatId>', 'The ID of the chat')
		.action(async (id: string, chatId: string) => {
			try {
				output(await fs.project.addChat(id, chatId));
			} catch (error) {
				output(error);
			}
		});

	// Remove chat
	project
		.command('remove-chat')
		.description('Remove a chat from a project')
		.argument('<id>', 'The ID of the project')
		.argument('<chatId>', 'The ID of the chat')
		.action(async (id: string, chatId: string) => {
			try {
				await fs.project.removeChat(id, chatId);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Shares
	project
		.command('shares')
		.description('List the users a project is shared with')
		.argument('<id>', 'The ID of the project')
		.action(async (id: string) => {
			try {
				output(await fs.project.shares(id));
			} catch (error) {
				output(error);
			}
		});

	// Share
	project
		.command('share')
		.description('Share a project with a user')
		.argument('<id>', 'The ID of the project')
		.argument('<email>', 'The email address of the user')
		.action(async (id: string, email: string) => {
			try {
				output(await fs.project.share(id, email));
			} catch (error) {
				output(error);
			}
		});

	// Unshare
	project
		.command('unshare')
		.description('Stop sharing a project with a user')
		.argument('<id>', 'The ID of the project')
		.argument('<userId>', 'The ID of the user', parseInteger)
		.action(async (id: string, userId: number) => {
			try {
				await fs.project.unshare(id, userId);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	return project;
}

export default createProjectCommand;
