/**
 * Represents the raw token usage of a chat, a message or a user.
 *
 * @public
 */
export interface ITokenUsage {
	promptTokenCount?: number;
	candidatesTokenCount?: number;
	totalTokenCount?: number;
	reasoningTokenCount?: number;
}
