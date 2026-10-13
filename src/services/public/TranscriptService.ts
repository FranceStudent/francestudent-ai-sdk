import { Extractors } from '../../collections/Extractors';
import { TranscriptStatus } from '../../enums/Data';
import { ResourceType } from '../../enums/Resource';
import { toUpload } from '../../helper/FileUtils';
import { Transcript } from '../../models/data/Transcript';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IUpload } from '../../types/args/PostArgs';
import { ITranscriptCreate, ITranscriptDetail, ITranscriptSummary } from '../../types/raw/base/Transcript';

import { FetcherService } from './FetcherService';

/**
 * Optional settings when waiting for a transcription.
 *
 * @public
 */
export interface ITranscriptWaitOptions {
	/** The delay (in ms) between two checks. Defaults to 3000. */
	interval?: number;

	/** The maximum time (in ms) to wait. Defaults to 600000 (10 minutes). */
	timeout?: number;
}

/**
 * Handles interacting with audio transcriptions.
 *
 * @public
 */
export class TranscriptService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Download the audio file of a transcription.
	 *
	 * @param id - The ID of the target transcription.
	 *
	 * @returns The audio file (MP3).
	 */
	public async audio(id: string): Promise<Buffer> {
		const resource = ResourceType.TRANSCRIPT_AUDIO;

		// Downloading the audio file
		const response = await this.request<ArrayBuffer>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the details of a transcription, including the transcribed text once completed.
	 *
	 * @param id - The ID of the target transcription.
	 *
	 * @returns The details of the transcription.
	 */
	public async details(id: string): Promise<Transcript | undefined> {
		const resource = ResourceType.TRANSCRIPT_DETAILS;

		// Fetching raw transcription details
		const response = await this.request<ITranscriptDetail>(resource, { id: id });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the list of transcriptions of the user.
	 *
	 * @returns The list of transcriptions.
	 */
	public async list(): Promise<Transcript[]> {
		const resource = ResourceType.TRANSCRIPT_LIST;

		// Fetching raw list of transcriptions
		const response = await this.request<ITranscriptSummary[]>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Upload an audio file (MP3) to transcribe.
	 *
	 * @param file - The file to upload, or the path to a local file.
	 *
	 * @returns The created transcription; use {@link TranscriptService.wait} to wait for its completion.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance using the given 'SESSION_TOKEN'
	 * const fs = new FranceStudent({ sessionToken: SESSION_TOKEN });
	 *
	 * // Transcribing a recording
	 * const transcript = await fs.transcript.upload('./cours.mp3');
	 * const done = await fs.transcript.wait(transcript.id);
	 * console.log(done.text);
	 * ```
	 */
	public async upload(file: IUpload | string): Promise<Transcript> {
		const resource = ResourceType.TRANSCRIPT_UPLOAD;

		// Uploading the audio file
		const response = await this.request<ITranscriptCreate>(resource, { upload: await toUpload(file) });

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Wait for a transcription to complete (or fail).
	 *
	 * @param id - The ID of the target transcription.
	 * @param options - Optional settings (polling interval, timeout).
	 *
	 * @returns The details of the transcription, with status `COMPLETED` or `ERROR`.
	 *
	 * @throws An error if the transcription is not finished before the timeout.
	 */
	public async wait(id: string, options?: ITranscriptWaitOptions): Promise<Transcript> {
		const interval = options?.interval ?? 3000;
		const deadline = Date.now() + (options?.timeout ?? 600_000);

		while (true) {
			const transcript = await this.details(id);

			if (transcript?.status === TranscriptStatus.COMPLETED || transcript?.status === TranscriptStatus.ERROR) {
				return transcript;
			}
			if (Date.now() + interval > deadline) {
				throw new Error(
					`The transcription '${id}' is not finished (status: ${transcript?.status ?? 'unknown'})`,
				);
			}

			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}
}
