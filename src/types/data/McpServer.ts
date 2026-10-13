/**
 * A tool exposed by an MCP server.
 *
 * @public
 */
export interface IMcpTool {
	/** The annotations of the tool. */
	annotations?: Record<string, unknown>;

	/** The description of the tool. */
	description?: string;

	/** The JSON schema of the input of the tool. */
	inputSchema?: Record<string, unknown>;

	/** The name of the tool. */
	name: string;

	/** The display title of the tool. */
	title?: string;
}

/**
 * The details of a single MCP server.
 *
 * @public
 */
export interface IMcpServer {
	/** The names of the tools the agents are allowed to use. */
	allowedTools: string[];

	/** The authentication type. */
	authType?: string;

	/** The tools exposed by the server. */
	availableTools: IMcpTool[];

	/** The date and time of creation, in UTC string format. */
	createdAt?: string;

	/** The names of the headers holding credentials. */
	credentialHeaderNames: string[];

	/** Whether tool loading is deferred. */
	deferLoading: boolean;

	/** The description of the server. */
	description?: string;

	/** Whether the server is enabled. */
	enabled: boolean;

	/** Whether an authorization is set. */
	hasAuthorization: boolean;

	/** The ID of the server. */
	id: string;

	/** The label of the server. */
	label: string;

	/** The OAuth scopes requested. */
	oauthScopes: string[];

	/** The status of the OAuth authorization. */
	oauthStatus?: string;

	/** The approval policy of tool calls. */
	requireApproval?: string;

	/** The date and time of the last update, in UTC string format. */
	updatedAt?: string;

	/** The URL of the server. */
	url: string;
}

/**
 * The start of the OAuth authorization of an MCP server.
 *
 * @public
 */
export interface IMcpOAuthStart {
	/** The URL to open to authorize. */
	authorizationUrl: string;

	/** The OAuth state, to pass back when completing. */
	state: string;
}
