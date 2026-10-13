import { AxiosProxyConfig } from 'axios';

import { FranceStudentConfig } from './models/FranceStudentConfig';
import { LoginService } from './services/internal/LoginService';
import { AttachmentService } from './services/public/AttachmentService';
import { ChatService } from './services/public/ChatService';
import { FileService } from './services/public/FileService';
import { McpService } from './services/public/McpService';
import { MemoryService } from './services/public/MemoryService';
import { MessageService } from './services/public/MessageService';
import { ProjectService } from './services/public/ProjectService';
import { PublicService } from './services/public/PublicService';
import { SkillService } from './services/public/SkillService';
import { TranscriptService } from './services/public/TranscriptService';
import { UserService } from './services/public/UserService';
import { IFranceStudentConfig } from './types/FranceStudentConfig';

/**
 * The class for accessing the FranceStudent AI API.
 *
 * The created FranceStudent instance can be configured by passing in a configuration object to the constructor.
 *
 * For details regarding the available configuration options, refer to {@link IFranceStudentConfig}
 *
 * @example Creating a FranceStudent instance using a session token:
 * ```
 * import { FranceStudent } from 'francestudent-ai-sdk';
 *
 * // The value of the 'next-auth.session-token' cookie of ia.francestudent.org
 * const fs = new FranceStudent({ sessionToken: 'SESSION_TOKEN' });
 * ```
 *
 * @example Logging in with an email address and a password:
 * ```
 * import { FranceStudent } from 'francestudent-ai-sdk';
 *
 * const fs = new FranceStudent();
 *
 * // Logging in, the session token can then be saved for later use
 * const sessionToken = await fs.login('EMAIL', 'PASSWORD');
 * ```
 *
 * @example Creating a FranceStudent instance with debug logs, a proxy and persisting renewed session tokens:
 * ```
 * import { FranceStudent } from 'francestudent-ai-sdk';
 *
 * const fs = new FranceStudent({
 * 	sessionToken: 'SESSION_TOKEN',
 * 	logging: true,
 * 	proxy: 'URL_TO_PROXY_SERVER',
 * 	onSessionUpdate: (token) => saveSomewhere(token),
 * });
 * ```
 *
 * @public
 */
export class FranceStudent {
	/** The configuration for FranceStudent. */
	private _config: FranceStudentConfig;

	/** The instance used to interact with attachments (files v1, used as chat images). */
	public attachment: AttachmentService;

	/** The instance used to interact with agents and chats. */
	public chat: ChatService;

	/** The instance used to interact with stored files (files v2, used as chat files). */
	public file: FileService;

	/** The instance used to interact with MCP servers. */
	public mcp: McpService;

	/** The instance used to interact with the memories of the user. */
	public memory: MemoryService;

	/** The instance used to interact with messages (edit, vote, save, generated images). */
	public message: MessageService;

	/** The instance used to interact with projects. */
	public project: ProjectService;

	/** The instance used to access public resources (health, alerts). */
	public public: PublicService;

	/** The instance used to interact with skills. */
	public skill: SkillService;

	/** The instance used to interact with audio transcriptions. */
	public transcript: TranscriptService;

	/** The instance used to interact with the authenticated user. */
	public user: UserService;

	/**
	 * Initializes a new FranceStudent instance using the given configuration.
	 *
	 * @param config - The config object for configuring the FranceStudent instance.
	 */
	public constructor(config?: IFranceStudentConfig) {
		this._config = new FranceStudentConfig(config);
		this.attachment = new AttachmentService(this._config);
		this.chat = new ChatService(this._config);
		this.file = new FileService(this._config);
		this.mcp = new McpService(this._config);
		this.memory = new MemoryService(this._config);
		this.message = new MessageService(this._config);
		this.project = new ProjectService(this._config);
		this.public = new PublicService(this._config);
		this.skill = new SkillService(this._config);
		this.transcript = new TranscriptService(this._config);
		this.user = new UserService(this._config);
	}

	/** Get the access token (JWT) set for the current instance, if any. */
	public get accessToken(): string | undefined {
		return this._config.accessToken;
	}

	/** Get the device ID used by the current instance. */
	public get deviceId(): string {
		return this._config.deviceId;
	}

	/** Get the session token of the current instance, if any. It may have been renewed by the server. */
	public get sessionToken(): string | undefined {
		return this._config.sessionToken;
	}

	/** Set an access token (JWT) for the current instance. */
	public set accessToken(accessToken: string | undefined) {
		this._config.accessToken = accessToken;
	}

	/** Set the custom headers for the current instance. */
	public set headers(headers: { [key: string]: string }) {
		this._config.headers = headers;
	}

	/** Set the proxy for the current instance. */
	public set proxy(proxy: AxiosProxyConfig | string | undefined | null) {
		this._config.proxy = proxy;
	}

	/** Set the session token for the current instance. */
	public set sessionToken(sessionToken: string | undefined) {
		this._config.sessionToken = sessionToken;
	}

	/**
	 * Log in with an email address and a password, and use the obtained session for the current instance.
	 *
	 * @param email - The email address of the account.
	 * @param password - The password of the account. It is neither logged nor stored.
	 *
	 * @returns The session token, which can be saved and reused with the `sessionToken` option.
	 *
	 * @remarks Accounts protected by a captcha or two-factor authentication must use a session token instead.
	 */
	public async login(email: string, password: string): Promise<string> {
		const sessionToken = await new LoginService(this._config).login(email, password);

		this._config.sessionToken = sessionToken;

		return sessionToken;
	}

	/**
	 * Get a valid access token (JWT), renewing it if needed.
	 *
	 * @param force - Whether to renew the token even if it is still valid.
	 *
	 * @returns The access token, and its expiration date in UTC string format.
	 */
	public async token(force = false): Promise<{ accessToken: string; expiresAt?: string }> {
		const accessToken = await this._config.auth.getAccessToken(force);
		const expiresAt = this._config.auth.expiresAt;

		return {
			accessToken: accessToken,
			expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? new Date(expiresAt).toISOString() : undefined,
		};
	}
}
