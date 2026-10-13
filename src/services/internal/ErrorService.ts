import { AxiosError, isAxiosError } from 'axios';

import { FranceStudentError } from '../../models/errors/FranceStudentError';
import { IErrorHandler } from '../../types/ErrorHandler';

/**
 * The base service that handles any errors.
 *
 * @public
 */
export class ErrorService implements IErrorHandler {
	/**
	 * Handles errors thrown by the API.
	 *
	 * @param error - The error response received from the API.
	 */
	private _handleAxiosError(error: AxiosError): void {
		throw new FranceStudentError(error);
	}

	/**
	 * Handle unknown error.
	 *
	 * @param error - The error.
	 */
	private _handleUnknownError(error: unknown): void {
		throw error instanceof Error ? error : new Error('Unknown error');
	}

	/**
	 * The method called when an error response is received from the API.
	 *
	 * @param error - The error caught while making HTTP request to the API.
	 */
	public handle(error: unknown): void {
		if (isAxiosError(error)) {
			this._handleAxiosError(error);
		} else {
			this._handleUnknownError(error);
		}
	}
}
