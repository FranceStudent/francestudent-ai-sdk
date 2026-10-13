/**
 * A single event received from a chat stream.
 *
 * @public
 */
export interface IChatStreamEvent {
	/** The ID of the chat, if the event carries it. */
	chatId?: string;

	/** The raw payload of the event. */
	data: unknown;

	/** The piece of text added to the response, for `response.output_text.delta` events. */
	delta?: string;

	/** The ID of the event, usable to resume the stream. */
	id?: string;

	/** The type (name) of the event, e.g, `response.output_text.delta`. */
	type: string;
}
