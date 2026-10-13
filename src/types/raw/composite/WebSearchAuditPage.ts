import { IWebSearchAuditEntry } from '../base/WebSearch';

/**
 * Represents a raw page of the web search history.
 *
 * @public
 */
export interface IWebSearchAuditPage {
	entries?: IWebSearchAuditEntry[];
	hasMore?: boolean;
	nextCursor?: string;
}
