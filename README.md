# francestudent-ai-sdk

An unofficial SDK and CLI tool for the [FranceStudent AI](https://ia.francestudent.org) API (`api.francestudent.ai`).

> **Disclaimer**
>
> - This SDK is **not official**. It is built from the public OpenAPI specification (https://api.francestudent.ai/v3/api-docs) and from the observed behaviour of the web application. The API may change at any time without notice.
> - The fields of **Files v2** and **Skills** are typed as plain objects in the specification; they are inferred from the OpenAI-compatible format and may be incomplete.
> - Make sure your usage complies with the terms of service of FranceStudent.

## Prerequisites

- NodeJS 22 or 24
- A FranceStudent account

## Installation

To use it from the CLI, install the package globally:

1. Open a terminal.
2. Install the package using the command `npm install -g francestudent-ai-sdk`.
3. Check that it is installed correctly using the command `fsai help`.

To use it in your own project, install it as a dependency: `npm install francestudent-ai-sdk`.

## Authentication

Authentication works the same way as in the browser:

1. The browser holds a long-lived **session token**: the `next-auth.session-token` cookie of `ia.francestudent.org`.
2. The SDK exchanges it for a short-lived **access token** (JWT) by calling `GET https://ia.francestudent.org/api/auth/api-token`.
3. The access token is sent to the API in the `Authorization: Bearer ...` header.

There is no refresh token: the SDK requests a new access token automatically **60 s before it expires**, and **after any `401` response** (the request is then retried once). Concurrent requests share a single renewal.

> **The session token gives full access to the account.** Never share it, never commit it (keep it in a `.env` file ignored by git).

### Getting the session token

1. Log in on https://ia.francestudent.org.
2. Open the developer tools (`F12`), then:
    - Chrome / Edge: _Application_ tab → _Storage_ → _Cookies_ → `https://ia.francestudent.org`.
    - Firefox: _Storage_ tab → _Cookies_ → `https://ia.francestudent.org`.
3. Copy the value of the `next-auth.session-token` cookie.

A full `Cookie` header (`name=value; ...`) is also accepted: the session cookie is extracted from it.

### Renewed session tokens

The server may renew the session cookie while issuing access tokens. The SDK then uses the new value, and calls `onSessionUpdate` so that you can persist it:

```ts
const fs = new FranceStudent({
	sessionToken: process.env.FS_SESSION_TOKEN,
	onSessionUpdate: async (sessionToken) => saveSomewhere(sessionToken),
});
```

The current value is also available as `fs.sessionToken`.

### Access token only

An access token (JWT) can be given directly with the `accessToken` option. It is used as is until it expires, and **cannot be renewed** without a session token.

### Email and password

```ts
const fs = new FranceStudent();

// Logs in, and uses the session for this instance
const sessionToken = await fs.login('EMAIL', 'PASSWORD');
```

Or from the CLI: `fsai auth login [email]` (prompts for the password, or reads `FS_EMAIL` / `FS_PASSWORD`), which prints the session token.

The login runs the OAuth flow of the web application (Auth.js with the WHMCS provider of `my.francestudent.org`): the login form is read dynamically and an authorization page, if any, is accepted. The password is only kept in memory during the login; it is neither logged nor stored. It is **not supported** (a clear `AuthenticationError` is thrown) when:

- the login page requires a captcha,
- the account uses two-factor authentication,
- Cloudflare blocks the request.

In these cases, use a session token copied from the browser.

## Usage as a dependency

```ts
import { FranceStudent } from 'francestudent-ai-sdk';

const fs = new FranceStudent({ sessionToken: process.env.FS_SESSION_TOKEN });

// The authenticated user
const user = await fs.user.details();

// The available agents (models)
const agents = await fs.chat.agents();

// The 20 most recent chats, then the next batch
const page = await fs.chat.list(20);
const next = await fs.chat.list(20, page.next);
```

### Chatting

Chat responses are streamed (Server-Sent Events).

**Waiting for the complete response**, optionally printing it as it arrives:

```ts
const response = await fs.chat.ask(
	{ agentId: -1002, content: 'Bonjour !', enableWebSearch: false },
	{ onDelta: (delta) => process.stdout.write(delta) },
);

console.log(response.chatId, response.content);

// Continuing the same chat
const answer = await fs.chat.reply(response.chatId!, { content: 'Et en anglais ?' });
```

**Iterating over the events of the stream**:

```ts
const stream = await fs.chat.stream({ agentId: -1002, content: 'Raconte une blague' });

for await (const event of stream) {
	if (event.delta) {
		process.stdout.write(event.delta);
	}
}

console.log(stream.chatId, stream.text);
```

- `fs.chat.send(chatId, message)` streams the answer to a message sent to an existing chat.
- `fs.chat.attach(chatId, lastEventId?)` attaches to the stream of a chat whose answer is still being generated.
- `stream.abort()` (or an `AbortSignal` passed as `{ signal }`) stops receiving the stream; `fs.chat.cancel(chatId)` stops the generation on the server.
- Files and images are attached with their IDs: `files` takes IDs of stored files (`fs.file.upload()`), `images` takes IDs of attachments (`fs.attachment.upload()`).

### Known agents

These agent IDs were observed in a network capture. **They may change: use `fs.chat.agents()` / `fsai chat agents` to get the current list.**

| Agent ID | Name             |
| -------- | ---------------- |
| -1002    | GPT 6 Luna       |
| -1003    | GPT 6.1 Sol      |
| -2002    | Claude Haiku 5.5 |
| -2001    | Claude Opus 5.5  |

### Errors

| Error                 | When                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FranceStudentError`  | The API responded with an error. `status` is the HTTP status, `body` the raw response body, `resetAt` the reset date of a rate limit or chat budget, when the message has one. |
| `AuthenticationError` | Login or access token renewal failed, or no credentials were given. `needsLogin` tells whether a new login (or session token) is required.                                     |
| `StreamError`         | A chat stream reported a failure. `details` holds the raw payload.                                                                                                             |

A custom `errorHandler` can be set in the configuration to process errors differently.

### Raw access

Every endpoint is identified by a `ResourceType`. The `FetcherService` sends the request (with authentication, retries and error handling) and returns the raw Axios response:

```ts
import { FetcherService, FranceStudentConfig, ResourceType } from 'francestudent-ai-sdk';

const fetcher = new FetcherService(new FranceStudentConfig({ sessionToken: process.env.FS_SESSION_TOKEN }));

const response = await fetcher.request(ResourceType.USER_USAGE, {});
console.log(response.data);
```

Each model also exposes the raw data it was built from with its `raw` getter, and raw types are exported with an `IRaw` prefix.

## Usage as a CLI tool

```sh
# Using an environment variable
export FS_SESSION_TOKEN='...'
fsai user details

# Or an option
fsai --session '...' chat agents

# Asking a question (streamed), then continuing the chat
fsai chat ask "Bonjour !" --agent -1002
fsai chat ask "Et en anglais ?" --chat CHAT_ID

# Help on any command
fsai help chat
fsai chat ask --help
```

Global options (before the command):

| Option                        | Environment variable | Description                                            |
| ----------------------------- | -------------------- | ------------------------------------------------------ |
| `-s, --session <string>`      | `FS_SESSION_TOKEN`   | The session token                                      |
| `-a, --access-token <string>` | `FS_ACCESS_TOKEN`    | An access token (JWT) to use directly                  |
| `--device-id <string>`        | `FS_DEVICE_ID`       | The device ID to send (random for each run if not set) |
| `--api-url <string>`          | `FS_API_URL`         | The base URL of the API                                |
| `--origin <string>`           | `FS_ORIGIN`          | The origin of the web application                      |
| `-l, --log`                   |                      | Enable debug logs                                      |
| `-p, --proxy <string>`        |                      | The URL of the proxy to use                            |
| `-t, --timeout <number>`      |                      | The timeout (ms) of requests                           |
| `-r, --retries <number>`      |                      | The maximum number of retries on transient errors      |
| `-d, --delay <number>`        |                      | The delay (ms) between successive requests             |

`fsai auth login` also reads `FS_EMAIL` and `FS_PASSWORD`.

Output is JSON (or plain text). Errors are written to stderr, with a non-zero exit code. Destructive commands affecting everything (`user delete`, `user logout --all`, `memory delete --all`, `project delete`) require `--yes`.

## Configuration

`new FranceStudent(config)` accepts:

| Option                   | Description                                                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionToken`           | The `next-auth.session-token` cookie value (or a full cookie string).                                                                                                                                                                   |
| `accessToken`            | An access token (JWT) to use directly; not renewable.                                                                                                                                                                                   |
| `deviceId`               | The device ID sent with each request (`francestudent-device-id`). A random UUID is generated if not set.                                                                                                                                |
| `apiUrl`                 | The base URL of the API. Defaults to `https://api.francestudent.ai`.                                                                                                                                                                    |
| `origin`                 | The origin of the web application, used for authentication. Defaults to `https://ia.francestudent.org`.                                                                                                                                 |
| `clientVersion`          | The client version sent with each request (`francestudent-client-version`).                                                                                                                                                             |
| `clientPlatform`         | The client platform sent with each request. Defaults to `web_fs_ai`.                                                                                                                                                                    |
| `userAgent`              | The User-Agent sent with each request (a browser one by default; required to get through Cloudflare).                                                                                                                                   |
| `headers`                | Custom headers added to all requests.                                                                                                                                                                                                   |
| `proxy`                  | A proxy URL (`http(s)://`, `socks://`) or an Axios proxy configuration.                                                                                                                                                                 |
| `timeout`                | The timeout (ms) of requests. Chat streams use the `stream*Timeout` options instead.                                                                                                                                                    |
| `logging`                | Whether to write debug logs to the console.                                                                                                                                                                                             |
| `delay`                  | The delay (ms) between requests, or a function returning it.                                                                                                                                                                            |
| `maxRetries`             | The maximum number of retries on transient errors (with backoff). Defaults to `0`. `POST`/`PATCH` requests are only retried when they certainly did not reach the server, or on `429`/`503`; an exhausted chat budget is never retried. |
| `streamFirstByteTimeout` | The max wait (ms) for the response of a chat stream to start. Defaults to `60000`, `0` disables it.                                                                                                                                     |
| `streamIdleTimeout`      | The max time (ms) without any data during a chat stream. Defaults to `90000`, `0` disables it.                                                                                                                                          |
| `streamTimeout`          | The max total duration (ms) of a chat stream. Defaults to `310000`, `0` disables it.                                                                                                                                                    |
| `errorHandler`           | A custom error handler.                                                                                                                                                                                                                 |
| `responseMiddleware`     | A function called with each successful response.                                                                                                                                                                                        |
| `onSessionUpdate`        | A function called with the new session token when the server renews it.                                                                                                                                                                 |
| `fetch`                  | A custom `fetch` implementation (switches Axios to its fetch adapter; email/password login may not work).                                                                                                                               |

The `sessionToken`, `accessToken`, `headers` and `proxy` can also be changed on an existing instance. `fs.token()` returns a valid access token and its expiration date.

## Features

| Service         | Methods                                                                                                                                                                                                                                                                                                                                                                                                       | CLI command  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `fs.chat`       | `agents`, `models`, `list`, `archived`, `search`, `details`, `usage`, `ask`, `stream`, `reply`, `send`, `attach`, `cancel`, `update`, `pin`, `unpin`, `archive`, `restore`, `download`, `delete`, `deleteAll`, `share`, `shares`, `updateShare`, `unshare`, `importOpenAi`                                                                                                                                    | `chat`       |
| `fs.message`    | `edit` (forks the chat), `vote`, `save`, `unsave`, `saved`, `image` (generated images)                                                                                                                                                                                                                                                                                                                        | `message`    |
| `fs.project`    | `list`, `shared`, `details`, `create`, `update`, `delete`, `chats`, `addChat`, `removeChat`, `shares`, `share`, `unshare`                                                                                                                                                                                                                                                                                     | `project`    |
| `fs.user`       | `details`, `update`, `updateProfile`, `delete`, `instructions`, `updateInstructions`, `notificationPreferences`, `updateNotificationPreferences`, `usage`, `tokenUsage`, `chatBudget`, `credits`, `activatePowerUp`, `sessions`, `terminateSession`, `terminateAllSessions`, `flags`, `pets`, `invite`, `registerBeta`, `webSearchDomains`, `updateWebSearchDomains`, `webSearchAudit`, `safetyHub`, `appeal` | `user`       |
| `fs.memory`     | `list`, `details`, `delete`, `deleteAll`                                                                                                                                                                                                                                                                                                                                                                      | `memory`     |
| `fs.file`       | Files v2 (IDs used in `files`): `upload`, `list`, `details`, `content`, `delete`, `usage`, `mimeTypes`                                                                                                                                                                                                                                                                                                        | `file`       |
| `fs.attachment` | Files v1 (IDs used in `images`): `upload`, `list`, `details`, `delete`                                                                                                                                                                                                                                                                                                                                        | `attachment` |
| `fs.transcript` | `upload` (MP3), `list`, `details`, `wait` (polls until completed), `audio`                                                                                                                                                                                                                                                                                                                                    | `transcript` |
| `fs.skill`      | `list`, `details`, `create`, `delete`, `content` (ZIP), `versions`, `version`, `createVersion`, `setDefaultVersion`, `deleteVersion`                                                                                                                                                                                                                                                                          | `skill`      |
| `fs.mcp`        | `list`, `details`, `create`, `update`, `delete`, `discover`, `startOAuth`, `completeOAuth`                                                                                                                                                                                                                                                                                                                    | `mcp`        |
| `fs.public`     | `health`, `alerts` (no authentication needed)                                                                                                                                                                                                                                                                                                                                                                 | `public`     |

Upload methods of `fs.file`, `fs.attachment` and `fs.transcript` accept a local path or `{ data, name, type? }`; `fs.skill` accepts a list of `{ data, name, type? }`.

### Not covered

These endpoints of the specification are intentionally left out, as they only make sense inside the web application or are not meant for users:

- push subscriptions and VAPID key (`/user/push/...`),
- surveys (`/user/@me/survey`) and feedback experiences (`/user/@me/feedback-experiences/...`),
- ads challenges (`/ads/...`),
- passkeys (`/user/passkeys/...`), which require WebAuthn in a browser,
- metrics (`/metrics`, `/metrics/chat-streams`), staff access (`/auth/staff`), landing and error endpoints (`/`, `/error`),
- `DELETE /user/chats`, a duplicate of `DELETE /chats` (`fs.chat.deleteAll()`).

## Development

```sh
npm install        # installs and builds (dist/)
npm run build      # compiles TypeScript
npm test           # builds, then runs the tests (node:test, with a mock server)
npm run lint       # eslint --fix
npm run format     # prettier --write
npm run docs       # typedoc
```

The `playground/` directory contains a small script using the local build (see `playground/README.md`).

The code follows the structure of Rettiwt-API: each endpoint is a `ResourceType`, built by a request builder (`src/requests`), sent by the `FetcherService`, and deserialized by an extractor (`src/collections/Extractors.ts`) into a model (`src/models/data`), exposed by a service (`src/services/public`) and a CLI command (`src/commands`).

## Credits

- The project structure is inspired by [Rettiwt-API](https://github.com/Rishikant181/Rettiwt-API).
- The authentication flow (session cookie, access tokens, client headers, email/password login) comes from [project-frstcli](https://github.com/10hecone/project-frstcli).
