'use strict';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { FranceStudent, TranscriptStatus, Attachment, StoredFile, Skill, McpServer, Project } = require('../dist');

/** The requests received by the mock, and the routes it serves. */
const state = { requests: [], routes: new Map() };
let server;
let base;

function json(res, status, body) {
	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(body === undefined ? '' : JSON.stringify(body));
}

/** Registers a route: `METHOD /path` → handler(request) returning [status, body] or a Buffer. */
function route(key, handler) {
	state.routes.set(key, handler);
}

before(async () => {
	server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			const raw = Buffer.concat(chunks);
			const request = {
				method: req.method,
				path: url.pathname,
				query: url.searchParams,
				headers: req.headers,
				raw: raw,
				body: raw.toString('latin1'),
			};

			if (url.pathname === '/api/auth/api-token') {
				return json(res, 200, { accessToken: 'jwt', expiresIn: 300 });
			}

			state.requests.push(request);

			const handler = state.routes.get(`${req.method} ${url.pathname}`);

			if (!handler) {
				return json(res, 404, { error: 'Not found' });
			}

			const result = handler(request);

			if (Buffer.isBuffer(result)) {
				res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
				return res.end(result);
			}

			const [status, body] = result;
			return json(res, status, body);
		});
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

beforeEach(() => {
	state.requests = [];
	state.routes.clear();
});

function client() {
	return new FranceStudent({ apiUrl: base, origin: base, sessionToken: 'session', deviceId: 'dev' });
}

/** The last request received for the given method and path. */
function last(method, path) {
	return state.requests.filter((r) => r.method === method && r.path === path).pop();
}

function jsonBody(request) {
	return JSON.parse(request.raw.toString('utf8'));
}

/** Counts the multipart parts with the given field name. */
function countParts(request, field) {
	return (request.body.match(new RegExp(`name="${field}"`, 'g')) ?? []).length;
}

const RAW_USER = {
	id: 42,
	name: 'Lou',
	email: 'lou@example.com',
	avatar: '',
	pets: 'fox',
	theme: 'dark',
	language: 'fr',
	tokenUsage: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15, reasoningTokenCount: 1 },
};

// USER

test('user: details, update, token usage and web search audit', async () => {
	route('GET /user/me', () => [200, RAW_USER]);
	route('PATCH /user/me', (r) => [200, { ...RAW_USER, ...jsonBody(r) }]);
	route('GET /user/tokenusage', () => [200, { totalTokenCount: 15, last7DaysTokenUsage: [] }]);
	route('GET /user/web-search-domains/audit-log', () => [
		200,
		{ entries: [{ messageId: 'm1', chatId: 'c1', domains: ['a.fr'] }], hasMore: true, nextCursor: 'n2' },
	]);

	const fs = client();
	const user = await fs.user.details();
	assert.equal(user.id, 42);
	assert.equal(user.pet, 'fox');
	assert.equal(user.avatar, undefined);
	assert.deepEqual(user.tokenUsage.toJSON(), { input: 10, output: 5, reasoning: 1, total: 15 });
	assert.equal(last('GET', '/user/me').headers.authorization, 'Bearer jwt');

	const updated = await fs.user.update({ name: 'Louise', theme: 'light' });
	assert.deepEqual(jsonBody(last('PATCH', '/user/me')), { name: 'Louise', theme: 'light' });
	assert.equal(updated.name, 'Louise');

	const usage = await fs.user.tokenUsage(7);
	assert.equal(last('GET', '/user/tokenusage').query.get('tokenUsageDays'), '7');
	assert.equal(usage.totalTokenCount, 15);

	const audit = await fs.user.webSearchAudit(10, 'c0', 'a.fr');
	const query = last('GET', '/user/web-search-domains/audit-log').query;
	assert.equal(query.get('limit'), '10');
	assert.equal(query.get('cursor'), 'c0');
	assert.equal(query.get('domain'), 'a.fr');
	assert.equal(audit.nextCursor, 'n2');
	assert.equal(audit.entries.length, 1);
});

// MEMORY

