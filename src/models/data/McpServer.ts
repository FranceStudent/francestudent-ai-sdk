import { IMcpOAuthStart, IMcpServer, IMcpTool } from '../../types/data/McpServer';
import {
	IMcpOAuthStart as IRawMcpOAuthStart,
	IMcpServer as IRawMcpServer,
	IMcpServerList as IRawMcpServerList,
} from '../../types/raw/base/Mcp';

/**
 * The details of a single MCP server.
 *
 * @public
 */
export class McpServer implements IMcpServer {
	/** The raw MCP server details. */
	private readonly _raw: IRawMcpServer;

	public allowedTools: string[];
	public authType?: string;
	public availableTools: IMcpTool[];
	public createdAt?: string;
	public credentialHeaderNames: string[];
	public deferLoading: boolean;
	public description?: string;
	public enabled: boolean;
	public hasAuthorization: boolean;
	public id: string;
	public label: string;
	public oauthScopes: string[];
	public oauthStatus?: string;
	public requireApproval?: string;
	public updatedAt?: string;
	public url: string;

	/**
	 * @param server - The raw MCP server details.
	 */
	public constructor(server: IRawMcpServer) {
		this._raw = { ...server };
		this.id = server.id;
		this.label = server.server_label;
		this.description = server.server_description || undefined;
		this.url = server.server_url;
		this.authType = server.auth_type ?? undefined;
		this.oauthStatus = server.oauth_status ?? undefined;
		this.oauthScopes = server.oauth_scopes ?? [];
		this.allowedTools = server.allowed_tools ?? [];
		this.availableTools = (server.available_tools ?? []).map((tool) => ({
			annotations: tool.annotations ?? undefined,
			description: tool.description ?? undefined,
			inputSchema: tool.input_schema ?? undefined,
			name: tool.name,
			title: tool.title ?? undefined,
		}));
		this.requireApproval = server.require_approval ?? undefined;
		this.deferLoading = server.defer_loading ?? false;
		this.enabled = server.enabled ?? true;
		this.hasAuthorization = server.has_authorization ?? false;
		this.credentialHeaderNames = server.credential_header_names ?? [];
		this.createdAt = server.created_at ? new Date(server.created_at).toISOString() : undefined;
		this.updatedAt = server.updated_at ? new Date(server.updated_at).toISOString() : undefined;
	}

	/** The raw MCP server details. */
	public get raw(): IRawMcpServer {
		return { ...this._raw };
	}

	/**
	 * Deserializes a list of raw MCP servers.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized MCP servers.
	 */
	public static list(response: IRawMcpServerList): McpServer[] {
		return (response?.data ?? []).filter((item) => item?.id !== undefined).map((item) => new McpServer(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IMcpServer {
		return {
			allowedTools: this.allowedTools,
			authType: this.authType,
			availableTools: this.availableTools,
			createdAt: this.createdAt,
			credentialHeaderNames: this.credentialHeaderNames,
			deferLoading: this.deferLoading,
			description: this.description,
			enabled: this.enabled,
			hasAuthorization: this.hasAuthorization,
			id: this.id,
			label: this.label,
			oauthScopes: this.oauthScopes,
			oauthStatus: this.oauthStatus,
			requireApproval: this.requireApproval,
			updatedAt: this.updatedAt,
			url: this.url,
		};
	}
}

/**
 * The start of the OAuth authorization of an MCP server.
 *
 * @public
 */
export class McpOAuthStart implements IMcpOAuthStart {
	public authorizationUrl: string;
	public state: string;

	/**
	 * @param start - The raw OAuth start.
	 */
	public constructor(start: IRawMcpOAuthStart) {
		this.authorizationUrl = start.authorization_url;
		this.state = start.state;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IMcpOAuthStart {
		return { authorizationUrl: this.authorizationUrl, state: this.state };
	}
}
