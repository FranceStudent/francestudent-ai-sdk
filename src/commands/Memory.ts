import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output } from '../helper/CliUtils';

/**
 * Creates a new 'memory' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'memory' command.
 */
function createMemoryCommand(fs: FranceStudent): Command {
	// Creating the 'memory' command
	const memory = createCommand('memory').description('Access resources related to the memories of the user');

	// List
	memory
		.command('list')
		.description('List the memories of the user')
		.action(async () => {
			try {
				output(await fs.memory.list());
			} catch (error) {
				output(error);
			}
		});

	// Details
	memory
		.command('details')
		.description('Fetch the details of a memory, including its content')
		.argument('<id>', 'The ID of the memory')
		.action(async (id: string) => {
			try {
				output(await fs.memory.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Delete
	memory
		.command('delete')
		.description('Delete a memory, or all the memories with --all')
		.argument('[id]', 'The ID of the memory')
		.option('--all', 'Delete all the memories')
		.option('-y, --yes', 'Confirm deleting all the memories')
		.action(async (id?: string, options?: { all?: boolean; yes?: boolean }) => {
			try {
				if (options?.all) {
					if (!options.yes) {
						throw new Error('Deleting all the memories cannot be undone, confirm with --yes');
					}
					await fs.memory.deleteAll();
				} else if (id) {
					await fs.memory.delete(id);
				} else {
					throw new Error('A memory ID, or --all, is required');
				}
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	return memory;
}

export default createMemoryCommand;
