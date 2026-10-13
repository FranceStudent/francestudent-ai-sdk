'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { FranceStudent, AuthenticationError, FranceStudentError } = require('../dist');

/** A mock of both the web application (api-token) and the API. */
const state = { tokens: 0, rejectNextToken: false, requests: [], failures: 0 };
let server;
let base;

function json(res, status, body, headers = {}) {
	res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
	res.end(JSON.stringify(body));
}

before(async () => {
	server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');
		let body = '';
		req.on('data', (c) => (body += c));
		req.on('end', () => {
			state.requests.push({
				method: req.method,
				path: url.pathname,
				query: url.search,
				headers: req.headers,
				body,
			});

			if (url.pathname === '/api/auth/api-token') {
				if (!/next-auth\.session-token=good-session/.test(req.headers.cookie ?? '')) {
					return json(res, 401, { error: 'Unauthorized' });
				}
				state.tokens++;
				return json(
					res,
					200,
					{ accessToken: `jwt-${state.tokens}`, expiresIn: 300, tokenType: 'Bearer' },
					{ 'Set-Cookie': 'next-auth.session-token=good-session; Path=/; HttpOnly' },
				);
			}

			const auth = req.headers.authorization;

			if (url.pathname === '/public/health') {
				return json(res, 200, { status: 'UP' });
			}
			if (!auth) {
				return json(res, 401, { error: true, message: 'Authentication is required to access this request.' });
			}
			if (state.rejectNextToken) {
				state.rejectNextToken = false;
				return json(res, 401, { error: true, message: 'expired' });
			}
			if (url.pathname === '/flaky') {
				// unused
			}
			if (url.pathname === '/chats' && req.method === 'GET') {
				if (state.failures > 0) {
					state.failures--;
					return json(res, 503, { message: 'busy' });
				}
				return json(res, 200, {
					chats: [
						{ id: 'c1', title: 'A', createdAt: '2026-01-01T00:00:00Z', agent: { id: -1002, name: 'GPT' } },
						{ id: 'c2', title: 'B', createdAt: '2026-01-02T00:00:00Z' },
					],
					hasMore: true,
				});
			}
			if (url.pathname === '/chats/stream' && req.method === 'POST') {
				res.writeHead(200, { 'Content-Type': 'text/event-stream' });
				res.write('event: response.created\ndata: {"chat_id":"new-chat"}\n\n');
				setTimeout(() => res.write('event: response.output_text.delta\ndata: {"delta":"Salut"}\n\n'), 10);
				setTimeout(() => {
					res.write('event: completed\ndata: {"message":{"content":"Salut"}}\n\n');
					res.end();
				}, 20);
				return;
			}
			if (url.pathname === '/chats/busy/stream' || url.pathname === '/chats/busy') {
				return json(res, 409, { message: 'A stream is already active for this chat' });
			}
			if (url.pathname === '/chats/budget') {
				return json(res, 429, { message: 'Chat budget exhausted. Reset at 2026-10-14T00:00:00Z' });
			}
			return json(res, 404, { error: 'Not found' });
		});
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

function client(options = {}) {
	return new FranceStudent({
		apiUrl: base,
		origin: base,
		sessionToken: 'good-session',
		deviceId: 'dev-1',
		...options,
	});
}

test('requests without credentials fail early, except public ones', async () => {
	const fs = new FranceStudent({ apiUrl: base, origin: base });
	await assert.rejects(fs.chat.list(), AuthenticationError);
});

test('exchanges the session token for a JWT and sends client headers', async () => {
	state.requests = [];
	const fs = client({ sessionToken: 'next-auth.session-token=good-session; other=1' });
	const page = await fs.chat.list(2);

	assert.equal(page.list.length, 2);
	assert.equal(page.list[0].agent.name, 'GPT');
	assert.equal(page.next, 'c2');

	const [tokenRequest, apiRequest] = state.requests;
	assert.equal(tokenRequest.path, '/api/auth/api-token');
	assert.match(tokenRequest.headers.cookie, /francestudent-device-id=dev-1/);
	assert.equal(tokenRequest.headers['francestudent-device-id'], 'dev-1');
	assert.match(apiRequest.headers.authorization, /^Bearer jwt-\d+$/);
	assert.equal(apiRequest.headers['francestudent-client-platform'], 'web_fs_ai');
	assert.equal(apiRequest.query, '?limit=2');
});

test('reuses the JWT, and renews it once after a 401', async () => {
	const fs = client();
	await fs.chat.list();
	const before = state.tokens;
	await fs.chat.list();
	assert.equal(state.tokens, before, 'token reused');

	state.rejectNextToken = true;
	await fs.chat.list();
	assert.equal(state.tokens, before + 1, 'token renewed after 401');
});

test('concurrent requests share a single token renewal', async () => {
	const fs = client();
	const before = state.tokens;
	await Promise.all([fs.chat.list(), fs.chat.list(), fs.chat.list()]);
	assert.equal(state.tokens, before + 1);
});

test('an invalid session is reported as an authentication error', async () => {
	const fs = client({ sessionToken: 'bad' });
	await assert.rejects(fs.chat.list(), (error) => error instanceof AuthenticationError && error.needsLogin);
});

test('retries transient errors when maxRetries is set', async () => {
	state.failures = 1;
	const page = await client({ maxRetries: 2 }).chat.list();
	assert.equal(page.list.length, 2);

	state.failures = 1;
	await assert.rejects(client().chat.list(), (error) => error instanceof FranceStudentError && error.status === 503);
	state.failures = 0;
});

test('streams a new chat', async () => {
	const deltas = [];
	const response = await client().chat.ask({ agentId: -1002, content: 'Hello' }, { onDelta: (d) => deltas.push(d) });

	assert.equal(response.content, 'Salut');
	assert.equal(response.chatId, 'new-chat');
	assert.deepEqual(deltas, ['Salut']);

	const request = state.requests.filter((r) => r.path === '/chats/stream').pop();
	assert.equal(request.headers.accept, 'text/event-stream');
	assert.deepEqual(JSON.parse(request.body), {
		agentId: -1002,
		chatId: null,
		enableCanvas: false,
		enableWebSearch: false,
		files: [],
		images: [],
		initialContent: 'Hello',
		isIncognito: false,
		isPrivate: true,
	});
});

test('stream errors expose the API message and status', async () => {
	await assert.rejects(
		client().chat.reply('busy', { content: 'x' }),
		(error) => error instanceof FranceStudentError && error.status === 409 && /already active/.test(error.message),
	);
	await assert.rejects(
		client().chat.reply('budget', { content: 'x' }),
		(error) => error.status === 429 && error.resetAt === '2026-10-14T00:00:00Z',
	);
});

test('an access token can be used directly', async () => {
	const fs = new FranceStudent({ apiUrl: base, origin: base, accessToken: 'static-jwt' });
	state.requests = [];
	await fs.chat.list();
	assert.equal(state.requests[0].headers.authorization, 'Bearer static-jwt');
});
