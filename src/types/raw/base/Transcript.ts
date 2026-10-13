/**
 * The raw status of an audio transcription.
 *
 * @public
 */
export type RawTranscriptStatus = 'PENDING' | 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

/**
 * Represents the raw result of uploading an audio file for transcription.
 *
 * @public
 */
export interface ITranscriptCreate {
	uuid: string;
	status?: RawTranscriptStatus;
	createdAt?: string;
}

/**
 * Represents the raw summary of a transcription.
 *
 * @public
 */
export interface ITranscriptSummary {
	uuid: string;
	pathname?: string;
	status?: RawTranscriptStatus;
	createdAt?: string;
	completedAt?: string;
}

/**
 * Represents the raw details of a transcription.
 *
 * @public
 */
export interface ITranscriptDetail extends ITranscriptSummary {
	contentType?: string;
	sizeBytes?: number;
	transcriptText?: string;
	languageCode?: string;
	languageConfidence?: number;
	failureReason?: string;
	startedAt?: string;
}
