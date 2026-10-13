import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { FranceStudentConfig } from '../../models/FranceStudentConfig';
import { IPublicAlerts, IPublicHealth } from '../../types/raw/base/Public';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with public resources, which do not require authentication.
 *
 * @public
 */
export class PublicService extends FetcherService {
	/**
	 * @param config - The config object for configuring the FranceStudent instance.
	 *
	 * @internal
	 */
	public constructor(config: FranceStudentConfig) {
		super(config);
	}

	/**
	 * Get the public alerts (maintenance, incidents, ...).
	 *
	 * @returns The public alerts.
	 */
	public async alerts(): Promise<IPublicAlerts> {
		const resource = ResourceType.PUBLIC_ALERTS;

		// Fetching raw alerts
		const response = await this.request<IPublicAlerts>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}

	/**
	 * Get the health status of the application.
	 *
	 * @returns The health status.
	 *
	 * @example
	 *
	 * ```ts
	 * import { FranceStudent } from 'francestudent-ai-sdk';
	 *
	 * // Creating a new FranceStudent instance, no authentication needed
	 * const fs = new FranceStudent();
	 *
	 * // Fetching the health status
	 * fs.public.health()
	 * .then(res => {
	 * 	console.log(res.status);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async health(): Promise<IPublicHealth> {
		const resource = ResourceType.PUBLIC_HEALTH;

		// Fetching raw health status
		const response = await this.request<IPublicHealth>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response.data);

		return data;
	}
}
