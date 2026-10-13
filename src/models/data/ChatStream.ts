import { ApiErrors } from '../../enums/Api';
import { LogActions } from '../../enums/Logging';
import { parseSse } from '../../helper/Sse';
import { LogService } from '../../services/internal/LogService';
import { IChatStreamEvent } from '../../types/data/ChatStreamEvent';
import { IChatMessage as IRawMessage } from '../../types/raw/base/Message';
import { IStreamEvent } from '../../types/raw/base/Stream';
import { StreamError } from '../errors/StreamError';

import { ChatResponse } from './Chat';
import { Message } from './Message';

/** The shape of the stream payloads that are interpreted. */
interface IStreamPayload {
	/* eslint-disable @typescript-eslint/naming-convention */
	chat_id?: string;
	chatId?: string;
	delta?: string;
	text?: string;
	message?: IRawMessage;
	response?: { error?: unknown };
	/* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * The timeouts applied to a chat stream.
 *
 * @public
 */
export interface IStreamTimeouts {
	/** The date (ms since the epoch) after which the stream is aborted, if any. */
	deadline?: number;

	/** The max time (ms) without receiving any data, or 0 to disable. */
	idleTimeout?: number;

	/** The signal of the user, whose abort is reported as such instead of a timeout. */
	signal?: AbortSignal;
}

/**
 * A chat stream: the response of an agent, received piece by piece.
 *
 * @remarks
 * <br>
 * - Iterate over it (`for await`) to receive each event as it arrives.
 * - Or call {@link ChatStream.response} to wait for the complete response.
 * - A stream can only be consumed once.
 *
 * @public
 */
export class ChatStream implements AsyncIterable<IChatStreamEvent> {
	/** The controller used to abort the underlying request. */
	private readonly _controller: AbortController;

	/** The timer of the overall deadline, if any. */
	private readonly _deadlineTimer?: NodeJS.Timeout;

	/** The raw stream. */
	private readonly _source: AsyncIterable<Uint8Array | string>;

	/** The timeouts of the stream. */
	private readonly _timeouts: IStreamTimeouts;

	/** Why the stream was aborted, if it was. */
	private _abortReason?: StreamError | 'DONE' | 'USER';

	/** The timer of the idle timeout, while waiting for data. */
	private _idleTimer?: NodeJS.Timeout;

	/** Whether the stream has started being consumed. */
	private _isConsumed = false;

	/** The ID of the chat, once known. */
	public chatId?: string;

	/** The final message, if the stream returned it. */
	public message?: Message;

	/** The text received so far. */
	public text = '';

	/**
	 * @param source - The raw stream of Server-Sent Events.
	 * @param controller - The controller used to abort the underlying request.
	 * @param chatId - The ID of the chat, if already known.
	 * @param timeouts - The timeouts to apply.
	 */
	public constructor(
		source: AsyncIterable<Uint8Array | string>,
		controller: AbortController,
		chatId?: string,
		timeouts: IStreamTimeouts = {},
	) {
		this._source = source;
		this._controller = controller;
		this._timeouts = timeouts;
		this.chatId = chatId;

		// The deadline applies even if the stream is never consumed, to release the connection
		if (timeouts.deadline !== undefined) {
			this._deadlineTimer = setTimeout(
				() => this._abort(StreamError.timeout('the stream lasted longer than allowed')),
				Math.max(0, timeouts.deadline - Date.now()),
			).unref();
		}

		timeouts.signal?.addEventListener('abort', () => this._abort('USER'), { once: true });
	}

	/**
	 * Aborts the underlying request, keeping track of the first reason.
	 *
	 * @param reason - Why the stream is aborted.
	 */
	private _abort(reason: StreamError | 'DONE' | 'USER'): void {
		this._abortReason ??= reason;
		this._clearTimers();
		this._controller.abort();
	}

	/**
	 * Clears all the timers of the stream.
	 */
	private _clearTimers(): void {
		clearTimeout(this._idleTimer);
		clearTimeout(this._deadlineTimer);
	}

	/**
	 * Builds the error to report once the stream was aborted, if it was not done.
	 *
	 * @param error - The error raised by the underlying stream, if any.
	 *
	 * @returns The error to report, if any.
	 */
	private _getAbortError(error?: unknown): Error | undefined {
		if (this._abortReason instanceof StreamError) {
			return this._abortReason;
		}
		if (this._abortReason === 'USER') {
			const reason: unknown = this._timeouts.signal?.aborted ? this._timeouts.signal.reason : undefined;

			return reason instanceof Error ? reason : new DOMException('The stream was aborted', 'AbortError');
		}

		if (error === undefined || error instanceof Error) {
			return error;
		}

		return new Error('The stream failed', { cause: error });
	}

