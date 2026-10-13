import { IAgent } from '../../types/data/Agent';
import { IAgent as IRawAgent } from '../../types/raw/base/Agent';

/**
 * The details of a single agent, i.e, a model that can be chatted with.
 *
 * @public
 */
export class Agent implements IAgent {
	/** The raw agent details. */
	private readonly _raw: IRawAgent;

	public description?: string;
	public id: number;
	public isActive: boolean;
	public isDefault: boolean;
	public model?: string;
	public name?: string;
	public namespace?: string;
	public provider?: string;

	/**
	 * @param agent - The raw agent details.
	 */
	public constructor(agent: IRawAgent) {
		this._raw = { ...agent };
		this.id = agent.id;
		this.name = agent.name;
		this.namespace = agent.namespace;
		this.description = agent.description || undefined;
		this.model = agent.model;
		this.provider = agent.modelProvider;
		this.isActive = agent.isActive ?? true;
		this.isDefault = agent.isDefault ?? false;
	}

	/** The raw agent details. */
	public get raw(): IRawAgent {
		return { ...this._raw };
	}

	/**
	 * Deserializes a list of raw agents.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized agents.
	 */
	public static list(response: IRawAgent[]): Agent[] {
		return (Array.isArray(response) ? response : [])
			.filter((item) => item?.id !== undefined)
			.map((item) => new Agent(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IAgent {
		return {
			description: this.description,
			id: this.id,
			isActive: this.isActive,
			isDefault: this.isDefault,
			model: this.model,
			name: this.name,
			namespace: this.namespace,
			provider: this.provider,
		};
	}
}
