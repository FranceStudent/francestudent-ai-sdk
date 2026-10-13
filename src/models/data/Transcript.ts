import { TranscriptStatus } from '../../enums/Data';
import { ITranscript } from '../../types/data/Transcript';
import { ITranscriptCreate, ITranscriptDetail, ITranscriptSummary } from '../../types/raw/base/Transcript';

/**
 * Any of the raw formats of a transcription.
 *
 * @public
 */
export type RawTranscript = ITranscriptCreate | ITranscriptSummary | ITranscriptDetail;

/**
 * Converts an optional date string into an ISO string.
 *
 * @param date - The date string.
 *
 * @returns The ISO string, if any.
 */
function toIso(date?: string | null): string | undefined {
	return date ? new Date(date).toISOString() : undefined;
}

/**
 * The details of an audio transcription.
 *
 * @public
 */
export class Transcript implements ITranscript {
	/** The raw transcription details. */
	private readonly _raw: RawTranscript;

	public completedAt?: string;
	public contentType?: string;
	public createdAt?: string;
	public failureReason?: string;
	public id: string;
	public languageCode?: string;
	public languageConfidence?: number;
	public pathname?: string;
	public sizeBytes?: number;
	public startedAt?: string;
	public status?: TranscriptStatus;
	public text?: string;

	/**
	 * @param transcript - The raw transcription details, in any of the formats returned by the API.
	 */
	public constructor(transcript: RawTranscript) {
		const detail = transcript as ITranscriptDetail;

		this._raw = { ...transcript };
		this.id = transcript.uuid;
		this.status = transcript.status ? (transcript.status as TranscriptStatus) : undefined;
		this.createdAt = toIso(transcript.createdAt);
		this.pathname = detail.pathname ?? undefined;
		this.completedAt = toIso(detail.completedAt);
		this.startedAt = toIso(detail.startedAt);
		this.contentType = detail.contentType ?? undefined;
		this.sizeBytes = detail.sizeBytes ?? undefined;
		this.text = detail.transcriptText ?? undefined;
		this.languageCode = detail.languageCode ?? undefined;
		this.languageConfidence = detail.languageConfidence ?? undefined;
		this.failureReason = detail.failureReason ?? undefined;
	}

	/** The raw transcription details. */
	public get raw(): RawTranscript {
		return { ...this._raw };
	}

	/**
	 * Deserializes a list of raw transcriptions.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized transcriptions.
	 */
	public static list(response: ITranscriptSummary[]): Transcript[] {
		return (Array.isArray(response) ? response : [])
			.filter((item) => item?.uuid !== undefined)
			.map((item) => new Transcript(item));
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ITranscript {
		return {
			completedAt: this.completedAt,
			contentType: this.contentType,
			createdAt: this.createdAt,
			failureReason: this.failureReason,
			id: this.id,
			languageCode: this.languageCode,
			languageConfidence: this.languageConfidence,
			pathname: this.pathname,
			sizeBytes: this.sizeBytes,
			startedAt: this.startedAt,
			status: this.status,
			text: this.text,
		};
	}
}
