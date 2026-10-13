import {
	IChatUpdates,
	IConversationImportOptions,
	IFileExpiration,
	IInstructionsUpdates,
	IMcpServerUpdates,
	INewChat,
	INewMcpServer,
	INewMessage,
	INotificationPreferences,
	IOAuthCallback,
	IPostArgs,
	IProfileUpdates,
	IProjectUpdates,
	ISafetyAppeal,
	IShareTarget,
	IUpload,
	IUserUpdates,
	IWebSearchDomains,
} from '../../types/args/PostArgs';

/**
 * Options specifying the data that is to be posted.
 *
 * @public
 */
export class PostArgs implements IPostArgs {
	public appeal?: ISafetyAppeal;
	public chat?: INewChat;
	public chatId?: string;
	public chatUpdates?: IChatUpdates;
	public content?: string;
	public conversationImport?: IConversationImportOptions;
	public email?: string;
	public expiresAfter?: IFileExpiration;
	public flags?: string[];
	public id?: string;
	public instructions?: IInstructionsUpdates;
	public isDefault?: boolean;
	public isUpvoted?: boolean;
	public mcpServer?: INewMcpServer;
	public mcpServerUpdates?: IMcpServerUpdates;
	public message?: INewMessage;
	public messageId?: string;
	public name?: string;
	public notificationPreferences?: INotificationPreferences;
	public oauth?: IOAuthCallback;
	public profileUpdates?: IProfileUpdates;
	public projectUpdates?: IProjectUpdates;
	public share?: IShareTarget;
	public upload?: IUpload;
	public uploads?: IUpload[];
	public userId?: number;
	public userUpdates?: IUserUpdates;
	public version?: string;
	public webSearchDomains?: IWebSearchDomains;

	/**
	 * @param args - Additional user-defined arguments for posting the resource.
	 */
	public constructor(args: IPostArgs) {
		if (args.chat !== undefined && !args.chat.content?.trim()) {
			throw new Error('The content of the chat cannot be empty');
		}
		if (args.message !== undefined && !args.message.content?.trim()) {
			throw new Error('The content of the message cannot be empty');
		}
		if (args.share !== undefined && args.share.userId === undefined && !args.share.userEmail) {
			throw new Error('A share requires either a user ID or a user email');
		}

		Object.assign(this, args);
	}
}
