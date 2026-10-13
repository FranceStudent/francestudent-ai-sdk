import { TranscriptStatus } from '../../enums/Data';

/**
 * The details of an audio transcription.
 *
 * @public
 */
export interface ITranscript {
	/** The date and time at which the transcription completed, in UTC string format. */
	completedAt?: string;

	/** The MIME type of the audio file. */
	contentType?: string;

	/** The date and time of creation of the transcription, in UTC string format. */
	createdAt?: string;

	/** The reason of the failure, if the transcription failed. */
	failureReason?: string;

	/** The ID (UUID) of the transcription. */
	id: string;

	/** The detected language code. */
	languageCode?: string;

	/** The confidence of the detected language. */
	languageConfidence?: number;

	/** The storage path of the audio file. */
	pathname?: string;

	/** The size of the audio file, in bytes. */
	sizeBytes?: number;

	/** The date and time at which the transcription started, in UTC string format. */
	startedAt?: string;

	/** The status of the transcription. */
	status?: TranscriptStatus;

	/** The transcribed text, once completed. */
	text?: string;
}
