/**
 * The data that is fetched batch-wise using a cursor.
 *
 * @typeParam T - Type of data to be stored.
 *
 * @public
 */
export interface ICursoredData<T> {
	/** The batch of data of the given type. */
	list: T[];

	/** The cursor to the next batch of data, or an empty string if there is none. */
	next: string;
}