	/**
	 * Interprets a raw event, updating the state of the stream.
	 *
	 * @param raw - The raw event.
	 *
	 * @returns The interpreted event, and whether it ends the stream.
	 */
	private _interpret(raw: IStreamEvent): { event: IChatStreamEvent; isLast: boolean } {
		const payload = (raw.data && typeof raw.data === 'object' ? raw.data : {}) as IStreamPayload;
		const chatId = payload.chat_id ?? payload.chatId;
		const event: IChatStreamEvent = { type: raw.event, data: raw.data, id: raw.id, chatId: chatId };
		let isLast = false;

		if (chatId) {
			this.chatId = chatId;
		}

		switch (raw.event) {
			case 'response.output_text.delta':
				if (typeof payload.delta === 'string') {
					event.delta = payload.delta;
					this.text += payload.delta;
				}
				break;

			case 'response.output_text.done':
				// Only used if no delta was received
				if (!this.text && typeof payload.text === 'string') {
					event.delta = payload.text;
					this.text = payload.text;
				}
				break;

			case 'response.failed':
			case 'error':
				throw new StreamError(raw.data);

			case 'response.completed':
				if (payload.response?.error) {
					throw new StreamError(payload.response.error);
				}
				break;

			case 'completed':
				if (payload.message && typeof payload.message === 'object' && payload.message.id) {
					this.message = new Message(payload.message);
				}
				if (!this.text && typeof payload.message?.content === 'string') {
					event.delta = payload.message.content;
					this.text = payload.message.content;
				}
				isLast = true;
				break;

			default:
				break;
		}

		return { event: event, isLast: isLast };
	}

	/**
	 * Reads the raw stream, applying the idle timeout while waiting for each chunk.
	 *
	 * @returns The chunks of the raw stream.
	 */
	private async *_read(): AsyncGenerator<Uint8Array | string> {
		const iterator = this._source[Symbol.asyncIterator]();
		const idleTimeout = this._timeouts.idleTimeout ?? 0;

		try {
			while (true) {
				// Only the time spent waiting for the server counts, not the time spent by the consumer
				if (idleTimeout > 0) {
					this._idleTimer = setTimeout(
						() => this._abort(StreamError.timeout(`no data received for ${idleTimeout} ms`)),
						idleTimeout,
					).unref();
				}

				const result = await iterator.next();

				clearTimeout(this._idleTimer);

				if (result.done) {
					return;
				}

				yield result.value;
			}
		} finally {
			clearTimeout(this._idleTimer);
			await iterator.return?.();
		}
	}

	/**
	 * Iterates over the events of the stream, as they arrive.
	 *
	 * @returns The iterator.
	 */
	public async *[Symbol.asyncIterator](): AsyncIterator<IChatStreamEvent> {
		if (this._isConsumed) {
			throw new Error('The stream has already been consumed');
		}

		this._isConsumed = true;

		// Aborted before being consumed
		if (this._abortReason !== undefined) {
			throw this._getAbortError() ?? new Error('The stream was aborted');
		}

		try {
			for await (const raw of parseSse(this._read())) {
				// Logging
				LogService.log(LogActions.STREAM, { event: raw.event, id: raw.id });

				const { event, isLast } = this._interpret(raw);

				yield event;

				if (isLast) {
					break;
				}
			}
		} catch (error) {
			throw this._getAbortError(error) ?? new Error('The stream failed');
		} finally {
			// Releasing the connection, whether the stream ended, failed or was left early
			this._abort('DONE');
		}

		// A stream cut by a timeout or an abort may end without error
		const error = this._getAbortError();

		if (error !== undefined) {
			throw error;
		}
	}

	/**
	 * Stops receiving the stream.
	 *
	 * @remarks This does not stop the generation on the server; use `chat.cancel()` for that.
	 */
	public abort(): void {
		this._abort('USER');
	}

	/**
	 * Waits for the complete response.
	 *
	 * @param onDelta - Optional callback, called with each piece of text as it arrives.
	 *
	 * @returns The complete response.
	 *
	 * @throws A {@link StreamError} if the stream reports a failure, or an error if it ends without any response.
	 */
	public async response(onDelta?: (delta: string) => void): Promise<ChatResponse> {
		for await (const event of this) {
			if (event.delta && onDelta) {
				onDelta(event.delta);
			}
		}

		if (!this.text.trim() && !this.message) {
			throw new Error(ApiErrors.EMPTY_STREAM);
		}

		return new ChatResponse(this.text, this.chatId ?? this.message?.chatId, this.message);
	}
}
