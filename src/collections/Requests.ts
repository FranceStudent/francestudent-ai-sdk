import { AxiosRequestConfig } from 'axios';

import { ResourceType } from '../enums/Resource';
import { AttachmentRequests } from '../requests/Attachment';
import { ChatRequests } from '../requests/Chat';
import { FileRequests } from '../requests/File';
import { McpRequests } from '../requests/Mcp';
import { MemoryRequests } from '../requests/Memory';
import { MessageRequests } from '../requests/Message';
import { ProjectRequests } from '../requests/Project';
import { PublicRequests } from '../requests/Public';
import { SkillRequests } from '../requests/Skill';
import { TranscriptRequests } from '../requests/Transcript';
import { UserRequests } from '../requests/User';
import { IFetchArgs } from '../types/args/FetchArgs';
import { IPostArgs } from '../types/args/PostArgs';

/**
 * Collection of requests to various resources.
 *
 * @internal
 */
export const Requests: { [key in keyof typeof ResourceType]: (args: IFetchArgs | IPostArgs) => AxiosRequestConfig } = {
	/* eslint-disable @typescript-eslint/naming-convention */

	AGENT_LIST: (args: IFetchArgs) => ChatRequests.agents(args.includeDisabled),
	MODEL_LIST: () => ChatRequests.models(),

	CHAT_ARCHIVE: (args: IPostArgs) => ChatRequests.archive(args.id!),
	CHAT_ARCHIVE_DOWNLOAD: (args: IFetchArgs) => ChatRequests.download(args.id!),
	CHAT_ARCHIVED: (args: IFetchArgs) => ChatRequests.archived(args.count, args.cursor),
	CHAT_CREATE: (args: IPostArgs) => ChatRequests.create(args.chat!),
	CHAT_DELETE: (args: IPostArgs) => ChatRequests.delete(args.id!),
	CHAT_DELETE_ALL: () => ChatRequests.deleteAll(),
	CHAT_DETAILS: (args: IFetchArgs) => ChatRequests.details(args.id!),
	CHAT_IMPORT_OPENAI: (args: IPostArgs) => ChatRequests.importOpenAi(args.conversationImport!),
	CHAT_LIST: (args: IFetchArgs) => ChatRequests.list(args.count, args.cursor, args.sortBy),
	CHAT_PIN: (args: IPostArgs) => ChatRequests.pin(args.id!),
	CHAT_RESTORE: (args: IPostArgs) => ChatRequests.restore(args.id!),
	CHAT_SEARCH: (args: IFetchArgs) => ChatRequests.search(args.query!, args.count),
	CHAT_SEND: (args: IPostArgs) => ChatRequests.send(args.id!, args.message!),
	CHAT_SHARE_ADD: (args: IPostArgs) => ChatRequests.shareAdd(args.id!, args.share!),
	CHAT_SHARE_REMOVE: (args: IPostArgs) => ChatRequests.shareRemove(args.id!, args.share!),
	CHAT_SHARE_UPDATE: (args: IPostArgs) => ChatRequests.shareUpdate(args.id!, args.share!),
	CHAT_SHARES: (args: IFetchArgs) => ChatRequests.shares(args.id!),
	CHAT_STREAM_ATTACH: (args: IFetchArgs) => ChatRequests.attach(args.id!, args.lastEventId),
	CHAT_STREAM_CANCEL: (args: IPostArgs) => ChatRequests.cancel(args.id!),
	CHAT_UNPIN: (args: IPostArgs) => ChatRequests.unpin(args.id!),
	CHAT_UPDATE: (args: IPostArgs) => ChatRequests.update(args.id!, args.chatUpdates!),
	CHAT_USAGE: (args: IFetchArgs) => ChatRequests.usage(args.id!),

	MESSAGE_EDIT: (args: IPostArgs) => MessageRequests.edit(args.chatId!, args.messageId!, args.content!),
	MESSAGE_IMAGE: (args: IFetchArgs) => MessageRequests.image(args.chatId!, args.messageId!, args.imageId!),
	MESSAGE_SAVE: (args: IPostArgs) => MessageRequests.save(args.chatId!, args.messageId!),
	MESSAGE_SAVED: (args: IFetchArgs) => MessageRequests.saved(args.count, args.cursor),
	MESSAGE_UNSAVE: (args: IPostArgs) => MessageRequests.unsave(args.chatId!, args.messageId!),
	MESSAGE_VOTE: (args: IPostArgs) => MessageRequests.vote(args.messageId!, args.isUpvoted!),

	PROJECT_CHAT_LINK: (args: IPostArgs) => ProjectRequests.linkChat(args.id!, args.chatId!),
	PROJECT_CHAT_UNLINK: (args: IPostArgs) => ProjectRequests.unlinkChat(args.id!, args.chatId!),
	PROJECT_CHATS: (args: IFetchArgs) => ProjectRequests.chats(args.id!, args.count, args.cursor),
	PROJECT_CREATE: (args: IPostArgs) => ProjectRequests.create(args.name!),
	PROJECT_DELETE: (args: IPostArgs) => ProjectRequests.delete(args.id!),
	PROJECT_DETAILS: (args: IFetchArgs) => ProjectRequests.details(args.id!),
	PROJECT_LIST: () => ProjectRequests.list(),
	PROJECT_SHARE_ADD: (args: IPostArgs) => ProjectRequests.shareAdd(args.id!, args.share!),
	PROJECT_SHARE_REMOVE: (args: IPostArgs) => ProjectRequests.shareRemove(args.id!, args.userId!),
	PROJECT_SHARED: () => ProjectRequests.shared(),
	PROJECT_SHARES: (args: IFetchArgs) => ProjectRequests.shares(args.id!),
	PROJECT_UPDATE: (args: IPostArgs) => ProjectRequests.update(args.id!, args.projectUpdates!),

	PUBLIC_ALERTS: () => PublicRequests.alerts(),
	PUBLIC_HEALTH: () => PublicRequests.health(),

	FILE_DELETE: (args: IPostArgs) => AttachmentRequests.delete(args.id!),
	FILE_DETAILS: (args: IFetchArgs) => AttachmentRequests.details(args.id!),
	FILE_LIST: () => AttachmentRequests.list(),
	FILE_UPLOAD: (args: IPostArgs) => AttachmentRequests.upload(args.upload!),
	FILE_V2_CONTENT: (args: IFetchArgs) => FileRequests.content(args.id!),
	FILE_V2_DELETE: (args: IPostArgs) => FileRequests.delete(args.id!),
	FILE_V2_DETAILS: (args: IFetchArgs) => FileRequests.details(args.id!),
	FILE_V2_LIST: (args: IFetchArgs) => FileRequests.list(args.count, args.cursor, args.order, args.purpose),
	FILE_V2_MIME_TYPES: () => FileRequests.mimeTypes(),
	FILE_V2_UPLOAD: (args: IPostArgs) => FileRequests.upload(args.upload!, args.expiresAfter),
	FILE_V2_USAGE: () => FileRequests.usage(),

	TRANSCRIPT_AUDIO: (args: IFetchArgs) => TranscriptRequests.audio(args.id!),
	TRANSCRIPT_DETAILS: (args: IFetchArgs) => TranscriptRequests.details(args.id!),
	TRANSCRIPT_LIST: () => TranscriptRequests.list(),
	TRANSCRIPT_UPLOAD: (args: IPostArgs) => TranscriptRequests.upload(args.upload!),

	MEMORY_DELETE: (args: IPostArgs) => MemoryRequests.delete(args.id!),
	MEMORY_DELETE_ALL: () => MemoryRequests.deleteAll(),
	MEMORY_DETAILS: (args: IFetchArgs) => MemoryRequests.details(args.id!),
	MEMORY_LIST: () => MemoryRequests.list(),

	USER_CHAT_BUDGET: () => UserRequests.chatBudget(),
	USER_DELETE: () => UserRequests.delete(),
	USER_DETAILS: () => UserRequests.details(),
	USER_FLAGS: () => UserRequests.flags(),
	USER_INSTRUCTIONS: () => UserRequests.instructions(),
	USER_INSTRUCTIONS_UPDATE: (args: IPostArgs) => UserRequests.updateInstructions(args.instructions!),
	USER_INVITE: (args: IPostArgs) => UserRequests.invite(args.email!),
	USER_NOTIFICATION_PREFERENCES: () => UserRequests.notificationPreferences(),
	USER_NOTIFICATION_PREFERENCES_UPDATE: (args: IPostArgs) =>
		UserRequests.updateNotificationPreferences(args.notificationPreferences!),
	USER_PETS: () => UserRequests.pets(),
	USER_PROFILE_UPDATE: (args: IPostArgs) => UserRequests.updateProfile(args.profileUpdates!),
	USER_RATE_LIMIT_CREDITS: () => UserRequests.credits(),
	USER_RATE_LIMIT_POWER_UP: () => UserRequests.powerUp(),
	USER_REGISTER_BETA: () => UserRequests.registerBeta(),
	USER_SAFETY_APPEAL: (args: IPostArgs) => UserRequests.appeal(args.id!, args.appeal!),
	USER_SAFETY_HUB: () => UserRequests.safetyHub(),
	USER_SESSION_TERMINATE: (args: IPostArgs) => UserRequests.terminateSession(args.id!),
	USER_SESSIONS: () => UserRequests.sessions(),
	USER_SESSIONS_TERMINATE_ALL: () => UserRequests.terminateSessions(),
	USER_TOKEN_USAGE: (args: IFetchArgs) => UserRequests.tokenUsage(args.days),
	USER_UPDATE: (args: IPostArgs) => UserRequests.update(args.userUpdates!),
	USER_USAGE: () => UserRequests.usage(),
	USER_WEB_SEARCH_AUDIT: (args: IFetchArgs) => UserRequests.webSearchAudit(args.count, args.cursor, args.domain),
	USER_WEB_SEARCH_DOMAINS: () => UserRequests.webSearchDomains(),
	USER_WEB_SEARCH_DOMAINS_UPDATE: (args: IPostArgs) => UserRequests.updateWebSearchDomains(args.webSearchDomains!),

	MCP_CREATE: (args: IPostArgs) => McpRequests.create(args.mcpServer!),
	MCP_DELETE: (args: IPostArgs) => McpRequests.delete(args.id!),
	MCP_DETAILS: (args: IFetchArgs) => McpRequests.details(args.id!),
	MCP_DISCOVER: (args: IPostArgs) => McpRequests.discover(args.id!),
	MCP_LIST: () => McpRequests.list(),
	MCP_OAUTH_COMPLETE: (args: IPostArgs) => McpRequests.oauthComplete(args.oauth!),
	MCP_OAUTH_START: (args: IPostArgs) => McpRequests.oauthStart(args.id!),
	MCP_UPDATE: (args: IPostArgs) => McpRequests.update(args.id!, args.mcpServerUpdates!),

	SKILL_CONTENT: (args: IFetchArgs) => SkillRequests.content(args.id!),
	SKILL_CREATE: (args: IPostArgs) => SkillRequests.create(args.uploads!, args.flags),
	SKILL_DELETE: (args: IPostArgs) => SkillRequests.delete(args.id!),
	SKILL_DETAILS: (args: IFetchArgs) => SkillRequests.details(args.id!),
	SKILL_LIST: (args: IFetchArgs) => SkillRequests.list(args.count, args.cursor, args.order, args.query, args.flags),
	SKILL_UPDATE: (args: IPostArgs) => SkillRequests.update(args.id!, args.version!),
	SKILL_VERSION_CONTENT: (args: IFetchArgs) => SkillRequests.versionContent(args.id!, args.version!),
	SKILL_VERSION_CREATE: (args: IPostArgs) => SkillRequests.versionCreate(args.id!, args.uploads!, args.isDefault),
	SKILL_VERSION_DELETE: (args: IPostArgs) => SkillRequests.versionDelete(args.id!, args.version!),
	SKILL_VERSION_DETAILS: (args: IFetchArgs) => SkillRequests.versionDetails(args.id!, args.version!),
	SKILL_VERSIONS: (args: IFetchArgs) => SkillRequests.versions(args.id!, args.count, args.cursor, args.order),

	/* eslint-enable @typescript-eslint/naming-convention */
};