test('memory: list and details', async () => {
	route('GET /user/me/memories', () => [
		200,
		{ count: 1, totalSizeBytes: 3, memories: [{ id: 'mem1', name: 'a', path: '/a', sizeBytes: 3 }] },
	]);
	route('GET /user/me/memories/mem%201', () => [
		200,
		{ id: 'mem 1', name: 'a', content: 'abc', sizeBytes: 3, createdAt: '2026-01-01T00:00:00Z' },
	]);

	const fs = client();
	const list = await fs.memory.list();
	assert.equal(list.length, 1);
	assert.equal(list[0].id, 'mem1');
	assert.equal(list[0].sizeBytes, 3);

	const memory = await fs.memory.details('mem 1');
	assert.equal(memory.content, 'abc');
	assert.equal(memory.createdAt, '2026-01-01T00:00:00.000Z');
});

// PROJECT

test('project: create, chats paging, share and unshare', async () => {
	route('POST /projects', (r) => [
		200,
		{ id: 'p1', name: jsonBody(r).name, ownerId: 42, flags: 0, createdAt: '2026-01-01T00:00:00Z' },
	]);
	route('GET /projects/p1/chats', () => [
		200,
		{
			chats: [
				{ id: 'c1', createdAt: '2026-01-01T00:00:00Z' },
				{ id: 'c2', createdAt: '2026-01-02T00:00:00Z' },
			],
			hasMore: true,
		},
	]);
	route('POST /projects/p1/shares', (r) => [
		200,
		{ userId: 7, userEmail: jsonBody(r).userEmail, permission: 'View', owner: false },
	]);
	route('DELETE /projects/p1/shares/7', () => [200]);

	const fs = client();
	const project = await fs.project.create('Thesis');
	assert.ok(project instanceof Project);
	assert.deepEqual(jsonBody(last('POST', '/projects')), { name: 'Thesis' });
	assert.equal(project.name, 'Thesis');
	assert.equal(project.createdAt, '2026-01-01T00:00:00.000Z');

	const page = await fs.project.chats('p1', 2, 'c0');
	const query = last('GET', '/projects/p1/chats').query;
	assert.equal(query.get('limit'), '2');
	assert.equal(query.get('cursor_chat_id'), 'c0');
	assert.deepEqual(
		page.list.map((c) => c.id),
		['c1', 'c2'],
	);
	assert.equal(page.next, 'c2');

	const share = await fs.project.share('p1', 'friend@example.com');
	assert.deepEqual(jsonBody(last('POST', '/projects/p1/shares')), { userEmail: 'friend@example.com' });
	assert.equal(share.userId, 7);
	assert.equal(share.permission, 'View');

	await fs.project.unshare('p1', 7);
	assert.ok(last('DELETE', '/projects/p1/shares/7'));
});

// MESSAGE

test('message: vote, save, saved paging and image', async () => {
	const rawMessage = { id: 'm1', chatId: 'c1', role: 'assistant', content: 'Hi', createdAt: '2026-01-01T00:00:00Z' };
	route('PATCH /messages/m1', (r) => [200, { ...rawMessage, isUpvoted: jsonBody(r).isUpvoted }]);
	route('PUT /user/@me/saved-messages/c1/m1', () => [
		200,
		{ id: 's1', chatId: 'c1', messageId: 'm1', savedAt: '2026-01-03T00:00:00Z', message: rawMessage },
	]);
	route('GET /user/@me/saved-messages', () => [
		200,
		{
			savedMessages: [{ id: 's1', chatId: 'c1', messageId: 'm1', savedAt: '2026-01-03T00:00:00Z' }],
			hasMore: true,
			nextCursor: 'next-1',
		},
	]);
	route('GET /chats/c1/messages/m1/images/i1', () => Buffer.from([0x89, 0x50, 0x4e, 0x47]));

	const fs = client();
	const voted = await fs.message.vote('m1', false);
	assert.deepEqual(jsonBody(last('PATCH', '/messages/m1')), { isUpvoted: false });
	assert.equal(voted.isUpvoted, false);
	assert.equal(voted.content, 'Hi');

	const saved = await fs.message.save('c1', 'm1');
	assert.equal(saved.id, 's1');
	assert.equal(saved.message.id, 'm1');
	assert.equal(saved.savedAt, '2026-01-03T00:00:00.000Z');

	const page = await fs.message.saved(5, 'cur');
	const query = last('GET', '/user/@me/saved-messages').query;
	assert.equal(query.get('limit'), '5');
	assert.equal(query.get('cursor'), 'cur');
	assert.equal(page.list.length, 1);
	assert.equal(page.next, 'next-1');

	const image = await fs.message.image('c1', 'm1', 'i1');
	assert.ok(Buffer.isBuffer(image));
	assert.deepEqual([...image], [0x89, 0x50, 0x4e, 0x47]);
});

