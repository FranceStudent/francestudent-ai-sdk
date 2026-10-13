/* eslint-disable */

/**
 * Represents a raw, OpenAI-style, page of items.
 *
 * @typeParam T - The type of the items.
 *
 * @public
 */
export interface IList<T> {
	object?: string;
	data: T[];
	first_id?: string;
	last_id?: string;
	has_more?: boolean;
}
