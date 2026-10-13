/* eslint-disable */

/**
 * Represents a raw action taken after a safety classification.
 *
 * @public
 */
export interface ISafetyAction {
	id: string;
	descriptions?: string[];
	action_type?: number;
}

/**
 * Represents raw content flagged by a safety classification.
 *
 * @public
 */
export interface ISafetyFlaggedContent {
	type?: string;
	id: string;
	content?: string;
	attachments?: string[];
}

/**
 * Represents a raw safety appeal.
 *
 * @public
 */
export interface ISafetyAppealStatus {
	id: string;
	status?: number;
	signal?: number;
	user_input?: string;
	created_at?: string;
	reviewed_at?: string;
}

/**
 * Represents a raw safety classification.
 *
 * @public
 */
export interface ISafetyClassification {
	id: string;
	classification_type?: number;
	description?: string;
	explainer_link?: string;
	actions?: ISafetyAction[];
	max_expiration_time?: string;
	flagged_content?: ISafetyFlaggedContent[];
	appeal_status?: ISafetyAppealStatus;
	is_appeal_eligible?: boolean;
	project_metadata?: { id: string; name?: string };
	created_at?: string;
}

/**
 * Represents the raw Safety Hub of the user.
 *
 * @public
 */
export interface ISafetyHub {
	classifications?: ISafetyClassification[];
	project_classifications?: ISafetyClassification[];
	account_standing?: { state?: number };
	is_appeal_eligible?: boolean;
	username?: string;
}

/**
 * Represents the raw response to a safety appeal.
 *
 * @public
 */
export interface ISafetyAppealResponse {
	appeal_id?: string;
}
