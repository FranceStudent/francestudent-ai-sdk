'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');

const { FranceStudent, FranceStudentError } = require('../dist');

/** Number of hits per "METHOD path". */
const hits = new Map();
let server;
let base;
let closedBase;

function json(res, status, body) {
	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(body));
}

before(async () => {
	server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');
		const key = `${req.method} ${url.pathname}`;

		hits.set(key, (hits.get(key) ?? 0) + 1);
		req.resume();
		req.on('end', () => {
			if (url.pathname === '/api/auth/api-token') {
				return json(res, 200, { accessToken: 'jwt', expiresIn: 300 });
			}
			if (url.pathname === '/projects') {
				return json(res, 500, { message: 'internal' });
			}
			if (url.pathname === '/chats/budget') {
				return json(res, 429, { message: 'Chat budget exhausted. Reset at 2026-10-14T00:00:00Z' });
			}
			if (url.pathname.startsWith('/chats/limited')) {
				return json(res, 429, { message: 'Too many requests' });
			}
			if (url.pathname === '/mcp/servers' || url.pathname === '/files/upload') {
				return json(res, 200, { id: 'srv', uuid: 'u1', server_label: 'x', server_url: 'https://x' });
			}
			return json(res, 404, { error: 'Not found' });
		});
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${server.address().port}`;

	// A port with nothing listening on it
	const probe = net.createServer();
	await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
	closedBase = `http://127.0.0.1:${probe.address().port}`;
	await new Promise((resolve) => probe.close(resolve));
});

after(() => server.close());

function client(options = {}) {
	return new FranceStudent({ apiUrl: base, origin: base, sessionToken: 'session', deviceId: 'dev', ...options });
}

/** Captures the console logs written while running the given function. */
async function captureLogs(fn) {
	const lines = [];
	const original = console.log;
	console.log = (...args) => lines.push(args.join(' '));
	try {
		await fn();
	} finally {
		console.log = original;
	}
	return lines;
}

test('an aborted request is rejected immediately, without retries', async () => {
	const controller = new AbortController();
	controller.abort();

	const start = Date.now();
	await assert.rejects(
		client({ maxRetries: 3 }).chat.stream({ agentId: -1002, content: 'x' }, { signal: controller.signal }),
		(error) => error.code === 'ERR_CANCELED' && !(error instanceof FranceStudentError),
	);
	assert.ok(Date.now() - start < 500, `took ${Date.now() - start} ms`);
});

test('a request aborted during the back-off stops waiting', async () => {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), 100);

	const start = Date.now();
	await assert.rejects(
		client({ maxRetries: 3 }).chat.attach('limited', undefined, { signal: controller.signal }),
		(error) => error.code === 'ERR_CANCELED',
	);
	assert.ok(Date.now() - start < 900, `took ${Date.now() - start} ms`);
});

test('a failed GET is retried, a failed POST is not', async () => {
	hits.clear();
	const fs = client({ maxRetries: 1 });

	await assert.rejects(fs.project.list(), (error) => error instanceof FranceStudentError && error.status === 500);
	assert.equal(hits.get('GET /projects'), 2);

	await assert.rejects(fs.project.create('p'), (error) => error.status === 500);
	assert.equal(hits.get('POST /projects'), 1);
});

test('a 429 is retried for a POST, unless the budget is exhausted', async () => {
	hits.clear();
	const fs = client({ maxRetries: 1 });

	await assert.rejects(fs.chat.reply('limited', { content: 'x' }), (error) => error.status === 429);
	assert.equal(hits.get('POST /chats/limited'), 2);

	await assert.rejects(
		fs.chat.reply('budget', { content: 'x' }),
		(error) => error.status === 429 && error.resetAt === '2026-10-14T00:00:00Z',
	);
	assert.equal(hits.get('POST /chats/budget'), 1);
});

test('a POST that never reached the server is retried, and reports status 0 with the error code', async () => {
	const fs = client({ apiUrl: closedBase, maxRetries: 1, logging: true });
	let error;

	const lines = await captureLogs(async () => {
		error = await fs.project.create('p').catch((e) => e);
	});
	client();

	assert.ok(error instanceof FranceStudentError);
	assert.equal(error.status, 0);
	assert.equal(error.code, 'ECONNREFUSED');
	assert.equal(error.toJSON().code, 'ECONNREFUSED');
	assert.equal(lines.filter((line) => line.includes('[RETRY]')).length, 1, 'retried once');
});

test('request logs redact secrets and never dump binary data', async () => {
	const fs = client({ logging: true });
	const big = new Uint8Array(1024 * 1024).fill(7);

	const lines = await captureLogs(async () => {
		await fs.mcp.create({
			label: 'x',
			url: 'https://x',
			authorization: 'Bearer super-secret-token',
			headers: { 'X-Api-Key': 'super-secret-header' },
		});
		await fs.attachment.upload({ data: big, name: 'big.png', type: 'image/png' });
		await fs.user.invite('private@example.com').catch(() => undefined);
	});
	const logs = lines.join('\n');

	assert.ok(logs.includes('[REQUEST]'));
	assert.ok(!logs.includes('super-secret'), 'secrets are redacted');
	assert.ok(!logs.includes('private@example.com'), 'emails are redacted');
	assert.ok(!logs.includes('"0":7'), 'binary data is not dumped');
	assert.ok(logs.includes('"name":"big.png"') && logs.includes(`"size":${big.byteLength}`));
	assert.ok(logs.length < 20_000, `logs are ${logs.length} characters long`);

	// Disabling the logs again for the other tests
	client();
});
