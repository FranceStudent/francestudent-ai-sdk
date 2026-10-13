import { writeFile } from 'fs/promises';

import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output, parseInteger } from '../helper/CliUtils';

type TranscriptUploadOptions = {
	wait?: boolean;
	timeout?: number;
};

/**
 * Creates a new 'transcript' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'transcript' command.
 */
function createTranscriptCommand(fs: FranceStudent): Command {
	// Creating the 'transcript' command
	const transcript = createCommand('transcript').description('Access resources related to audio transcriptions');

	// Upload
	transcript
		.command('upload')
		.description('Upload an audio file (MP3) to transcribe')
		.argument('<path>', 'The path to the local MP3 file')
		.option('-w, --wait', 'Wait for the transcription to complete')
		.option('-t, --timeout <ms>', 'The maximum time to wait, in milliseconds', parseInteger)
		.action(async (path: string, options: TranscriptUploadOptions) => {
			try {
				const created = await fs.transcript.upload(path);

				output(options.wait ? await fs.transcript.wait(created.id, { timeout: options.timeout }) : created);
			} catch (error) {
				output(error);
			}
		});

	// List
	transcript
		.command('list')
		.description('List the transcriptions of the user')
		.action(async () => {
			try {
				output(await fs.transcript.list());
			} catch (error) {
				output(error);
			}
		});

	// Details
	transcript
		.command('details')
		.description('Fetch the details of a transcription, including its text')
		.argument('<id>', 'The ID of the transcription')
		.action(async (id: string) => {
			try {
				output(await fs.transcript.details(id));
			} catch (error) {
				output(error);
			}
		});

	// Wait
	transcript
		.command('wait')
		.description('Wait for a transcription to complete')
		.argument('<id>', 'The ID of the transcription')
		.option('-t, --timeout <ms>', 'The maximum time to wait, in milliseconds', parseInteger)
		.action(async (id: string, options: { timeout?: number }) => {
			try {
				output(await fs.transcript.wait(id, { timeout: options.timeout }));
			} catch (error) {
				output(error);
			}
		});

	// Audio
	transcript
		.command('audio')
		.description('Download the audio file of a transcription')
		.argument('<id>', 'The ID of the transcription')
		.argument('[output]', 'The path to write the audio to (stdout if not set)')
		.action(async (id: string, path?: string) => {
			try {
				const audio = await fs.transcript.audio(id);

				if (path) {
					await writeFile(path, audio);
					output('OK');
				} else {
					process.stdout.write(audio);
				}
			} catch (error) {
				output(error);
			}
		});

	return transcript;
}

export default createTranscriptCommand;
