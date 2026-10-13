'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { FranceStudent, StreamError } = require('../dist');

/** The responses that are still open, closed at the end. */
const open = new Set();
let server;
let base;

before(async () => {
	server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');

		if (url.pathname === '/api/auth/api-token') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			return res.end(JSON.stringify({ accessToken: 'jwt', expiresIn: 300 }));
		}

		open.add(res);
		res.on('close', () => open.delete(res));

		switch (url.pathname) {
			// Headers, then silence
			case '/chats/silent/stream':
				res.writeHead(200, { 'Content-Type': 'text/event-stream' });
				res.write('event: response.created\ndata: {"chat_id":"silent"}\n\n');
				return;

			// No headers at all
			case '/chats/mute/stream':
				return;

			// A chunk every 50 ms, forever
			case '/chats/trickle/stream': {
				res.writeHead(200, { 'Content-Type': 'text/event-stream' });
				const timer = setInterval(() => res.write(': ping\n\n'), 50);
				res.on('close', () => clearInterval(timer));
				return;
			}

			// A normal stream, slower than the idle timeout overall but never idle for long
			case '/chats/normal/stream': {
				res.writeHead(200, { 'Content-Type': 'text/event-stream' });
				const parts = ['Bon', 'jour', ' !'];
				let index = 0;
				const timer = setInterval(() => {
					if (index < parts.length) {
						res.write(`event: response.output_text.delta\ndata: {"delta":"${parts[index++]}"}\n\n`);
					} else {
						clearInterval(timer);
						res.end('event: completed\ndata: {"message":{"content":"Bonjour !"}}\n\n');
					}
				}, 100);
				res.on('close', () => clearInterval(timer));
				return;
			}

			default:
				res.writeHead(404);
				res.end();
		}
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
	for (const res of open) {
		res.destroy();
	}
	server.close();
});

function client(options = {}) {
	return new FranceStudent({
		apiUrl: base,
		origin: base,
		sessionToken: 'session',
		streamFirstByteTimeout: 300,
		streamIdleTimeout: 200,
		streamTimeout: 1000,
		...options,
	});
}

/** Asserts that the promise rejects with a stream timeout, in about the expected time. */
async function assertTimeout(promise, pattern, minMs, maxMs) {
	const start = Date.now();

	await assert.rejects(promise, (error) => {
		assert.ok(error instanceof StreamError, `expected a StreamError, got ${error}`);
		assert.equal(error.reason, 'TIMEOUT');
		assert.match(error.message, pattern);
		return true;
	});

	const elapsed = Date.now() - start;
	assert.ok(elapsed >= minMs && elapsed <= maxMs, `timed out after ${elapsed} ms`);
}

test('a silent stream times out after the idle timeout', async () => {
	await assertTimeout(
		client()
			.chat.attach('silent')
			.then((stream) => stream.response()),
		/no data received for 200 ms/,
		150,
		800,
	);
});

test('a stream whose headers never arrive times out after the first byte timeout', async () => {
	await assertTimeout(client().chat.attach('mute'), /no response received within 300 ms/, 250, 900);
});

test('a trickling stream stays alive past the idle timeout, until the overall timeout', async () => {
	await assertTimeout(
		client()
			.chat.attach('trickle')
			.then((stream) => stream.response()),
		/longer than allowed/,
		900,
		1800,
	);
});

test('a normal stream is not affected by the timeouts', async () => {
	const deltas = [];
	const response = await client({ streamIdleTimeout: 250 })
		.chat.attach('normal')
		.then((stream) => stream.response((delta) => deltas.push(delta)));

	assert.equal(response.content, 'Bonjour !');
	assert.deepEqual(deltas, ['Bon', 'jour', ' !']);
});

test('the time spent by the consumer does not count as idle time', async () => {
	const stream = await client({ streamIdleTimeout: 150 }).chat.attach('normal');
	let text = '';

	for await (const event of stream) {
		text += event.delta ?? '';
		// Slower than the idle timeout
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	assert.equal(text, 'Bonjour !');
});

test('timeouts set to 0 are disabled', async () => {
	const stream = await client({ streamIdleTimeout: 0, streamTimeout: 0 }).chat.attach('silent');
	const result = await Promise.race([
		stream.response().then(
			() => 'resolved',
			(error) => error,
		),
		new Promise((resolve) => setTimeout(() => resolve('pending'), 500)),
	]);

	assert.equal(result, 'pending');
	stream.abort();
});

test('a user abort surfaces as an abort, not as a timeout', async () => {
	const controller = new AbortController();
	const stream = await client().chat.attach('trickle', undefined, { signal: controller.signal });
	setTimeout(() => controller.abort(), 100);

	await assert.rejects(stream.response(), (error) => {
		assert.equal(error.name, 'AbortError');
		assert.ok(!(error instanceof StreamError));
		return true;
	});
});

test('a user abort before the response headers surfaces as an abort', async () => {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), 100);

	await assert.rejects(client().chat.attach('mute', undefined, { signal: controller.signal }), (error) => {
		assert.ok(!(error instanceof StreamError), `unexpected ${error}`);
		return true;
	});
});

test('ChatStream.abort() surfaces as an abort', async () => {
	const stream = await client().chat.attach('trickle');
	setTimeout(() => stream.abort(), 100);

	await assert.rejects(stream.response(), { name: 'AbortError' });
});

test('a stream that is never consumed does not keep the timers alive', async () => {
	// The deadline still releases the connection; the timers are unref'd, so the test process can exit
	const stream = await client({ streamTimeout: 300 }).chat.attach('trickle');
	await new Promise((resolve) => setTimeout(resolve, 500));

	await assert.rejects(stream.response(), /longer than allowed/);
});
