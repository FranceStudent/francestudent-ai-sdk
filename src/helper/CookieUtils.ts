import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

/**
 * A minimal cookie jar: cookie name to value, for a single host.
 *
 * @internal
 */
export type CookieJar = Map<string, string>;

/**
 * Serializes the given jar into the value of a `Cookie` header.
 *
 * @param jar - The cookie jar.
 *
 * @returns The value of the `Cookie` header.
 *
 * @internal
 */
export function toCookieHeader(jar: CookieJar): string {
	return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}

/**
 * Stores the cookies set by a response into the given jar, dropping the expired ones.
 *
 * @param headers - The headers of the response.
 * @param jar - The cookie jar to update.
 *
 * @internal
 */
export function captureCookies(headers: RawAxiosResponseHeaders | AxiosResponseHeaders, jar: CookieJar): void {
	const raw = headers['set-cookie'] as string[] | string | undefined;
	const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

	for (const cookie of list) {
		const [pair, ...attributes] = cookie.split(';');
		const separator = pair.indexOf('=');

		if (separator <= 0) {
			continue;
		}

		const name = pair.slice(0, separator).trim();
		const value = pair.slice(separator + 1).trim();
		const attrs = attributes.map((item) => item.trim());
		const maxAge = attrs.find((item) => /^max-age=/i.test(item));
		const expires = attrs.find((item) => /^expires=/i.test(item));

		const isExpired =
			!value ||
			(maxAge !== undefined && Number(maxAge.split('=')[1]) <= 0) ||
			(expires !== undefined && Date.parse(expires.slice(expires.indexOf('=') + 1)) < Date.now());

		if (isExpired) {
			jar.delete(name);
		} else {
			jar.set(name, value);
		}
	}
}
