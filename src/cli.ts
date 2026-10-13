#! /usr/bin/env node

import { createCommand } from 'commander';

import attachment from './commands/Attachment';
import auth from './commands/Auth';
import chat from './commands/Chat';
import file from './commands/File';
import mcp from './commands/Mcp';
import memory from './commands/Memory';
import message from './commands/Message';
import project from './commands/Project';
import publicCommand from './commands/Public';
import skill from './commands/Skill';
import transcript from './commands/Transcript';
import user from './commands/User';
import { FranceStudent } from './FranceStudent';

// Creating a new commandline program
const Program = createCommand('fsai')
	.description('A CLI tool for accessing the FranceStudent AI API')
	.passThroughOptions()
	.enablePositionalOptions();

// Adding options
Program.option('-s, --session <string>', 'The session token to use for authentication (or FS_SESSION_TOKEN)')
	.option('-a, --access-token <string>', 'An access token (JWT) to use directly (or FS_ACCESS_TOKEN)')
	.option('--device-id <string>', 'The device ID to send (or FS_DEVICE_ID)')
	.option('--api-url <string>', 'The base URL of the API (or FS_API_URL)')
	.option('--origin <string>', 'The origin of the web application (or FS_ORIGIN)')
	.option('-l, --log', 'Enable logging to console')
	.option('-p, --proxy <string>', 'The URL to the proxy to use')
	.option('-t, --timeout <number>', 'The timout (in milli-seconds) to use for requests')
	.option('-r, --retries <number>', 'The maximum number of retries to use on transient errors')
	.option('-d, --delay <number>', 'The delay in milliseconds to use in-between successive requests');

// Parsing the global options only, the sub-commands are not known yet
Program.parseOptions(process.argv.slice(2));

/** The supplied options. */
const Options = Program.opts<{
	session?: string;
	accessToken?: string;
	deviceId?: string;
	apiUrl?: string;
	origin?: string;
	log?: boolean;
	proxy?: string;
	timeout?: string;
	retries?: string;
	delay?: string;
}>();

// Initializing FranceStudent instance using the given options
const FranceStudentInstance = new FranceStudent({
	sessionToken: Options.session ?? process.env.FS_SESSION_TOKEN,
	accessToken: Options.accessToken ?? process.env.FS_ACCESS_TOKEN,
	deviceId: Options.deviceId ?? process.env.FS_DEVICE_ID,
	apiUrl: Options.apiUrl ?? process.env.FS_API_URL,
	origin: Options.origin ?? process.env.FS_ORIGIN,
	logging: Options.log ? true : false,
	proxy: Options.proxy,
	timeout: Options.timeout ? Number(Options.timeout) : undefined,
	maxRetries: Options.retries ? Number(Options.retries) : undefined,
	delay: Options.delay ? Number(Options.delay) : undefined,
});

// Adding sub-commands
Program.addCommand(attachment(FranceStudentInstance));
Program.addCommand(auth(FranceStudentInstance));
Program.addCommand(chat(FranceStudentInstance));
Program.addCommand(file(FranceStudentInstance));
Program.addCommand(mcp(FranceStudentInstance));
Program.addCommand(memory(FranceStudentInstance));
Program.addCommand(message(FranceStudentInstance));
Program.addCommand(project(FranceStudentInstance));
Program.addCommand(publicCommand(FranceStudentInstance));
Program.addCommand(skill(FranceStudentInstance));
Program.addCommand(transcript(FranceStudentInstance));
Program.addCommand(user(FranceStudentInstance));

// Finalizing the CLI
Program.parse();
