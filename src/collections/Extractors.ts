import { Agent } from '../models/data/Agent';
import { Attachment } from '../models/data/Attachment';
import { Chat, ChatUsage } from '../models/data/Chat';
import { CursoredData } from '../models/data/CursoredData';
import { McpOAuthStart, McpServer } from '../models/data/McpServer';
import { Memory } from '../models/data/Memory';
import { Message, SavedMessage } from '../models/data/Message';
import { Project } from '../models/data/Project';
import { Share } from '../models/data/Share';
import { Skill, SkillVersion } from '../models/data/Skill';
import { StoredFile } from '../models/data/StoredFile';
import { Transcript } from '../models/data/Transcript';
import { User, UserSession } from '../models/data/User';
import { IAgent as IRawAgent } from '../types/raw/base/Agent';
import { IChatDetail, IChatDocument, IChatSummary, IChatUsage, IConversationImport } from '../types/raw/base/Chat';
import { IFileDeleted, IFileObject, IFilesUsage, IAttachment as IRawAttachment } from '../types/raw/base/File';
import { IMcpOAuthStart, IMcpServer, IMcpServerList } from '../types/raw/base/Mcp';
import { IUserMemoryContent } from '../types/raw/base/Memory';
import { IChatMessage, ISavedMessage } from '../types/raw/base/Message';
import { IProject as IRawProject } from '../types/raw/base/Project';
import { IPublicAlerts, IPublicHealth } from '../types/raw/base/Public';
import { ISafetyAppealResponse, ISafetyHub } from '../types/raw/base/Safety';
import { IUserSession as IRawUserSession } from '../types/raw/base/Session';
import {
	INotificationPreferences as IRawNotificationPreferences,
	IUserFlag,
	IUserPersonalization,
	IUserReferralInvite,
} from '../types/raw/base/Settings';
import { IShareAccess } from '../types/raw/base/Share';
import { ISkill, ISkillVersion } from '../types/raw/base/Skill';
import { ITranscriptCreate, ITranscriptDetail, ITranscriptSummary } from '../types/raw/base/Transcript';
import {
	IBudgetUsage,
	IRateLimitCredits,
	IRateLimitPowerUp,
	IUserTokenUsage,
	IUserUsage,
} from '../types/raw/base/Usage';
import { IUser as IRawUser } from '../types/raw/base/User';
import { IUserWebSearchDomains } from '../types/raw/base/WebSearch';
import { IChatHistory } from '../types/raw/composite/ChatHistory';
import { IFileList } from '../types/raw/composite/FileList';
import { IList } from '../types/raw/composite/List';
import { ISavedMessagesPage } from '../types/raw/composite/SavedMessagesPage';
import { IUserMemories } from '../types/raw/composite/UserMemories';
import { IWebSearchAuditPage } from '../types/raw/composite/WebSearchAuditPage';

/**
 * Collection of data extractors for each resource.
 *
 * @internal
 */
