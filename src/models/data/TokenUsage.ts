import { ITokenUsage } from '../../types/data/TokenUsage';
import { ITokenUsage as IRawTokenUsage } from '../../types/raw/base/TokenUsage';

/**
 * The token usage of a chat, a message or a user.
 *
 * @public
 */
export class TokenUsage implements ITokenUsage {
	public input: number;
	public output: number;
	public reasoning: number;
	public total: number;

	/**
	 * @param usage - The raw token usage.
	 */
	public constructor(usage: IRawTokenUsage) {
		this.input = usage.promptTokenCount ?? 0;
		this.output = usage.candidatesTokenCount ?? 0;
		this.reasoning = usage.reasoningTokenCount ?? 0;
		this.total = usage.totalTokenCount ?? 0;
	}

	/**
	 * Deserializes an optional raw token usage.
	 *
	 * @param usage - The raw token usage, if any.
	 *
	 * @returns The deserialized token usage, if any.
	 */
	public static optional(usage?: IRawTokenUsage | null): TokenUsage | undefined {
		return usage ? new TokenUsage(usage) : undefined;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ITokenUsage {
		return { input: this.input, output: this.output, reasoning: this.reasoning, total: this.total };
	}
}
