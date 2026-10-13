/**
 * Represents the raw health check of a single component.
 *
 * @public
 */
export interface IHealthCheck {
	status?: string;
	message?: string;
	responseTimeMs?: number;
	avgResponseTimeMs5m?: number;
	samples5m?: number;
}

/**
 * Represents the raw health status of the application.
 *
 * @public
 */
export interface IPublicHealth {
	checkedAt?: string;
	status?: string;
	app?: IHealthCheck;
	database?: IHealthCheck;
	redis?: IHealthCheck;
	webdav?: IHealthCheck;
	jaeger?: IHealthCheck;
}

/**
 * Represents a raw public alert.
 *
 * @public
 */
export interface IAlert {
	id: string;
	type?: string;
	severity?: string;
	title?: string;
	message?: string;
	placements?: string[];
	dismissible?: boolean;
	dismissalKey?: string;
	updatedAt?: string;
}

/**
 * Represents the raw list of public alerts.
 *
 * @public
 */
export interface IPublicAlerts {
	alerts: IAlert[];
}