// PUBLIC

test('public: health without credentials', async () => {
	route('GET /public/health', () => [200, { status: 'UP', app: { status: 'UP' } }]);

	const fs = new FranceStudent({ apiUrl: base, origin: base });
	const health = await fs.public.health();
	assert.equal(health.status, 'UP');
	assert.equal(last('GET', '/public/health').headers.authorization, undefined);
});

// ATTACHMENT

test('attachment: upload from an IUpload', async () => {
	route('POST /files/upload', () => [
		200,
		{ uuid: 'u1', pathname: 'files/cat.png', contentType: 'image/png', url: 'https://cdn/cat.png' },
	]);

	const attachment = await client().attachment.upload({
		data: new Uint8Array([1, 2, 3]),
		name: 'cat.png',
		type: 'image/png',
	});
	const request = last('POST', '/files/upload');

	assert.match(request.headers['content-type'], /^multipart\/form-data; boundary=/);
	assert.match(request.body, /name="file"; filename="cat\.png"/);
	assert.match(request.body, /Content-Type: image\/png/);
	assert.equal(countParts(request, 'file'), 1);
	assert.ok(attachment instanceof Attachment);
	assert.equal(attachment.id, 'u1');
	assert.equal(attachment.url, 'https://cdn/cat.png');
});

// FILE V2

test('file: upload with expiration, list paging, content and delete', async () => {
	const rawFile = {
		id: 'file-1',
		object: 'file',
		bytes: 3,
		created_at: 1767225600,
		filename: 'a.txt',
		purpose: 'user_data',
	};
	route('POST /filesv2', () => [200, rawFile]);
	route('GET /filesv2', () => [
		200,
		{
			object: 'list',
			data: [rawFile, { ...rawFile, id: 'file-2' }],
			first_id: 'file-1',
			last_id: 'file-2',
			has_more: true,
		},
	]);
	route('GET /filesv2/file-1/content', () => Buffer.from('abc'));
	route('DELETE /filesv2/file-1', () => [200, { id: 'file-1', object: 'file', deleted: true }]);

	const fs = client();
	const file = await fs.file.upload(
		{ data: Buffer.from('abc'), name: 'a.txt' },
		{ anchor: 'created_at', seconds: 3600 },
	);
	const upload = last('POST', '/filesv2');
	assert.equal(upload.query.get('expires_after[anchor]'), 'created_at');
	assert.equal(upload.query.get('expires_after[seconds]'), '3600');
	assert.match(upload.body, /name="file"; filename="a\.txt"/);
	assert.ok(file instanceof StoredFile);
	assert.equal(file.id, 'file-1');
	assert.equal(file.createdAt, '2026-01-01T00:00:00.000Z');

	const page = await fs.file.list(2, 'file-0');
	const query = last('GET', '/filesv2').query;
	assert.equal(query.get('limit'), '2');
	assert.equal(query.get('after'), 'file-0');
	assert.equal(page.list.length, 2);
	assert.equal(page.next, 'file-2');

	const content = await fs.file.content('file-1');
	assert.equal(content.toString(), 'abc');

	assert.equal(await fs.file.delete('file-1'), true);
	assert.ok(last('DELETE', '/filesv2/file-1'));
});

// TRANSCRIPT

test('transcript: upload, details and wait until completed', async () => {
	let polls = 0;
	route('POST /transcript/upload', () => [200, { uuid: 't1', status: 'PENDING', createdAt: '2026-01-01T00:00:00Z' }]);
	route('GET /transcript/t1', () => {
		polls++;
		return [
			200,
			polls < 3
				? { uuid: 't1', status: 'PROCESSING' }
				: { uuid: 't1', status: 'COMPLETED', transcriptText: 'Bonjour', languageCode: 'fr' },
		];
	});

	const fs = client();
	const created = await fs.transcript.upload({ data: Buffer.from('ID3'), name: 'talk.mp3', type: 'audio/mpeg' });
	assert.match(last('POST', '/transcript/upload').body, /name="file"; filename="talk\.mp3"/);
	assert.equal(created.id, 't1');
	assert.equal(created.status, TranscriptStatus.PENDING);

	const details = await fs.transcript.details('t1');
	assert.equal(details.status, TranscriptStatus.PROCESSING);

	const done = await fs.transcript.wait('t1', { interval: 5, timeout: 5000 });
	assert.equal(done.status, TranscriptStatus.COMPLETED);
	assert.equal(done.text, 'Bonjour');
	assert.equal(polls, 3);
});

