import { AxiosRequestConfig } from 'axios';

import { IMcpServerUpdates, INewMcpServer, IOAuthCallback } from '../types/args/PostArgs';

/**
 * Converts MCP server settings into the snake_case format of the API.
 *
 * @param server - The MCP server settings.
 *
 * @returns The request body, without undefined fields.
 */
function toBody(server: IMcpServerUpdates): Record<string, unknown> {
	/* eslint-disable @typescript-eslint/naming-convention */
	const body: Record<string, unknown> = {
		server_label: server.label,
		server_description: server.description,
		server_url: server.url,
		auth_type: server.authType,
		oauth_scopes: server.oauthScopes,
		allowed_tools: server.allowedTools,
		require_approval: server.requireApproval,
		defer_loading: server.deferLoading,
		enabled: server.enabled,
		authorization: server.authorization,
		headers: server.headers,
		clear_authorization: server.clearAuthorization,
		clear_headers: server.clearHeaders,
	};
	/* eslint-enable @typescript-eslint/naming-convention */

	return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

/**
 * Collection of requests related to MCP servers.
 *
 * @public
 */
export class McpRequests {
	/**
	 * @param server - The MCP server to create.
	 */
	public static create(server: INewMcpServer): AxiosRequestConfig {
		return { method: 'post', url: '/mcp/servers', data: toBody(server) };
	}

	/**
	 * @param id - The ID of the MCP server to delete.
	 */
	public static delete(id: string): AxiosRequestConfig {
		return { method: 'delete', url: `/mcp/servers/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the target MCP server.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/mcp/servers/${encodeURIComponent(id)}` };
	}

	/**
	 * @param id - The ID of the MCP server whose tools are to be refreshed.
	 */
	public static discover(id: string): AxiosRequestConfig {
		return { method: 'post', url: `/mcp/servers/${encodeURIComponent(id)}/discover` };
	}

	/**
	 * Lists the MCP servers of the user.
	 */
	public static list(): AxiosRequestConfig {
		return { method: 'get', url: '/mcp/servers' };
	}

	/**
	 * @param oauth - The parameters received on the OAuth callback.
	 */
	public static oauthComplete(oauth: IOAuthCallback): AxiosRequestConfig {
		return {
			method: 'post',
			url: '/mcp/servers/oauth/complete',
			data: { code: oauth.code, state: oauth.state },
		};
	}

	/**
	 * @param id - The ID of the MCP server to authorize.
	 */
	public static oauthStart(id: string): AxiosRequestConfig {
		return { method: 'post', url: `/mcp/servers/${encodeURIComponent(id)}/oauth/start` };
	}

	/**
	 * @param id - The ID of the MCP server to update.
	 * @param updates - The updates to apply.
	 */
	public static update(id: string, updates: IMcpServerUpdates): AxiosRequestConfig {
		return { method: 'post', url: `/mcp/servers/${encodeURIComponent(id)}`, data: toBody(updates) };
	}
}
