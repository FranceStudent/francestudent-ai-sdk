/**
 * The details of a single agent, i.e, a model that can be chatted with.
 *
 * @public
 */
export interface IAgent {
	/** The description of the agent. */
	description?: string;

	/** The ID of the agent, used when creating a chat. */
	id: number;

	/** Whether the agent is active. */
	isActive: boolean;

	/** Whether the agent is the default one. */
	isDefault: boolean;

	/** The underlying model. */
	model?: string;

	/** The display name of the agent. */
	name?: string;

	/** The namespace of the agent. */
	namespace?: string;

	/** The provider of the underlying model. */
	provider?: string;
}
