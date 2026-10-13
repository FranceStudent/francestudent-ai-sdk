import { Command, createCommand } from 'commander';

import { SharePermission } from '../enums/Data';
import { FranceStudent } from '../FranceStudent';
import { output, parseInteger } from '../helper/CliUtils';

type AskOptions = {
	agent: number;
	chat?: string;
	project?: string;
	web?: boolean;
	public?: boolean;
	incognito?: boolean;
	file?: string[];
	image?: string[];
	json?: boolean;
};

type ShareOptions = {
	email?: string;
	user?: number;
	write?: boolean;
};

/**
 * Creates a new 'chat' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'chat' command.
 */
function createChatCommand(fs: FranceStudent): Command {
	// Creating the 'chat' command
	const chat = createCommand('chat').description('Access resources related to agents and chats');

	// Agents
	chat.command('agents')
		.description('List the available agents (models)')
		.option('-a, --all', 'Include disabled agents')
		.action(async (options?: { all?: boolean }) => {
			try {
				output(await fs.chat.agents(options?.all));
			} catch (error) {
				output(error);
			}
		});

	// Models
	chat.command('models')
		.description('List the available models, as returned by the API')
		.action(async () => {
			try {
				output(await fs.chat.models());
			} catch (error) {
				output(error);
			}
		});

	// Ask
	chat.command('ask')
		.description('Send a message to an agent, in a new chat or an existing one, and stream the answer')
		.argument('<message>', 'The message to send')
		.option('-a, --agent <id>', 'The ID of the agent to use (see "chat agents")', parseInteger, -1002)
		.option('-c, --chat <id>', 'The ID of an existing chat to continue')
		.option('-p, --project <id>', 'The ID of the project to create the chat in')
		.option('-w, --web', 'Enable web search')
		.option('--public', 'Create a non-private chat')
		.option('--incognito', 'Create an incognito chat')
		.option('-f, --file <id...>', 'The IDs of uploaded files (v2) to attach')
		.option('-i, --image <id...>', 'The IDs of uploaded images to attach')
		.option('--json', 'Output the complete response as JSON, instead of streaming the text')
		.action(async (message: string, options: AskOptions) => {
			try {
				const onDelta = options.json ? undefined : (delta: string): boolean => process.stdout.write(delta);
				const response = options.chat
					? await fs.chat.reply(
							options.chat,
							{
								content: message,
								agentId: options.agent,
								enableWebSearch: options.web,
								files: options.file,
								images: options.image,
							},
							{ onDelta: onDelta },
						)
					: await fs.chat.ask(
							{
								agentId: options.agent,
								content: message,
								enableWebSearch: options.web,
								files: options.file,
								images: options.image,
								isIncognito: options.incognito,
								isPrivate: !options.public,
								projectId: options.project,
							},
							{ onDelta: onDelta },
						);

				if (options.json) {
					output(response);
				} else {
					process.stdout.write('\n');
					console.error(`[chat: ${response.chatId ?? 'unknown'}]`);
				}
			} catch (error) {
				output(error);
			}
		});

	// List
	chat.command('list')
		.description('List the chats of the user')
		.argument('[count]', 'The number of chats to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of chats to fetch')
		.option('--archived', 'List the archived chats instead')
		.action(async (count?: number, cursor?: string, options?: { archived?: boolean }) => {
			try {
				output(options?.archived ? await fs.chat.archived(count, cursor) : await fs.chat.list(count, cursor));
			} catch (error) {
				output(error);
			}
		});

	// Search
	chat.command('search')
		.description('Search the chats of the user')
		.argument('<query>', 'The text to search for')
		.argument('[count]', 'The number of chats to fetch', parseInteger)
		.action(async (query: string, count?: number) => {
			try {
				output(await fs.chat.search(query, count));
			} catch (error) {
				output(error);
			}
		});

	// Details
	chat.command('details')
		.description('Fetch the details of a chat, including its messages')
		.argument('<id>', 'The ID of the chat')
		.action(async (id: string) => {
			try {
				output(await fs.chat.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Usage
	chat.command('usage')
		.description('Fetch the token usage of a chat')
		.argument('<id>', 'The ID of the chat')
		.action(async (id: string) => {
			try {
				output(await fs.chat.usage(id));
			} catch (error) {
				output(error);
			}
		});

	// Rename
	chat.command('rename')
		.description('Rename a chat')
		.argument('<id>', 'The ID of the chat')
		.argument('<title>', 'The new title')
		.action(async (id: string, title: string) => {
			try {
				output(await fs.chat.update(id, { title: title }));
			} catch (error) {
				output(error);
			}
		});

	// Cancel
	chat.command('cancel')
		.description('Stop the generation of the response of a chat')
		.argument('<id>', 'The ID of the chat')
		.action(async (id: string) => {
			try {
				output(await fs.chat.cancel(id));
			} catch (error) {
				output(error);
			}
		});

	// Simple actions on a chat
	const actions: [string, string, (id: string) => Promise<void>][] = [
		['archive', 'Archive a chat', (id): Promise<void> => fs.chat.archive(id)],
		['restore', 'Restore an archived chat', (id): Promise<void> => fs.chat.restore(id)],
		['pin', 'Pin a chat', (id): Promise<void> => fs.chat.pin(id)],
		['unpin', 'Unpin a chat', (id): Promise<void> => fs.chat.unpin(id)],
		['delete', 'Delete a chat', (id): Promise<void> => fs.chat.delete(id)],
	];

	for (const [name, description, action] of actions) {
		chat.command(name)
			.description(description)
			.argument('<id>', 'The ID of the chat')
			.action(async (id: string) => {
				try {
					await action(id);
					output('OK');
				} catch (error) {
					output(error);
				}
			});
	}

	// Delete all
	chat.command('delete-all')
		.description('Delete all the chats of the user')
		.option('-y, --yes', 'Confirm the deletion')
		.action(async (options?: { yes?: boolean }) => {
			try {
				if (!options?.yes) {
					throw new Error('Deleting all the chats cannot be undone, confirm with --yes');
				}

				await fs.chat.deleteAll();
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Download
	chat.command('download')
		.description('Download the messages of an archived chat (JSON)')
		.argument('<id>', 'The ID of the archived chat')
		.action(async (id: string) => {
			try {
				process.stdout.write(await fs.chat.download(id));
			} catch (error) {
				output(error);
			}
		});

	// Import
	chat.command('import')
		.description('Import a shared OpenAI (ChatGPT) conversation')
		.argument('<link>', 'The share link of the conversation')
		.argument('<model>', 'The local model to continue the conversation with')
		.action(async (link: string, model: string) => {
			try {
				output(await fs.chat.importOpenAi({ link: link, model: model }));
			} catch (error) {
				output(error);
			}
		});

	// Shares
	chat.command('shares')
		.description('List the users a chat is shared with')
		.argument('<id>', 'The ID of the chat')
		.action(async (id: string) => {
			try {
				output(await fs.chat.shares(id));
			} catch (error) {
				output(error);
			}
		});

	// Share
	chat.command('share')
		.description('Share a chat with a user, or update their permission')
		.argument('<id>', 'The ID of the chat')
		.option('-e, --email <email>', 'The email address of the user')
		.option('-u, --user <id>', 'The ID of the user', parseInteger)
		.option('--write', 'Grant write permission (read-only by default)')
		.option('--update', 'Update an existing share')
		.action(async (id: string, options: ShareOptions & { update?: boolean }) => {
			try {
				const share = {
					userEmail: options.email,
					userId: options.user,
					permission: options.write ? SharePermission.WRITE : SharePermission.VIEW,
				};

				output(options.update ? await fs.chat.updateShare(id, share) : await fs.chat.share(id, share));
			} catch (error) {
				output(error);
			}
		});

	// Unshare
	chat.command('unshare')
		.description('Stop sharing a chat with a user')
		.argument('<id>', 'The ID of the chat')
		.option('-e, --email <email>', 'The email address of the user')
		.option('-u, --user <id>', 'The ID of the user', parseInteger)
		.action(async (id: string, options: ShareOptions) => {
			try {
				await fs.chat.unshare(id, { userEmail: options.email, userId: options.user });
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	return chat;
}

export default createChatCommand;