test('transcript: wait times out', async () => {
	route('GET /transcript/t2', () => [200, { uuid: 't2', status: 'PROCESSING' }]);

	await assert.rejects(client().transcript.wait('t2', { interval: 5, timeout: 20 }), /not finished/);
});

// SKILL

test('skill: create with two files, list, set default version and download', async () => {
	const rawSkill = {
		id: 'sk1',
		object: 'skill',
		name: 'pdf',
		default_version: 1,
		latest_version: 2,
		created_at: 1767225600,
	};
	route('POST /skills', () => [200, rawSkill]);
	route('GET /skills', () => [
		200,
		{ object: 'list', data: [rawSkill], first_id: 'sk1', last_id: 'sk1', has_more: false },
	]);
	route('POST /skills/sk1', (r) => [200, { ...rawSkill, default_version: jsonBody(r).default_version }]);
	route('GET /skills/sk1/content', () => Buffer.from('PK\x03\x04', 'latin1'));

	const fs = client();
	const skill = await fs.skill.create(
		[
			{ data: Buffer.from('# Skill'), name: 'SKILL.md' },
			{ data: Buffer.from('print(1)'), name: 'run.py' },
		],
		['a', 'b'],
	);
	const create = last('POST', '/skills');
	assert.equal(countParts(create, 'files'), 2);
	assert.match(create.body, /filename="SKILL\.md"/);
	assert.match(create.body, /filename="run\.py"/);
	assert.deepEqual(create.query.getAll('flags'), ['a', 'b']);
	assert.ok(skill instanceof Skill);
	assert.equal(skill.defaultVersion, '1');
	assert.equal(skill.createdAt, '2026-01-01T00:00:00.000Z');

	const page = await fs.skill.list(10);
	assert.equal(last('GET', '/skills').query.get('limit'), '10');
	assert.equal(page.list[0].id, 'sk1');
	assert.equal(page.next, '');

	const updated = await fs.skill.setDefaultVersion('sk1', '2');
	assert.deepEqual(jsonBody(last('POST', '/skills/sk1')), { default_version: '2' });
	assert.equal(updated.defaultVersion, '2');

	const zip = await fs.skill.content('sk1');
	assert.equal(zip.subarray(0, 2).toString(), 'PK');
});

// MCP

test('mcp: create, update with clearHeaders and complete OAuth', async () => {
	const rawServer = {
		id: 'mcp1',
		object: 'mcp_server',
		server_label: 'docs',
		server_url: 'https://mcp.example.com',
		allowed_tools: ['search'],
		available_tools: [{ name: 'search', description: 'Search', input_schema: {} }],
		enabled: true,
		has_authorization: true,
		created_at: '2026-01-01T00:00:00Z',
	};
	route('POST /mcp/servers', () => [200, rawServer]);
	route('POST /mcp/servers/mcp1', () => [200, { ...rawServer, enabled: false }]);
	route('POST /mcp/servers/oauth/complete', () => [200, { ...rawServer, oauth_status: 'authorized' }]);

	const fs = client();
	const created = await fs.mcp.create({
		label: 'docs',
		url: 'https://mcp.example.com',
		allowedTools: ['search'],
		headers: { 'X-Key': 'k' },
		requireApproval: 'never',
	});
	assert.deepEqual(jsonBody(last('POST', '/mcp/servers')), {
		server_label: 'docs',
		server_url: 'https://mcp.example.com',
		allowed_tools: ['search'],
		headers: { 'X-Key': 'k' },
		require_approval: 'never',
	});
	assert.ok(created instanceof McpServer);
	assert.equal(created.label, 'docs');
	assert.equal(created.url, 'https://mcp.example.com');
	assert.equal(created.availableTools[0].name, 'search');
	assert.equal(created.hasAuthorization, true);

	const updated = await fs.mcp.update('mcp1', { enabled: false, clearHeaders: true });
	assert.deepEqual(jsonBody(last('POST', '/mcp/servers/mcp1')), { enabled: false, clear_headers: true });
	assert.equal(updated.enabled, false);

	const completed = await fs.mcp.completeOAuth({ code: 'abc', state: 'xyz' });
	assert.deepEqual(jsonBody(last('POST', '/mcp/servers/oauth/complete')), { code: 'abc', state: 'xyz' });
	assert.equal(completed.oauthStatus, 'authorized');
});
