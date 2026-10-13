import { writeFile } from 'fs/promises';

import { Command, createCommand } from 'commander';

import { SortOrder } from '../enums/Data';
import { FranceStudent } from '../FranceStudent';
import { output, parseInteger } from '../helper/CliUtils';

type FileListOptions = {
	order?: SortOrder;
	purpose?: string;
};

type FileUploadOptions = {
	expiresAfter?: number;
	anchor: string;
};

/**
 * Creates a new 'file' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'file' command.
 */
function createFileCommand(fs: FranceStudent): Command {
	// Creating the 'file' command
	const file = createCommand('file').description('Access resources related to stored files (files v2)');

	// Upload
	file.command('upload')
		.description('Upload a file')
		.argument('<path>', 'The path to the local file')
		.option('-e, --expires-after <seconds>', 'Delete the file after the given number of seconds', parseInteger)
		.option('--anchor <anchor>', 'The anchor of the expiration', 'created_at')
		.action(async (path: string, options: FileUploadOptions) => {
			try {
				output(
					await fs.file.upload(
						path,
						options.expiresAfter !== undefined
							? { anchor: options.anchor, seconds: options.expiresAfter }
							: undefined,
					),
				);
			} catch (error) {
				output(error);
			}
		});

	// List
	file.command('list')
		.description('List the files of the user')
		.argument('[count]', 'The number of files to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of files to fetch')
		.option('-o, --order <order>', 'The sort order (asc or desc)')
		.option('-p, --purpose <purpose>', 'The purpose of files to filter with')
		.action(async (count?: number, cursor?: string, options?: FileListOptions) => {
			try {
				output(await fs.file.list(count, cursor, options?.order, options?.purpose));
			} catch (error) {
				output(error);
			}
		});

	// Details
	file.command('details')
		.description('Fetch the details of a file')
		.argument('<id>', 'The ID of the file')
		.action(async (id: string) => {
			try {
				output(await fs.file.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Download
	file.command('download')
		.description('Download the content of a file')
		.argument('<id>', 'The ID of the file')
		.argument('[output]', 'The path to write the content to (stdout if not set)')
		.action(async (id: string, path?: string) => {
			try {
				const content = await fs.file.content(id);

				if (path) {
					await writeFile(path, content);
					output('OK');
				} else {
					process.stdout.write(content);
				}
			} catch (error) {
				output(error);
			}
		});

	// Delete
	file.command('delete')
		.description('Delete a file')
		.argument('<id>', 'The ID of the file')
		.action(async (id: string) => {
			try {
				output({ deleted: await fs.file.delete(id) });
			} catch (error) {
				output(error);
			}
		});

	// Usage
	file.command('usage')
		.description('Fetch the storage usage of the user')
		.action(async () => {
			try {
				output(await fs.file.usage());
			} catch (error) {
				output(error);
			}
		});

	// MIME types
	file.command('mime-types')
		.description('List the supported MIME types')
		.action(async () => {
			try {
				output(await fs.file.mimeTypes());
			} catch (error) {
				output(error);
			}
		});

	return file;
}

export default createFileCommand;
