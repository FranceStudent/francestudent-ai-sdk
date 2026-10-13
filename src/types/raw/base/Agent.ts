/**
 * Represents the raw data of a single agent (model).
 *
 * @public
 */
export interface IAgent {
	id: number;
	name?: string;
	namespace?: string;
	description?: string;
	model?: string;
	modelProvider?: string;
	isActive?: boolean;
	isDefault?: boolean;
}

/**
 * Represents the raw reference to an agent.
 *
 * @public
 */
export interface IAgentId {
	id: number;
}
