/* eslint-disable */

/**
 * Represents the raw data of a tool exposed by an MCP server.
 *
 * @public
 */
export interface IMcpTool {
	name: string;
	title?: string;
	description?: string;
	annotations?: Record<string, unknown>;
	input_schema?: Record<string, unknown>;
}

/**
 * Represents the raw data of a single MCP server.
 *
 * @public
 */
export interface IMcpServer {
	id: string;
	object?: string;
	server_label: string;
	server_description?: string;
	server_url: string;
	auth_type?: string;
	oauth_status?: string;
	oauth_scopes?: string[];
	allowed_tools?: string[];
	available_tools?: IMcpTool[];
	require_approval?: string;
	defer_loading?: boolean;
	enabled?: boolean;
	has_authorization?: boolean;
	credential_header_names?: string[];
	created_at?: string;
	updated_at?: string;
}

/**
 * Represents the raw list of MCP servers.
 *
 * @public
 */
export interface IMcpServerList {
	object?: string;
	data: IMcpServer[];
}

/**
 * Represents the raw start of an MCP server OAuth authorization.
 *
 * @public
 */
export interface IMcpOAuthStart {
	authorization_url: string;
	state: string;
}
