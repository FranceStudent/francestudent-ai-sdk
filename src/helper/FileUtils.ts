import { readFile } from 'fs/promises';
import { basename, extname } from 'path';

import { IUpload } from '../types/args/PostArgs';

/** The MIME types of common file extensions. */
const MimeTypes: { [extension: string]: string } = {
	/* eslint-disable @typescript-eslint/naming-convention */
	'.csv': 'text/csv',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.gif': 'image/gif',
	'.htm': 'text/html',
	'.html': 'text/html',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.json': 'application/json',
	'.m4a': 'audio/mp4',
	'.md': 'text/markdown',
	'.mp3': 'audio/mpeg',
	'.ogg': 'audio/ogg',
	'.pdf': 'application/pdf',
	'.png': 'image/png',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain',
	'.wav': 'audio/wav',
	'.webp': 'image/webp',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.xml': 'application/xml',
	'.zip': 'application/zip',
	/* eslint-enable @typescript-eslint/naming-convention */
};

/**
 * Guesses the MIME type of a file from its name.
 *
 * @param name - The name of the file.
 *
 * @returns The MIME type, if the extension is known.
 *
 * @internal
 */
export function guessMimeType(name: string): string | undefined {
	return MimeTypes[extname(name).toLowerCase()];
}

/**
 * Converts the given input into an upload, reading the file if a local path is given.
 *
 * @param input - The upload, or the path to a local file.
 *
 * @returns The upload.
 *
 * @internal
 */
export async function toUpload(input: IUpload | string): Promise<IUpload> {
	if (typeof input !== 'string') {
		return input;
	}

	return { data: new Uint8Array(await readFile(input)), name: basename(input), type: guessMimeType(input) };
}
