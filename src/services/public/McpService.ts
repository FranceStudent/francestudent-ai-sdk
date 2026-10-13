import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { McpOAuthStart, McpServer } from '../../models/data/McpServer';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IMcpServerUpdates, INewMcpServer, IOAuthCallback } from '../../types/args/PostArgs';
import {
	IMcpOAuthStart as IRawMcpOAuthStart,
	IMcpServer as IRawMcpServer,
	IMcpServerList as IRawMcpServerList,
} from '../../types/raw/base/Mcp';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to MCP servers.
 *
 * @public
 */
export class McpService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Complete the OAuth authorization of an MCP server.
	 *
	 * @param oauth - The `code` and `state` received on the OAuth callback.
	 *
	 * @returns The authorized MCP server.
	 */
	public async completeOAuth(oauth: IOAuthCallback): Promise<McpServer> {
		const resource = ResourceType.MCP_OAUTH_COMPLETE;

		// Completing the authorization
		const response = await this.request<IRawMcpServer>(resource, { oauth: oauth });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Add an MCP server.
	 *
	 * @param server - The MCP server to add.
	 *
	 * @returns The added MCP server.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Adding an MCP server
	 * fs.mcp.create({ label: 'docs', url: 'https://example.com/mcp' })
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async create(server: INewMcpServer): Promise<McpServer> {
		const resource = ResourceType.MCP_CREATE;

		// Adding the MCP server
		const response = await this.request<IRawMcpServer>(resource, { mcpServer: server });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Delete an MCP server.
	 *
	 * @param id - The ID of the MCP server to delete.
	 */
	public async delete(id: string): Promise<void> {
		const resource = ResourceType.MCP_DELETE;

		// Deleting the MCP server
		await this.request(resource, { id: id });
	}

	/**
	 * Get the details of an MCP server.
	 *
	 * @param id - The ID of the MCP server.
	 *
	 * @returns The details of the MCP server.
	 */
	public async details(id: string): Promise<McpServer | undefined> {
		const resource = ResourceType.MCP_DETAILS;

		// Fetching raw MCP server details
		const response = await this.request<IRawMcpServer>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Refresh the tools exposed by an MCP server.
	 *
	 * @param id - The ID of the MCP server.
	 *
	 * @returns The MCP server, with its up-to-date tools.
	 */
	public async discover(id: string): Promise<McpServer> {
		const resource = ResourceType.MCP_DISCOVER;

		// Refreshing the tools
		const response = await this.request<IRawMcpServer>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of MCP servers of the user.
	 *
	 * @returns The list of MCP servers.
	 */
	public async list(): Promise<McpServer[]> {
		const resource = ResourceType.MCP_LIST;

		// Fetching raw list of MCP servers
		const response = await this.request<IRawMcpServerList>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Start the OAuth authorization of an MCP server.
	 *
	 * @param id - The ID of the MCP server.
	 *
	 * @returns The URL to open to authorize, and the OAuth state.
	 */
	public async startOAuth(id: string): Promise<McpOAuthStart> {
		const resource = ResourceType.MCP_OAUTH_START;

		// Starting the authorization
		const response = await this.request<IRawMcpOAuthStart>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Update an MCP server.
	 *
	 * @param id - The ID of the MCP server.
	 * @param updates - The updates to apply.
	 *
	 * @returns The updated MCP server.
	 */
	public async update(id: string, updates: IMcpServerUpdates): Promise<McpServer> {
		const resource = ResourceType.MCP_UPDATE;

		// Updating the MCP server
		const response = await this.request<IRawMcpServer>(resource, { id: id, mcpServerUpdates: updates });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
