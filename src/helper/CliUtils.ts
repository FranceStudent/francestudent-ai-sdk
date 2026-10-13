import { IUpload } from '../types/args/PostArgs';

import { toUpload } from './FileUtils';

/** The properties of an error which are safe to output. */
const SafeErrorKeys = ['name', 'message', 'status', 'code', 'needsLogin', 'resetAt', 'body'];

/**
 * Builds a serializable representation of an error, without any secret.
 *
 * @remarks Arbitrary properties are never copied: HTTP client errors hold the request (headers, cookies, body).
 *
 * @param error - The error.
 *
 * @returns The safe representation.
 *
 * @internal
 */
export function toSafeError(error: Error): { [key: string]: unknown } {
	const source = error as unknown as { [key: string]: unknown; toJSON?: () => unknown };
	let fields: { [key: string]: unknown } = {};

	// Using the representation provided by the error itself, if any
	if (typeof source.toJSON === 'function') {
		try {
			const json = source.toJSON();

			if (json && typeof json === 'object') {
				fields = json as { [key: string]: unknown };
			}
		} catch {
			// Falling back to the safe keys
		}
	}

	const safe: { [key: string]: unknown } = { name: error.name, message: error.message };

	for (const key of SafeErrorKeys) {
		const value = key in fields ? fields[key] : source[key];

		if (value === undefined || key === 'name' || key === 'message') {
			continue;
		}

		// Keeping only values that can be serialized
		try {
			JSON.stringify(value);
			safe[key] = value;
		} catch {
			// Circular or not serializable
		}
	}

	return safe;
}

/**
 * Outputs the given JSON data.
 *
 * @param data - The data to be output.
 *
 * @internal
 */
export function output(data: unknown): void {
	// If data is string, output as is
	if (typeof data == 'string') {
		console.log(data);
	}
	// Errors are written to stderr, and make the process fail
	else if (data instanceof Error) {
		process.exitCode = 1;
		console.error(JSON.stringify(toSafeError(data), null, 4));
	}
	// Else, format the output
	else {
		console.log(JSON.stringify(data, null, 4) ?? 'OK');
	}
}

/**
 * Reads a local file into an upload.
 *
 * @param path - The path to the file.
 *
 * @returns The upload.
 *
 * @internal
 */
export async function readUpload(path: string): Promise<IUpload> {
	return toUpload(path);
}

/**
 * Parses an integer option.
 *
 * @param value - The raw value.
 *
 * @returns The parsed integer.
 *
 * @internal
 */
export function parseInteger(value: string): number {
	const parsed = Number(value);

	if (!Number.isInteger(parsed)) {
		throw new Error(`'${value}' is not an integer`);
	}

	return parsed;
}
