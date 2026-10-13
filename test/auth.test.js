'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const util = require('node:util');

const { FranceStudent, AuthenticationError } = require('../dist');

const PASSWORD = 'hunter2-secret';

let server;
let base;
const calls = { tokens: [] };

function json(res, status, body, headers = {}) {
	res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
	res.end(JSON.stringify(body));
}

before(async () => {
	server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');
		let body = '';
		req.on('data', (chunk) => (body += chunk));
		req.on('end', () => {
			// Log in flow
			if (url.pathname === '/api/auth/providers') {
				return json(res, 200, { whmcs: { type: 'oauth', signinUrl: `${base}/api/auth/signin/whmcs` } });
			}
			if (url.pathname === '/api/auth/csrf') {
				return json(res, 200, { csrfToken: 'csrf-1' });
			}
			if (url.pathname === '/api/auth/signin/whmcs') {
				return json(res, 200, { url: `${base}/oauth/authorize` });
			}
			if (url.pathname === '/oauth/authorize') {
				res.writeHead(200, { 'Content-Type': 'text/html' });
				return res.end(
					'<html><body><form method="post" action="/oauth/login">' +
						'<input type="hidden" name="token" value="t1">' +
						'<input type="email" name="username"><input type="password" name="password">' +
						'<button type="submit">Login</button></form></body></html>',
				);
			}
			if (url.pathname === '/oauth/login') {
				// Dropping the connection once the credentials are received
				return req.socket.destroy();
			}

			// Access token renewal
			if (url.pathname === '/api/auth/api-token') {
				const cookie = req.headers.cookie ?? '';
				const session = /next-auth\.session-token=([^;]+)/.exec(cookie)?.[1];
				calls.tokens.push(session);

				if (session === 'blocked') {
					return json(res, 403, {
						error: 'request_blocked',
						message: 'This request was blocked by our security rules.',
					});
				}
				if (session === 'bad-metadata') {
					return json(res, 400, { error: 'Invalid client metadata' });
				}
				if (session === 'expired') {
					return json(res, 401, { error: 'Unauthorized' });
				}
				if (session === 'slow-old') {
					return setTimeout(
						() =>
							json(
								res,
								200,
								{ accessToken: 'jwt-old', expiresIn: 300 },
								{ 'Set-Cookie': 'next-auth.session-token=slow-old-rotated; Path=/' },
							),
						150,
					);
				}
				if (session === 'fresh-new') {
					return json(res, 200, { accessToken: 'jwt-new', expiresIn: 300 });
				}
			}

			return json(res, 404, { error: 'Not found' });
		});
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

function client(options = {}) {
	return new FranceStudent({ apiUrl: base, origin: base, deviceId: 'dev-1', ...options });
}

test('a network error during log in does not leak the password nor the cookies', async () => {
	const fs = client();
	let caught;

	try {
		await fs.login('me@example.com', PASSWORD);
	} catch (error) {
		caught = error;
	}

	assert.ok(caught instanceof AuthenticationError, `unexpected error: ${caught}`);
	assert.match(caught.message, /POST .*\/oauth\/login/);

	for (const dump of [JSON.stringify(caught), util.inspect(caught, { depth: 10 }), String(caught.stack)]) {
		assert.ok(!dump.includes(PASSWORD), 'password leaked');
		assert.ok(!dump.includes('hunter2'), 'password leaked');
		assert.ok(!/cookie/i.test(dump), 'cookies leaked');
	}
});

test('a network error during token renewal does not leak the session cookie', async () => {
	const fs = new FranceStudent({ apiUrl: base, origin: 'http://127.0.0.1:1', sessionToken: 'very-secret-session' });
	let caught;

	try {
		await fs.token();
	} catch (error) {
		caught = error;
	}

	assert.ok(caught instanceof AuthenticationError);
	assert.match(caught.message, /api-token failed: ECONNREFUSED/);

	for (const dump of [JSON.stringify(caught), util.inspect(caught, { depth: 10 })]) {
		assert.ok(!dump.includes('very-secret-session'), 'session leaked');
		assert.ok(!/cookie/i.test(dump), 'cookies leaked');
	}
});

test('a 403 (Cloudflare block) is not reported as an expired session', async () => {
	await assert.rejects(
		client({ sessionToken: 'blocked' }).token(),
		(error) =>
			error instanceof AuthenticationError &&
			error.status === 403 &&
			error.needsLogin === false &&
			/request_blocked/.test(error.message),
	);
});

test('a 400 response surfaces the message of the server', async () => {
	await assert.rejects(
		client({ sessionToken: 'bad-metadata' }).token(),
		(error) => error.status === 400 && !error.needsLogin && /Invalid client metadata/.test(error.message),
	);
});

test('only a 401 requires a new log in', async () => {
	await assert.rejects(
		client({ sessionToken: 'expired' }).token(),
		(error) => error.status === 401 && error.needsLogin === true && /Unauthorized/.test(error.message),
	);
});

test('replacing the session during a renewal discards the outdated result', async () => {
	const updates = [];
	const fs = client({ sessionToken: 'slow-old', onSessionUpdate: (token) => updates.push(token) });
	calls.tokens = [];

	const pending = fs.token();

	// Replacing the session while the renewal with the old one is in progress
	await new Promise((resolve) => setTimeout(resolve, 50));
	fs.sessionToken = 'fresh-new';

	const { accessToken } = await pending;

	assert.equal(accessToken, 'jwt-new');
	assert.equal(fs.sessionToken, 'fresh-new');
	assert.deepEqual(updates, [], 'onSessionUpdate called with an outdated cookie');

	// Letting the outdated response arrive, it must not change anything
	await new Promise((resolve) => setTimeout(resolve, 200));
	assert.equal(fs.sessionToken, 'fresh-new');
	assert.equal((await fs.token()).accessToken, 'jwt-new');
	assert.deepEqual(calls.tokens, ['slow-old', 'fresh-new']);
});

test('concurrent renewals are still shared', async () => {
	const fs = client({ sessionToken: 'fresh-new' });
	calls.tokens = [];

	const tokens = await Promise.all([fs.token(), fs.token(), fs.token()]);

	assert.deepEqual(
		tokens.map((item) => item.accessToken),
		['jwt-new', 'jwt-new', 'jwt-new'],
	);
	assert.deepEqual(calls.tokens, ['fresh-new']);
});
