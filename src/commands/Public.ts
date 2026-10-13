import { Command, createCommand } from 'commander';

import { FranceStudent } from '../FranceStudent';
import { output } from '../helper/CliUtils';

/**
 * Creates a new 'public' command which uses the given FranceStudent instance.
 *
 * @param fs - The FranceStudent instance to use.
 * @returns The created 'public' command.
 */
function createPublicCommand(fs: FranceStudent): Command {
	// Creating the 'public' command
	const publicCommand = createCommand('public').description('Access public resources (no authentication needed)');

	// Status
	publicCommand
		.command('status')
		.description('Fetch the health status of the application and the public alerts')
		.action(async () => {
			try {
				const [health, alerts] = await Promise.all([fs.public.health(), fs.public.alerts()]);

				output({ health: health, alerts: alerts.alerts ?? [] });
			} catch (error) {
				output(error);
			}
		});

	// Health
	publicCommand
		.command('health')
		.description('Fetch the health status of the application')
		.action(async () => {
			try {
				output(await fs.public.health());
			} catch (error) {
				output(error);
			}
		});

	// Alerts
	publicCommand
		.command('alerts')
		.description('Fetch the public alerts')
		.action(async () => {
			try {
				output(await fs.public.alerts());
			} catch (error) {
				output(error);
			}
		});

	return publicCommand;
}

export default createPublicCommand;
