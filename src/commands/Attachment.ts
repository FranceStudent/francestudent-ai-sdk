import { writeFile } from 'fs/promises';

import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output } from '../helper/CliUtils';

/**
 * Creates a new 'attachment' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'attachment' command.
 */
function createAttachmentCommand(fs: FranceStudent): Command {
	// Creating the 'attachment' command
	const attachment = createCommand('attachment').description(
		'Access resources related to attachments (files v1, used as chat images)',
	);

	// Upload
	attachment
		.command('upload')
		.description('Upload an attachment (typically an image)')
		.argument('<path>', 'The path to the local file')
		.action(async (path: string) => {
			try {
				output(await fs.attachment.upload(path));
			} catch (error) {
				output(error);
			}
		});

	// List
	attachment
		.command('list')
		.description('List the attachments of the user')
		.action(async () => {
			try {
				output(await fs.attachment.list());
			} catch (error) {
				output(error);
			}
		});

	// Details
	attachment
		.command('details')
		.description('Fetch the details of an attachment')
		.argument('<id>', 'The ID of the attachment')
		.action(async (id: string) => {
			try {
				output(await fs.attachment.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Download
	attachment
		.command('download')
		.description('Download the content of an attachment')
		.argument('<id>', 'The ID of the attachment')
		.argument('[output]', 'The path to write the content to (stdout if not set)')
		.action(async (id: string, path?: string) => {
			try {
				const details = await fs.attachment.details(id);

				if (!details?.base64Data) {
					throw new Error(`The attachment '${id}' has no content`);
				}

				const content = Buffer.from(details.base64Data, 'base64');

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
	attachment
		.command('delete')
		.description('Delete an attachment')
		.argument('<id>', 'The ID of the attachment')
		.action(async (id: string) => {
			try {
				await fs.attachment.delete(id);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	return attachment;
}

export default createAttachmentCommand;
