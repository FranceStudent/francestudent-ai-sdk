/**
 * The access level granted when sharing a chat or a project.
 *
 * @public
 */
export enum SharePermission {
	VIEW = 'View',
	WRITE = 'Write',
}

/**
 * The status of an audio transcription.
 *
 * @public
 */
export enum TranscriptStatus {
	COMPLETED = 'COMPLETED',
	ERROR = 'ERROR',
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	SUBMITTED = 'SUBMITTED',
}

/**
 * The type of web search domain filter.
 *
 * @public
 */
export enum WebSearchFilterType {
	ALLOWLIST = 'allowlist',
	BLOCKLIST = 'blocklist',
}

/**
 * The web search mode of the user.
 *
 * @public
 */
export enum WebSearchMode {
	DISABLED = 'disabled',
	FILTERED = 'filtered',
	OPEN = 'open',
}

/**
 * The reasoning effort used by GPT models.
 *
 * @public
 */
export enum ReasoningEffort {
	HIGH = 'high',
	LOW = 'low',
	MEDIUM = 'medium',
	MINIMAL = 'minimal',
	NONE = 'none',
	XHIGH = 'xhigh',
}

/**
 * The order in which paginated items are returned.
 *
 * @public
 */
export enum SortOrder {
	ASC = 'asc',
	DESC = 'desc',
}

/**
 * The reason given when appealing a safety classification.
 *
 * @public
 */
export enum SafetyAppealSignal {
	SIGNAL_0 = 0,
	SIGNAL_1 = 1,
	SIGNAL_2 = 2,
	SIGNAL_3 = 3,
}
