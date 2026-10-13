import { Command, createCommand } from 'commander';

import { WebSearchFilterType } from '../enums/Data';
import { FranceStudent } from '../FranceStudent';
import { output, parseInteger } from '../helper/CliUtils';
import { IInstructionsUpdates, IUserUpdates } from '../types/args/PostArgs';

type UpdateOptions = {
	name?: string;
	pet?: string;
	theme?: string;
	language?: 'en' | 'fr';
	speechLanguage?: 'en' | 'fr';
};

type InstructionsOptions = {
	text?: string;
	model?: number;
	memory?: boolean;
	reasoning?: IInstructionsUpdates['gptReasoning'];
	webSearch?: IInstructionsUpdates['webSearchMode'];
};

type WebSearchOptions = {
	type?: WebSearchFilterType;
	allow?: string[];
	block?: string[];
};

/**
 * Creates a new 'user' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'user' command.
 */
function createUserCommand(fs: FranceStudent): Command {
	// Creating the 'user' command
	const user = createCommand('user').description('Access resources related to the authenticated user');

	// Simple fetches
	const fetches: [string, string, () => Promise<unknown>][] = [
		['details', 'Fetch the details of the authenticated user', (): Promise<unknown> => fs.user.details()],
		['usage', 'Fetch the rate limit usage', (): Promise<unknown> => fs.user.usage()],
		['budget', 'Fetch the usage of the chat budget', (): Promise<unknown> => fs.user.chatBudget()],
		['credits', 'Fetch the rate limit reset credits', (): Promise<unknown> => fs.user.credits()],
		['sessions', 'List the sessions of the user', (): Promise<unknown> => fs.user.sessions()],
		['flags', 'List the user flags', (): Promise<unknown> => fs.user.flags()],
		['pets', 'List the available pets', (): Promise<unknown> => fs.user.pets()],
		[
			'notifications',
			'Fetch the notification preferences',
			(): Promise<unknown> => fs.user.notificationPreferences(),
		],
		[
			'safety',
			'Fetch the Safety Hub (safety classifications and account standing)',
			(): Promise<unknown> => fs.user.safetyHub(),
		],
	];

	for (const [name, description, action] of fetches) {
		user.command(name)
			.description(description)
			.action(async () => {
				try {
					output(await action());
				} catch (error) {
					output(error);
				}
			});
	}

	// Token usage
	user.command('tokens')
		.description('Fetch the token usage of the user')
		.argument('[days]', 'The number of days of history to fetch', parseInteger)
		.action(async (days?: number) => {
			try {
				output(await fs.user.tokenUsage(days));
			} catch (error) {
				output(error);
			}
		});

	// Update
	user.command('update')
		.description('Update the settings of the user')
		.option('-n, --name <name>', 'The new name')
		.option('-p, --pet <pet>', 'The new pet')
		.option('-t, --theme <theme>', 'The new theme')
		.option('-l, --language <language>', 'The language of the interface (en, fr)')
		.option('-s, --speech-language <language>', 'The language used for speech to text (en, fr)')
		.action(async (options: UpdateOptions) => {
			try {
				const updates: IUserUpdates = {
					name: options.name,
					pets: options.pet,
					theme: options.theme,
					language: options.language,
					speechToTextLanguage: options.speechLanguage,
				};

				output(await fs.user.update(updates));
			} catch (error) {
				output(error);
			}
		});

	// Profile
	user.command('profile')
		.description('Update the public profile of the user')
		.option('-n, --name <name>', 'The new public name')
		.option('-a, --avatar <url>', 'The new avatar')
		.action(async (options: { name?: string; avatar?: string }) => {
			try {
				output(await fs.user.updateProfile({ name: options.name, avatar: options.avatar }));
			} catch (error) {
				output(error);
			}
		});

	// Instructions
	user.command('instructions')
		.description('Fetch the personalization settings, or update them if any option is given')
		.option('-t, --text <instructions>', 'The new custom instructions')
		.option('-m, --model <id>', 'The ID of the default agent', parseInteger)
		.option('--memory', 'Enable the memory')
		.option('--no-memory', 'Disable the memory')
		.option(
			'-r, --reasoning <effort>',
			'The reasoning effort of GPT models (none, minimal, low, medium, high, xhigh)',
		)
		.option('-w, --web-search <mode>', 'The web search mode (open, filtered, disabled)')
		.action(async (options: InstructionsOptions) => {
			try {
				const updates: IInstructionsUpdates = {
					customInstructions: options.text,
					defaultModelId: options.model,
					memoryEnabled: options.memory,
					gptReasoning: options.reasoning,
					webSearchMode: options.webSearch,
				};
				const hasUpdates = Object.values(updates).some((value) => value !== undefined);

				output(hasUpdates ? await fs.user.updateInstructions(updates) : await fs.user.instructions());
			} catch (error) {
				output(error);
			}
		});

	// Notification preferences
	user.command('notify')
		.description('Update the notification preferences')
		.option('--updates', 'Receive app updates')
		.option('--no-updates', 'Do not receive app updates')
		.option('--offers', 'Receive offers and subscriptions')
		.option('--no-offers', 'Do not receive offers and subscriptions')
		.action(async (options: { updates?: boolean; offers?: boolean }) => {
			try {
				output(
					await fs.user.updateNotificationPreferences({
						appUpdates: options.updates,
						offersAndSubscriptions: options.offers,
					}),
				);
			} catch (error) {
				output(error);
			}
		});

	// Web search domains
	user.command('web-search')
		.description('Fetch the web search domain filter, or replace it if any option is given')
		.option('-t, --type <type>', 'The active list (allowlist, blocklist)')
		.option('-a, --allow <domain...>', 'The allowed domains')
		.option('-b, --block <domain...>', 'The blocked domains')
		.action(async (options: WebSearchOptions) => {
			try {
				if (!options.type && !options.allow && !options.block) {
					output(await fs.user.webSearchDomains());
					return;
				}

				const current = await fs.user.webSearchDomains();

				output(
					await fs.user.updateWebSearchDomains({
						filterType: options.type ?? (current.filterType as WebSearchFilterType),
						allowedDomains: options.allow ?? current.allowedDomains ?? [],
						blockedDomains: options.block ?? current.blockedDomains ?? [],
					}),
				);
			} catch (error) {
				output(error);
			}
		});

	// Web search history
	user.command('web-history')
		.description('Fetch the web search history')
		.argument('[count]', 'The number of entries to fetch', parseInteger)
		.argument('[cursor]', 'The cursor to the batch of entries to fetch')
		.option('-d, --domain <domain>', 'The web domain to filter with')
		.action(async (count?: number, cursor?: string, options?: { domain?: string }) => {
			try {
				output(await fs.user.webSearchAudit(count, cursor, options?.domain));
			} catch (error) {
				output(error);
			}
		});

	// Invite
	user.command('invite')
		.description('Invite a person to FranceStudent')
		.argument('<email>', 'The email address of the person to invite')
		.action(async (email: string) => {
			try {
				output(await fs.user.invite(email));
			} catch (error) {
				output(error);
			}
		});

	// Beta
	user.command('beta')
		.description('Register to the beta')
		.action(async () => {
			try {
				output(await fs.user.registerBeta());
			} catch (error) {
				output(error);
			}
		});

	// Power-up
	user.command('power-up')
		.description('Activate a rate limit power-up, using one of the available credits')
		.action(async () => {
			try {
				output(await fs.user.activatePowerUp());
			} catch (error) {
				output(error);
			}
		});

	// Appeal
	user.command('appeal')
		.description('Appeal a safety classification')
		.argument('<id>', 'The ID of the safety classification')
		.argument('<signal>', 'The reason of the appeal (0 to 3)', parseInteger)
		.argument('[explanation]', 'An explanation')
		.action(async (id: string, signal: number, explanation?: string) => {
			try {
				output(await fs.user.appeal(id, { signal: signal, userInput: explanation }));
			} catch (error) {
				output(error);
			}
		});

	// Terminate session(s)
	user.command('logout')
		.description('Terminate a session, or all the sessions with --all')
		.argument('[id]', 'The ID of the session to terminate')
		.option('--all', 'Terminate all the sessions')
		.option('-y, --yes', 'Confirm terminating all the sessions')
		.action(async (id?: string, options?: { all?: boolean; yes?: boolean }) => {
			try {
				if (options?.all) {
					if (!options.yes) {
						throw new Error('Terminating all the sessions cannot be undone, confirm with --yes');
					}
					await fs.user.terminateAllSessions();
				} else if (id) {
					await fs.user.terminateSession(id);
				} else {
					throw new Error('A session ID, or --all, is required');
				}
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Delete account
	user.command('delete')
		.description('Delete the account of the user')
		.option('-y, --yes', 'Confirm the deletion')
		.action(async (options: { yes?: boolean }) => {
			try {
				if (!options.yes) {
					throw new Error('Deleting the account cannot be undone, confirm with --yes');
				}
				await fs.user.delete();
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	return user;
}

export default createUserCommand;
