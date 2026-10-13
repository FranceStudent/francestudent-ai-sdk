/**
 * The token usage of a chat, a message or a user.
 *
 * @public
 */
export interface ITokenUsage {
	/** The number of input (prompt) tokens. */
	input: number;

	/** The number of output (candidates) tokens. */
	output: number;

	/** The number of reasoning tokens. */
	reasoning: number;

	/** The total number of tokens. */
	total: number;
}