export const Extractors = {
	/* eslint-disable @typescript-eslint/naming-convention */

	AGENT_LIST: (response: IRawAgent[]): Agent[] => Agent.list(response),
	MODEL_LIST: (response: unknown): unknown => response,

	CHAT_ARCHIVE: (): void => undefined,
	CHAT_ARCHIVE_DOWNLOAD: (response: ArrayBuffer): Buffer => Buffer.from(response),
	CHAT_ARCHIVED: (response: IChatHistory): CursoredData<Chat> => Chat.history(response),
	CHAT_DELETE: (): void => undefined,
	CHAT_DELETE_ALL: (): void => undefined,
	CHAT_DETAILS: (response: IChatDetail): Chat | undefined => (response?.id ? new Chat(response) : undefined),
	CHAT_IMPORT_OPENAI: (response: IConversationImport): IConversationImport => response,
	CHAT_LIST: (response: IChatHistory): CursoredData<Chat> => Chat.history(response),
	CHAT_PIN: (): void => undefined,
	CHAT_RESTORE: (): void => undefined,
	CHAT_SEARCH: (response: IChatHistory): CursoredData<Chat> => Chat.history(response),
	CHAT_SHARE_ADD: (response: IShareAccess): Share => new Share(response),
	CHAT_SHARE_REMOVE: (): void => undefined,
	CHAT_SHARE_UPDATE: (response: IShareAccess): Share => new Share(response),
	CHAT_SHARES: (response: IShareAccess[]): Share[] => Share.list(response),
	CHAT_STREAM_CANCEL: (): void => undefined,
	CHAT_UNPIN: (): void => undefined,
	CHAT_UPDATE: (response: IChatDocument): Chat => new Chat(response),
	CHAT_USAGE: (response: IChatUsage): ChatUsage => new ChatUsage(response),

	MESSAGE_EDIT: (response: IChatDetail): Chat | undefined => (response?.id ? new Chat(response) : undefined),
	MESSAGE_IMAGE: (response: ArrayBuffer): Buffer => Buffer.from(response),
	MESSAGE_SAVE: (response: ISavedMessage): SavedMessage => new SavedMessage(response),
	MESSAGE_SAVED: (response: ISavedMessagesPage): CursoredData<SavedMessage> =>
		new CursoredData(
			(response?.savedMessages ?? []).map((item) => new SavedMessage(item)),
			response?.hasMore ? response.nextCursor : '',
		),
	MESSAGE_UNSAVE: (): void => undefined,
	MESSAGE_VOTE: (response: IChatMessage): Message => new Message(response),

	PROJECT_CHAT_LINK: (response: IChatSummary): Chat => new Chat(response),
	PROJECT_CHAT_UNLINK: (): void => undefined,
	PROJECT_CHATS: (response: IChatHistory): CursoredData<Chat> => Chat.history(response),
	PROJECT_CREATE: (response: IRawProject): Project => new Project(response),
	PROJECT_DELETE: (): void => undefined,
	PROJECT_DETAILS: (response: IRawProject): Project | undefined => (response?.id ? new Project(response) : undefined),
	PROJECT_LIST: (response: IRawProject[]): Project[] => Project.list(response),
	PROJECT_SHARE_ADD: (response: IShareAccess): Share => new Share(response),
	PROJECT_SHARE_REMOVE: (): void => undefined,
	PROJECT_SHARED: (response: IRawProject[]): Project[] => Project.list(response),
	PROJECT_SHARES: (response: IShareAccess[]): Share[] => Share.list(response),
	PROJECT_UPDATE: (response: IRawProject): Project => new Project(response),

	PUBLIC_ALERTS: (response: IPublicAlerts): IPublicAlerts => response,
	PUBLIC_HEALTH: (response: IPublicHealth): IPublicHealth => response,

	FILE_DELETE: (): void => undefined,
	FILE_DETAILS: (response: IRawAttachment): Attachment | undefined =>
		response && (response.uuid || response.id) ? new Attachment(response) : undefined,
	FILE_LIST: (response: IRawAttachment[]): Attachment[] => Attachment.list(response),
	FILE_UPLOAD: (response: IRawAttachment): Attachment => new Attachment(response),
	FILE_V2_CONTENT: (response: ArrayBuffer): Buffer => Buffer.from(response),
	FILE_V2_DELETE: (response: IFileDeleted): boolean => response?.deleted !== false,
	FILE_V2_DETAILS: (response: IFileObject): StoredFile | undefined =>
		response?.id ? new StoredFile(response) : undefined,
	FILE_V2_LIST: (response: IFileList): CursoredData<StoredFile> => StoredFile.list(response),
	FILE_V2_MIME_TYPES: (response: unknown[]): unknown[] => (Array.isArray(response) ? response : []),
	FILE_V2_UPLOAD: (response: IFileObject): StoredFile => new StoredFile(response),
	FILE_V2_USAGE: (response: IFilesUsage): IFilesUsage => response,

	TRANSCRIPT_AUDIO: (response: ArrayBuffer): Buffer => Buffer.from(response),
	TRANSCRIPT_DETAILS: (response: ITranscriptDetail): Transcript | undefined =>
		response?.uuid ? new Transcript(response) : undefined,
	TRANSCRIPT_LIST: (response: ITranscriptSummary[]): Transcript[] => Transcript.list(response),
	TRANSCRIPT_UPLOAD: (response: ITranscriptCreate): Transcript => new Transcript(response),

	MEMORY_DELETE: (): void => undefined,
	MEMORY_DELETE_ALL: (): void => undefined,
	MEMORY_DETAILS: (response: IUserMemoryContent): Memory | undefined =>
		response?.id !== undefined ? new Memory(response) : undefined,
	MEMORY_LIST: (response: IUserMemories): Memory[] => Memory.list(response),

	USER_CHAT_BUDGET: (response: IBudgetUsage): IBudgetUsage => response,
	USER_DELETE: (): void => undefined,
	USER_DETAILS: (response: IRawUser): User | undefined =>
		response?.id !== undefined ? new User(response) : undefined,
	USER_FLAGS: (response: IUserFlag[]): IUserFlag[] => (Array.isArray(response) ? response : []),
	USER_INSTRUCTIONS: (response: IUserPersonalization): IUserPersonalization => response,
	USER_INSTRUCTIONS_UPDATE: (response: IUserPersonalization): IUserPersonalization => response,
	USER_INVITE: (response: IUserReferralInvite): IUserReferralInvite => response,
	USER_NOTIFICATION_PREFERENCES: (response: IRawNotificationPreferences): IRawNotificationPreferences => response,
	USER_NOTIFICATION_PREFERENCES_UPDATE: (response: IRawNotificationPreferences): IRawNotificationPreferences =>
		response,
	USER_PETS: (response: unknown[]): unknown[] => (Array.isArray(response) ? response : []),
	USER_PROFILE_UPDATE: (response: IRawUser): User | undefined =>
		response?.id !== undefined ? new User(response) : undefined,
	USER_RATE_LIMIT_CREDITS: (response: IRateLimitCredits): IRateLimitCredits => response,
	USER_RATE_LIMIT_POWER_UP: (response: IRateLimitPowerUp): IRateLimitPowerUp => response,
	USER_REGISTER_BETA: (response: IRawUser): User | undefined =>
		response?.id !== undefined ? new User(response) : undefined,
	USER_SAFETY_APPEAL: (response: ISafetyAppealResponse): ISafetyAppealResponse => response,
	USER_SAFETY_HUB: (response: ISafetyHub): ISafetyHub => response,
	USER_SESSION_TERMINATE: (): void => undefined,
	USER_SESSIONS: (response: IRawUserSession[]): UserSession[] => UserSession.list(response),
	USER_SESSIONS_TERMINATE_ALL: (): void => undefined,
	USER_TOKEN_USAGE: (response: IUserTokenUsage): IUserTokenUsage => response,
	USER_UPDATE: (response: IRawUser): User | undefined =>
		response?.id !== undefined ? new User(response) : undefined,
	USER_USAGE: (response: IUserUsage): IUserUsage => response,
	USER_WEB_SEARCH_AUDIT: (response: IWebSearchAuditPage): IWebSearchAuditPage => response,
	USER_WEB_SEARCH_DOMAINS: (response: IUserWebSearchDomains): IUserWebSearchDomains => response,
	USER_WEB_SEARCH_DOMAINS_UPDATE: (response: IUserWebSearchDomains): IUserWebSearchDomains => response,

	MCP_CREATE: (response: IMcpServer): McpServer => new McpServer(response),
	MCP_DELETE: (): void => undefined,
	MCP_DETAILS: (response: IMcpServer): McpServer | undefined => (response?.id ? new McpServer(response) : undefined),
	MCP_DISCOVER: (response: IMcpServer): McpServer => new McpServer(response),
	MCP_LIST: (response: IMcpServerList): McpServer[] => McpServer.list(response),
	MCP_OAUTH_COMPLETE: (response: IMcpServer): McpServer => new McpServer(response),
	MCP_OAUTH_START: (response: IMcpOAuthStart): McpOAuthStart => new McpOAuthStart(response),
	MCP_UPDATE: (response: IMcpServer): McpServer => new McpServer(response),

	SKILL_CONTENT: (response: ArrayBuffer): Buffer => Buffer.from(response),
	SKILL_CREATE: (response: ISkill): Skill => new Skill(response),
	SKILL_DELETE: (): void => undefined,
	SKILL_DETAILS: (response: ISkill): Skill | undefined => (response?.id ? new Skill(response) : undefined),
	SKILL_LIST: (response: IList<ISkill>): CursoredData<Skill> => Skill.list(response),
	SKILL_UPDATE: (response: ISkill): Skill | undefined => (response?.id ? new Skill(response) : undefined),
	SKILL_VERSION_CONTENT: (response: ArrayBuffer): Buffer => Buffer.from(response),
	SKILL_VERSION_CREATE: (response: ISkillVersion): SkillVersion => new SkillVersion(response),
	SKILL_VERSION_DELETE: (): void => undefined,
	SKILL_VERSION_DETAILS: (response: ISkillVersion): SkillVersion | undefined =>
		response?.version !== undefined ? new SkillVersion(response) : undefined,
	SKILL_VERSIONS: (response: IList<ISkillVersion>): CursoredData<SkillVersion> => SkillVersion.list(response),

	/* eslint-enable @typescript-eslint/naming-convention */
};
