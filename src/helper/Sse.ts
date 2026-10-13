import { IStreamEvent } from '../types/raw/base/Stream';

/**
 * Parses a Server-Sent Events stream into events.
 *
 * @param source - The raw stream (Node.js readable stream, web stream, or any async iterable of chunks).
 *
 * @returns The parsed events, in order. A `[DONE]` payload ends the stream.
 *
 * @internal
 */
export async function* parseSse(source: AsyncIterable<Uint8Array | string>): AsyncGenerator<IStreamEvent> {
	const decoder = new TextDecoder();

	let buffer = '';
	let name = '';
	let id: string | undefined = undefined;
	let lines: string[] = [];

	/** Builds the pending event, if any, and resets the state. */
	const flush = (): IStreamEvent | 'done' | undefined => {
		const payload = lines.join('\n');
		const event = name || 'message';

		name = '';
		lines = [];

		if (!payload) {
			return undefined;
		}
		if (payload === '[DONE]') {
			return 'done';
		}

		let data: unknown = payload;

		try {
			data = JSON.parse(payload);
		} catch {
			// Not JSON, kept as a string
		}

		return { event: event, data: data, id: id };
	};

	/** Processes a single line, returning an event if the line ends one. */
	const processLine = (line: string): IStreamEvent | 'done' | undefined => {
		if (line === '') {
			return flush();
		}
		if (line.startsWith(':')) {
			return undefined;
		}

		const colon = line.indexOf(':');
		const field = colon === -1 ? line : line.slice(0, colon);
		let value = colon === -1 ? '' : line.slice(colon + 1);

		if (value.startsWith(' ')) {
			value = value.slice(1);
		}

		if (field === 'event') {
			name = value;
		} else if (field === 'data') {
			lines.push(value);
		} else if (field === 'id') {
			id = value;
		}

		return undefined;
	};

	for await (const chunk of source) {
		buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });

		let index: number;

		while ((index = buffer.search(/[\r\n]/)) !== -1) {
			// A trailing '\r' may be the first half of a '\r\n'
			if (buffer[index] === '\r' && index === buffer.length - 1) {
				break;
			}

			const separatorLength = buffer[index] === '\r' && buffer[index + 1] === '\n' ? 2 : 1;
			const line = buffer.slice(0, index);

			buffer = buffer.slice(index + separatorLength);

			const result = processLine(line);

			if (result === 'done') {
				return;
			}
			if (result) {
				yield result;
			}
		}
	}

	// Processing what remains once the stream has ended
	buffer += decoder.decode();

	for (const line of buffer.split(/\r\n|\r|\n/)) {
		const result = processLine(line);

		if (result === 'done') {
			return;
		}
		if (result) {
			yield result;
		}
	}

	const last = flush();

	if (last && last !== 'done') {
		yield last;
	}
}

/**
 * Reads a whole stream into a string.
 *
 * @param source - The stream.
 *
 * @returns The content of the stream.
 *
 * @internal
 */
export async function readStream(source: AsyncIterable<Uint8Array | string>): Promise<string> {
	const decoder = new TextDecoder();
	let text = '';

	for await (const chunk of source) {
		text += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
	}

	return text + decoder.decode();
}

/**
 * Checks whether the given value is an async iterable stream.
 *
 * @param value - The value to check.
 *
 * @returns Whether the value is an async iterable.
 *
 * @internal
 */
export function isStream(value: unknown): value is AsyncIterable<Uint8Array | string> {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function'
	);
}
