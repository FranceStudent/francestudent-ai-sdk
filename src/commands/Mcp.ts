import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output } from '../helper/CliUtils';
import { IMcpServerUpdates } from '../types/args/PostArgs';

type McpOptions = {
	label?: string;
	url?: string;
	description?: string;
	authType?: string;
	authorization?: string;
	header?: string[];
	allowedTool?: string[];
	scope?: string[];
	requireApproval?: string;
	deferLoading?: boolean;
	disabled?: boolean;
	enabled?: boolean;
	clearAuthorization?: boolean;
	clearHeaders?: boolean;
};

/**
 * Parses 'key=value' header options.
 *
 * @param headers - The raw header options.
 *
 * @returns The headers, if any.
 */
function parseHeaders(headers?: string[]): Record<string, string> | undefined {
	if (!headers?.length) {
		return undefined;
	}

	const parsed: Record<string, string> = {};

	for (const header of headers) {
		const separator = header.indexOf('=');

		if (separator <= 0) {
			throw new Error(`Invalid header '${header}', expected 'name=value'`);
		}

		parsed[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
	}

	return parsed;
}

/**
 * Builds the MCP server settings out of the command options.
 *
 * @param options - The command options.
 *
 * @returns The MCP server settings.
 */
function toSettings(options: McpOptions): IMcpServerUpdates {
	return {
		label: options.label,
		url: options.url,
		description: options.description,
		authType: options.authType,
		authorization: options.authorization,
		headers: parseHeaders(options.header),
		allowedTools: options.allowedTool,
		oauthScopes: options.scope,
		requireApproval: options.requireApproval,
		deferLoading: options.deferLoading,
		enabled: options.disabled ? false : options.enabled ? true : undefined,
		clearAuthorization: options.clearAuthorization,
		clearHeaders: options.clearHeaders,
	};
}

/**
 * Adds the options shared by 'create' and 'update' to the given command.
 *
 * @param command - The command.
 * @returns The command.
 */
function addSettingsOptions(command: Command): Command {
	return command
		.option('-d, --description <text>', 'The description of the server')
		.option('-a, --auth-type <type>', 'The authentication type')
		.option('--authorization <value>', 'The authorization (token) to send to the server')
		.option('-H, --header <name=value...>', 'A header to send to the server (repeatable)')
		.option('-t, --allowed-tool <name...>', 'A tool the agents are allowed to use (repeatable)')
		.option('-s, --scope <scope...>', 'An OAuth scope to request (repeatable)')
		.option('-r, --require-approval <policy>', 'The approval policy of tool calls')
		.option('--defer-loading', 'Defer the loading of the tools')
		.option('--disabled', 'Disable the server')
		.option('--enabled', 'Enable the server');
}

/**
 * Creates a new 'mcp' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'mcp' command.
 */
function createMcpCommand(fs: FranceStudent): Command {
	// Creating the 'mcp' command
	const mcp = createCommand('mcp').description('Access resources related to MCP servers');

	// List
	mcp.command('list')
		.description('List the MCP servers of the user')
		.action(async () => {
			try {
				output(await fs.mcp.list());
			} catch (error) {
				output(error);
			}
		});

	// Details
	mcp.command('details')
		.description('Fetch the details of an MCP server')
		.argument('<id>', 'The ID of the MCP server')
		.action(async (id: string) => {
			try {
				output(await fs.mcp.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Create
	addSettingsOptions(
		mcp
			.command('create')
			.description('Add an MCP server')
			.requiredOption('-l, --label <label>', 'The label of the server')
			.requiredOption('-u, --url <url>', 'The URL of the server'),
	).action(async (options: McpOptions) => {
		try {
			const settings = toSettings(options);

			output(await fs.mcp.create({ ...settings, label: options.label!, url: options.url! }));
		} catch (error) {
			output(error);
		}
	});

	// Update
	addSettingsOptions(
		mcp
			.command('update')
			.description('Update an MCP server')
			.argument('<id>', 'The ID of the MCP server')
			.option('-l, --label <label>', 'The new label of the server')
			.option('-u, --url <url>', 'The new URL of the server')
			.option('--clear-authorization', 'Remove the authorization')
			.option('--clear-headers', 'Remove the headers'),
	).action(async (id: string, options: McpOptions) => {
		try {
			output(await fs.mcp.update(id, toSettings(options)));
		} catch (error) {
			output(error);
		}
	});

	// Delete
	mcp.command('delete')
		.description('Delete an MCP server')
		.argument('<id>', 'The ID of the MCP server')
		.action(async (id: string) => {
			try {
				await fs.mcp.delete(id);
				output('OK');
			} catch (error) {
				output(error);
			}
		});

	// Discover
	mcp.command('discover')
		.description('Refresh the tools exposed by an MCP server')
		.argument('<id>', 'The ID of the MCP server')
		.action(async (id: string) => {
			try {
				output(await fs.mcp.discover(id));
			} catch (error) {
				output(error);
			}
		});

	// OAuth start
	mcp.command('oauth-start')
		.description('Start the OAuth authorization of an MCP server, and print the URL to open')
		.argument('<id>', 'The ID of the MCP server')
		.action(async (id: string) => {
			try {
				output(await fs.mcp.startOAuth(id));
			} catch (error) {
				output(error);
			}
		});

	// OAuth complete
	mcp.command('oauth-complete')
		.description('Complete the OAuth authorization of an MCP server')
		.argument('<code>', 'The code received on the OAuth callback')
		.argument('<state>', 'The state received on the OAuth callback')
		.action(async (code: string, state: string) => {
			try {
				output(await fs.mcp.completeOAuth({ code: code, state: state }));
			} catch (error) {
				output(error);
			}
		});

	return mcp;
}

export default createMcpCommand;
