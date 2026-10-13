/**
 * Represents the raw personalization settings of the user.
 *
 * @public
 */
export interface IUserPersonalization {
	gptReasoning?: string;
	customInstructions?: string;
	defaultModelId?: number;
	adsFrequency?: string;
	memoryEnabled?: boolean;
	imageGenerationModel?: string;
	webSearchMode?: string;
	documentToolsEnabled?: boolean;
	imageGenerationToolEnabled?: boolean;
}

/**
 * Represents the raw notification preferences of the user.
 *
 * @public
 */
export interface INotificationPreferences {
	appUpdates?: boolean;
	offersAndSubscriptions?: boolean;
}

/**
 * Represents a raw user flag.
 *
 * @public
 */
export interface IUserFlag {
	name: string;
	description?: string;
}

/**
 * Represents a raw referral invitation.
 *
 * @public
 */
export interface IUserReferralInvite {
	id: string;
	inviterUserId?: number;
	invitedEmail?: string;
	status?: 'PENDING' | 'SENT' | 'FAILED' | 'ACCEPTED';
	createdAt?: string;
	sentAt?: string;
	acceptedAt?: string;
}
