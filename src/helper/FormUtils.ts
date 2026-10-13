import { IUpload } from '../types/args/PostArgs';

import { guessMimeType } from './FileUtils';

/**
 * Builds a multipart form out of the given uploads.
 *
 * @param field - The name of the form field.
 * @param uploads - The files to upload.
 *
 * @returns The multipart form.
 *
 * @internal
 */
export function toFormData(field: string, uploads: IUpload[]): FormData {
	const form = new FormData();

	for (const upload of uploads) {
		const blob =
			upload.data instanceof Blob
				? upload.data
				: new Blob([upload.data as Uint8Array<ArrayBuffer>], {
						type: upload.type ?? guessMimeType(upload.name) ?? 'application/octet-stream',
					});

		form.append(field, blob, upload.name);
	}

	return form;
}
