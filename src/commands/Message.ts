import { writeFile } from 'fs/promises';

import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output, parseInteger } from '../helper/CliUtils';

/**
 * Creates a new 'message' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'message' command.
 */
function createMessageCommand(fs: FranceStudent): Command {
	// Creating the 'message' command
	const message = createCommand('message').description('Access resources related to messages');

	// Edit
	message
		.command('edit')
		.description('Edit a message, which forks the chat from that message')
		.argument('<chatId>', 'The ID of the chat')
		.argument('<messageId>', 'The ID of the message')
		.argument('<content>', 'The new content of the message')
		.action(async (chatId: string, messageId: string, content: string) => {
			try {
				output(await fs.message.edit(chatId, messageId, content));
			} catch (error) {
				output(error);
			}
		});

	// Vote
	message
		.command('vote')
		.description('Upvote a message, or downvote it with --down')
		.argument('<messageId>', 'The ID of the message')
		.option('--down', 'Downvote the message')
		.action(async (messageId: string, options: { down?: boolean }) => {
			try {
				output(await fs.message.vote(messageId, !options.down));
			} catch (error) {
				output(error);
			}
		});

	// Save
	message
		.command('save')
		.description('Save a message')
		.argument('<chatId>', 'The ID of the chat')
		.argument('<messageId>', 'The ID of the message')
		.action(async (chatId: string, messageId: string) => {
			try {
				output(await fs.message.save(chatId, messageId));
			} catch (error) {
				output(error);
			}
		});

	// Unsave
	message
		.command('unsave')
		.description('Unsave a message')
		.argument('<chatId>', 'The ID of the chat')
		.argument('<messageId>', 'The ID of the message')
		.action(async (chatId: string, messageId: string) => {
			try {
				await fs.message.unsave(chatId, messageId);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Saved
	message
		.command('saved')
		.description('List the saved messages')
		.argument('[count]', 'The number of saved messages to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of saved messages to fetch')
		.action(async (count?: number, cursor?: string) => {
			try {
				output(await fs.message.saved(count, cursor));
			} catch (error) {
				output(error);
			}
		});

	// Image
	message
		.command('image')
		.description('Download an image generated in a message, to a file or to stdout')
		.argument('<chatId>', 'The ID of the chat')
		.argument('<messageId>', 'The ID of the message')
		.argument('<imageId>', 'The ID of the image')
		.argument('[path]', 'The path of the file to write; stdout if not set')
		.action(async (chatId: string, messageId: string, imageId: string, path?: string) => {
			try {
				const image = await fs.message.image(chatId, messageId, imageId);

				if (path) {
					await writeFile(path, image);
					output(path);
				} else {
					process.stdout.write(image);
				}
			} catch (error) {
				output(error);
			}
		});

	return message;
}

export default createMessageCommand;
