/**
 * Represents the raw web search domain filter of the user.
 *
 * @public
 */
export interface IUserWebSearchDomains {
	filterType: 'allowlist' | 'blocklist';
	allowedDomains: string[];
	blockedDomains: string[];
}

/**
 * Represents a raw entry of the web search history.
 *
 * @public
 */
export interface IWebSearchAuditEntry {
	messageId: string;
	chatId: string;
	createdAt?: string;
	domains?: string[];
	calls?: unknown;
}
