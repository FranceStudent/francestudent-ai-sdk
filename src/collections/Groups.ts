import { ResourceType } from '../enums/Resource';

/**
 * The resources that can be accessed without authentication.
 *
 * @internal
 */
export const AllowGuestAuthenticationGroup = [ResourceType.PUBLIC_ALERTS, ResourceType.PUBLIC_HEALTH];

/**
 * The resources whose response is a stream of Server-Sent Events.
 *
 * @internal
 */
export const StreamResourcesGroup = [ResourceType.CHAT_CREATE, ResourceType.CHAT_SEND, ResourceType.CHAT_STREAM_ATTACH];

/**
 * The resources whose response is binary content.
 *
 * @internal
 */
export const BinaryResourcesGroup = [
	ResourceType.CHAT_ARCHIVE_DOWNLOAD,
	ResourceType.FILE_V2_CONTENT,
	ResourceType.MESSAGE_IMAGE,
	ResourceType.SKILL_CONTENT,
	ResourceType.SKILL_VERSION_CONTENT,
	ResourceType.TRANSCRIPT_AUDIO,
];

/**
 * The resources that only fetch data.
 *
 * @internal
 */
export const FetchResourcesGroup = [
	ResourceType.AGENT_LIST,
	ResourceType.CHAT_ARCHIVE_DOWNLOAD,
	ResourceType.CHAT_ARCHIVED,
	ResourceType.CHAT_DETAILS,
	ResourceType.CHAT_LIST,
	ResourceType.CHAT_SEARCH,
	ResourceType.CHAT_SHARES,
	ResourceType.CHAT_STREAM_ATTACH,
	ResourceType.CHAT_USAGE,
	ResourceType.FILE_DETAILS,
	ResourceType.FILE_LIST,
	ResourceType.FILE_V2_CONTENT,
	ResourceType.FILE_V2_DETAILS,
	ResourceType.FILE_V2_LIST,
	ResourceType.FILE_V2_MIME_TYPES,
	ResourceType.FILE_V2_USAGE,
	ResourceType.MCP_DETAILS,
	ResourceType.MCP_LIST,
	ResourceType.MEMORY_DETAILS,
	ResourceType.MEMORY_LIST,
	ResourceType.MESSAGE_IMAGE,
	ResourceType.MESSAGE_SAVED,
	ResourceType.MODEL_LIST,
	ResourceType.PROJECT_CHATS,
	ResourceType.PROJECT_DETAILS,
	ResourceType.PROJECT_LIST,
	ResourceType.PROJECT_SHARED,
	ResourceType.PROJECT_SHARES,
	ResourceType.PUBLIC_ALERTS,
	ResourceType.PUBLIC_HEALTH,
	ResourceType.SKILL_CONTENT,
	ResourceType.SKILL_DETAILS,
	ResourceType.SKILL_LIST,
	ResourceType.SKILL_VERSION_CONTENT,
	ResourceType.SKILL_VERSION_DETAILS,
	ResourceType.SKILL_VERSIONS,
	ResourceType.TRANSCRIPT_AUDIO,
	ResourceType.TRANSCRIPT_DETAILS,
	ResourceType.TRANSCRIPT_LIST,
	ResourceType.USER_CHAT_BUDGET,
	ResourceType.USER_DETAILS,
	ResourceType.USER_FLAGS,
	ResourceType.USER_INSTRUCTIONS,
	ResourceType.USER_NOTIFICATION_PREFERENCES,
	ResourceType.USER_PETS,
	ResourceType.USER_RATE_LIMIT_CREDITS,
	ResourceType.USER_SAFETY_HUB,
	ResourceType.USER_SESSIONS,
	ResourceType.USER_TOKEN_USAGE,
	ResourceType.USER_USAGE,
	ResourceType.USER_WEB_SEARCH_AUDIT,
	ResourceType.USER_WEB_SEARCH_DOMAINS,
];
