import { AxiosRequestConfig } from 'axios';

import { toFormData } from '../helper/FormUtils';
import { IUpload } from '../types/args/PostArgs';

/**
 * Collection of requests related to audio transcriptions.
 *
 * @public
 */
export class TranscriptRequests {
	/**
	 * @param id - The ID of the target transcription.
	 */
	public static audio(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/transcript/${encodeURIComponent(id)}/audio` };
	}

	/**
	 * @param id - The ID of the target transcription.
	 */
	public static details(id: string): AxiosRequestConfig {
		return { method: 'get', url: `/transcript/${encodeURIComponent(id)}` };
	}

	/**
	 * Lists the transcriptions of the user.
	 */
	public static list(): AxiosRequestConfig {
		return { method: 'get', url: '/transcript' };
	}

	/**
	 * @param upload - The MP3 file to transcribe.
	 */
	public static upload(upload: IUpload): AxiosRequestConfig {
		return { method: 'post', url: '/transcript/upload', data: toFormData('file', [upload]) };
	}
}
