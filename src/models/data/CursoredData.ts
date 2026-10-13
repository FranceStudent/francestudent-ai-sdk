import { ICursoredData } from '../../types/data/CursoredData';

/**
 * The data that is fetched batch-wise using a cursor.
 *
 * @typeParam T - Type of data to be stored.
 *
 * @public
 */
export class CursoredData<T extends { toJSON(): unknown }> implements ICursoredData<T> {
	public list: T[];
	public next: string;

	/**
	 * @param list - The batch of data.
	 * @param next - The cursor to the next batch, or an empty string if there is none.
	 */
	public constructor(list: T[], next?: string | null) {
		this.list = list;
		this.next = next ?? '';
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ICursoredData<unknown> {
		return {
			list: this.list.map((item) => item.toJSON()),
			next: this.next,
		};
	}
}
