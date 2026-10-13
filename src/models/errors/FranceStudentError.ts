import { AxiosError } from 'axios';

import { IFranceStudentError } from '../../types/errors/FranceStudentError';
import { IErrorData } from '../../types/raw/base/Error';

/**
 * The error thrown by the FranceStudent API.
 *
 * @public
 */
export class FranceStudentError extends Error implements IFranceStudentError {
	public body?: unknown;
	public code?: string;
	public message: string;
	public name: string;
	public resetAt?: string;
	public status: number;

	/**
	 * @param error - The error response received from the API.
	 */
	public constructor(error: AxiosError) {
		const body = error.response?.data;
		const message = FranceStudentError._extractMessage(body) ?? error.message;

		super(message);
		this.body = body;
		this.message = message;
		this.name = 'FRANCESTUDENT_ERROR';
		// Network level failures such as timeouts and refused connections carry no response
		this.status = error.response?.status ?? 0;
		this.code = error.response === undefined ? error.code : undefined;
		this.resetAt = /Reset at (\S+?Z)/.exec(message)?.[1];
	}

	/**
	 * Extracts a readable message from any of the error formats used by the API.
	 *
	 * @param body - The response body.
	 *
	 * @returns The message, if one is found.
	 */
	private static _extractMessage(body: unknown): string | undefined {
		if (typeof body === 'string') {
			return body.trim() ? body.trim().slice(0, 1200) : undefined;
		}
		if (body && typeof body === 'object') {
			const data = body as IErrorData;

			return data.message ?? data.detail ?? (typeof data.error === 'string' ? data.error : data.title);
		}

		return undefined;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IFranceStudentError {
		return {
			body: this.body,
			code: this.code,
			message: this.message,
			name: this.name,
			resetAt: this.resetAt,
			status: this.status,
		};
	}
}
