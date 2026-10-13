'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const CLI = path.join(__dirname, '..', 'dist', 'cli.js');
const PASSWORD = 'hunter2-secret';

let server;
let mock;
let closed;

/** Runs the CLI, returning its exit code and outputs. */
function run(args, { input, env = {} } = {}) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, [CLI, ...args], {
			env: { PATH: process.env.PATH, ...env },
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (chunk) => (stdout += chunk));
		child.stderr.on('data', (chunk) => (stderr += chunk));
		child.on('close', (code) => resolve({ code, stdout, stderr }));
		if (input !== undefined) {
			child.stdin.end(input);
		} else {
			child.stdin.end();
		}
	});
}

/** Gets a local port with nothing listening on it. */
async function closedPort() {
	const probe = net.createServer();
	await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
	const { port } = probe.address();
	await new Promise((resolve) => probe.close(resolve));
	return port;
}

before(async () => {
	server = http.createServer((req, res) => {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'UP', path: req.url }));
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	mock = `http://127.0.0.1:${server.address().port}`;
	closed = `http://127.0.0.1:${await closedPort()}`;
});

after(() => server.close());

test('auth login failures print a safe JSON error, without secrets', async () => {
	const { code, stdout, stderr } = await run(['--origin', closed, 'auth', 'login'], {
		env: { FS_EMAIL: 'me@x.fr', FS_PASSWORD: PASSWORD },
	});

	assert.equal(code, 1);
	const error = JSON.parse(stderr);
	assert.equal(typeof error.message, 'string');
	for (const text of [stdout, stderr]) {
		assert.ok(!text.includes(PASSWORD), 'password leaked');
		assert.ok(!/cookie/i.test(text), 'cookie leaked');
		assert.ok(!/circular/i.test(text), 'circular structure error');
		assert.ok(!/\n\s+at /.test(text), 'stack trace printed');
	}
});

test('auth login reads piped credentials without echoing the password', async () => {
	const { code, stdout, stderr } = await run(['--origin', closed, 'auth', 'login'], {
		input: `me@x.fr\n${PASSWORD}\n`,
	});

	assert.equal(code, 1);
	assert.ok(!stdout.includes(PASSWORD), 'password echoed on stdout');
	assert.ok(!stderr.includes(PASSWORD), 'password echoed on stderr');
	// Both lines were consumed: the failure comes from the network, not from missing credentials
	assert.doesNotMatch(JSON.parse(stderr).message, /email and a password are required/i);
});

test('auth login without any input reports missing credentials', async () => {
	const { code, stderr } = await run(['--origin', closed, 'auth', 'login'], { input: '' });

	assert.equal(code, 1);
	assert.match(JSON.parse(stderr).message, /email and a password are required/i);
});

test('public health prints JSON', async () => {
	const { code, stdout } = await run(['--api-url', mock, 'public', 'health']);

	assert.equal(code ?? 0, 0);
	assert.equal(JSON.parse(stdout).status, 'UP');
});
