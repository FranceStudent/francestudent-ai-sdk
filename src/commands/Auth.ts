import { createInterface, Interface } from 'readline';
import { Writable } from 'stream';

import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output } from '../helper/CliUtils';

/**
 * Reads answers to prompts, from the terminal or from piped stdin.
 *
 * @remarks
 * <br>
 * - A single reader is used for all the prompts, so that piped input is not lost between them.
 * - Prompts are only printed (to stderr) when stdin is a terminal; answers to secret prompts are never echoed.
 */
class Prompter {
	/** Whether stdin is a terminal. */
	private readonly _isTty: boolean;

	/** The lines read but not consumed yet. */
	private readonly _lines: string[] = [];

	/** The underlying readline interface. */
	private readonly _rl: Interface;

	/** Whether stdin has ended. */
	private _isClosed = false;

	/** Whether the typed characters are currently hidden. */
	private _isMuted = false;

	/** The pending prompt, waiting for a line. */
	private _pending?: (line: string | undefined) => void;

	public constructor() {
		this._isTty = Boolean(process.stdin.isTTY);

		// Writing prompts to stderr, hiding the typed characters of secrets
		const echo = new Writable({
			write: (chunk: Buffer, encoding, callback): void => {
				if (this._isTty && !this._isMuted) {
					process.stderr.write(chunk, encoding);
				}
				callback();
			},
		});

		this._rl = createInterface({ input: process.stdin, output: echo, terminal: this._isTty });
		this._rl.on('line', (line) => {
			if (this._pending) {
				const resolve = this._pending;

				this._pending = undefined;
				resolve(line);
			} else {
				this._lines.push(line);
			}
		});
		this._rl.on('close', () => {
			this._isClosed = true;
			this._pending?.(undefined);
			this._pending = undefined;
		});
	}

	/**
	 * Asks a question.
	 *
	 * @param question - The question.
	 * @param isSecret - Whether to hide the answer.
	 *
	 * @returns The answer, or an empty string if stdin has ended.
	 */
	public async ask(question: string, isSecret = false): Promise<string> {
		if (this._isTty) {
			process.stderr.write(question);
		}

		this._isMuted = isSecret;

		const line =
			this._lines.length > 0
				? this._lines.shift()
				: this._isClosed
					? undefined
					: await new Promise<string | undefined>((resolve) => (this._pending = resolve));

		this._isMuted = false;

		if (isSecret && this._isTty) {
			process.stderr.write('\n');
		}

		return (line ?? '').trim();
	}

	/**
	 * Releases stdin.
	 */
	public close(): void {
		this._rl.close();
	}
}

/**
 * Creates a new 'auth' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'auth' command.
 */
function createAuthCommand(fs: FranceStudent): Command {
	// Creating the 'auth' command
	const auth = createCommand('auth').description('Manage authentication');

	// Login
	auth.command('login')
		.description(
			'Log in with an email address and a password, and print the session token (to use with FS_SESSION_TOKEN)',
		)
		.argument('[email]', 'The email address of the account (or FS_EMAIL)')
		.action(async (email?: string) => {
			let prompter: Prompter | undefined = undefined;

			try {
				const login = email ?? process.env.FS_EMAIL ?? (await (prompter ??= new Prompter()).ask('Email: '));
				const password =
					process.env.FS_PASSWORD ?? (await (prompter ??= new Prompter()).ask('Password: ', true));

				prompter?.close();
				output(await fs.login(login, password));
			} catch (error) {
				output(error);
			} finally {
				prompter?.close();
			}
		});

	// Token
	auth.command('token')
		.description('Print a valid access token (JWT), obtained from the session token')
		.option('-f, --force', 'Renew the token even if the current one is still valid')
		.action(async (options?: { force?: boolean }) => {
			try {
				output(await fs.token(options?.force));
			} catch (error) {
				output(error);
			}
		});

	return auth;
}

export default createAuthCommand;
