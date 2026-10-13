/**
 * Represents the raw usage of the chat budget.
 *
 * @public
 */
export interface IBudgetUsage {
	usedPercent?: number;
	remainingPercent?: number;
	resetAt?: string;
	accountingUncertain?: boolean;
}

/**
 * Represents the raw usage of a single rate limit.
 *
 * @public
 */
export interface IUserRateLimitUsage {
	type?: string;
	bucket?: string;
	limit?: number;
	used?: number;
	remaining?: number;
	resetAt?: string;
	usedPercent?: number;
	remainingPercent?: number;
}

/**
 * Represents the raw rate limit usage of the user.
 *
 * @public
 */
export interface IUserUsage {
	rateLimits?: IUserRateLimitUsage[];
	rateLimitPowerUpActive?: boolean;
	chatBudget?: IBudgetUsage;
}

/**
 * Represents the raw token usage of the user for a single day.
 *
 * @public
 */
export interface IUserDailyTokenUsage {
	date: string;
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
	reasoningTokens?: number;
}

/**
 * Represents the raw token usage of the user.
 *
 * @public
 */
export interface IUserTokenUsage {
	promptTokenCount?: number;
	candidatesTokenCount?: number;
	totalTokenCount?: number;
	reasoningTokenCount?: number;
	last7DaysTokenUsage?: IUserDailyTokenUsage[];
}

/**
 * Represents a raw rate limit reset credit.
 *
 * @public
 */
export interface IRateLimitReset {
	id: string;
	grantedAt?: string;
	expiresAt?: string;
	durationDays?: number;
}

/**
 * Represents the raw rate limit reset credits of the user.
 *
 * @public
 */
export interface IRateLimitCredits {
	availableCount?: number;
	resets?: IRateLimitReset[];
}

/**
 * Represents the raw state of a rate limit power-up.
 *
 * @public
 */
export interface IRateLimitPowerUp {
	active?: boolean;
	expiresAt?: string;
}
