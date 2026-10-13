/**
 * Represents a single raw Server-Sent Event received from a chat stream.
 *
 * @public
 */
export interface IStreamEvent {
	/** The name of the event (`message` if none was sent). */
	event: string;

	/** The parsed JSON payload, or the raw string if it is not JSON. */
	data: unknown;

	/** The ID of the event, if any. */
	id?: string;
}
