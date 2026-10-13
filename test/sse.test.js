'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { parseSse } = require('../dist/helper/Sse');
const { ChatStream } = require('../dist/models/data/ChatStream');

async function* chunks(...parts) {
	for (const part of parts) {
		yield Buffer.from(part);
	}
}

async function collect(iterable) {
	const items = [];
	for await (const item of iterable) {
		items.push(item);
	}
	return items;
}

test('parseSse handles split chunks, CRLF, comments, ids and [DONE]', async () => {
	const events = await collect(
		parseSse(
			chunks(
				': keep-alive\r\n\r\nevent: a\r',
				'\ndata: {"x":',
				'1}\nid: 7\n\nevent: b\ndata: line1\ndata: line2\n\n',
				'data: [DONE]\n\nevent: ignored\ndata: {}\n\n',
			),
		),
	);

	assert.deepEqual(events, [
		{ event: 'a', data: { x: 1 }, id: '7' },
		{ event: 'b', data: 'line1\nline2', id: '7' },
	]);
});

test('parseSse flushes a last event without trailing blank line', async () => {
	const events = await collect(parseSse(chunks('event: end\ndata: {"ok":true}')));

	assert.deepEqual(events, [{ event: 'end', data: { ok: true }, id: undefined }]);
});

test('ChatStream aggregates deltas, chat id and final message', async () => {
	const source = chunks(
		'event: response.created\ndata: {"chat_id":"c1"}\n\n',
		'event: response.output_text.delta\ndata: {"delta":"Bon"}\n\n',
		'event: response.output_text.delta\ndata: {"delta":"jour"}\n\n',
		'event: completed\ndata: {"message":{"id":"m1","chatId":"c1","role":"assistant","content":"Bonjour","createdAt":"2026-01-01T00:00:00Z"}}\n\n',
		'event: response.output_text.delta\ndata: {"delta":"ignored"}\n\n',
	);
	const deltas = [];
	const response = await new ChatStream(source, new AbortController()).response((d) => deltas.push(d));

	assert.deepEqual(deltas, ['Bon', 'jour']);
	assert.equal(response.content, 'Bonjour');
	assert.equal(response.chatId, 'c1');
	assert.equal(response.message.id, 'm1');
});

test('ChatStream falls back to output_text.done and completed content', async () => {
	const done = await new ChatStream(
		chunks('event: response.output_text.done\ndata: {"text":"full"}\n\n'),
		new AbortController(),
	).response();
	assert.equal(done.content, 'full');

	const completed = await new ChatStream(
		chunks('event: completed\ndata: {"message":{"content":"from completed"}}\n\n'),
		new AbortController(),
	).response();
	assert.equal(completed.content, 'from completed');
});

test('ChatStream throws on stream errors and empty streams', async () => {
	await assert.rejects(
		new ChatStream(chunks('event: error\ndata: {"message":"boom"}\n\n'), new AbortController()).response(),
		{ name: 'STREAM_ERROR', message: /boom/ },
	);
	await assert.rejects(
		new ChatStream(
			chunks('event: response.completed\ndata: {"response":{"error":{"message":"budget"}}}\n\n'),
			new AbortController(),
		).response(),
		/budget/,
	);
	await assert.rejects(new ChatStream(chunks(''), new AbortController()).response(), /without any response/);
});

test('ChatStream can only be consumed once', async () => {
	const stream = new ChatStream(
		chunks('event: completed\ndata: {"message":{"content":"x"}}\n\n'),
		new AbortController(),
	);
	await stream.response();
	await assert.rejects(stream.response(), /already been consumed/);
});
