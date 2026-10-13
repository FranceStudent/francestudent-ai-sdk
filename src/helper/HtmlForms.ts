/*
 * Minimal, dependency-free parsing of the forms of an HTML page.
 * Used by the WHMCS log in: the form containing a password field is located, its hidden
 * fields (CSRF token, ...) are kept, and it is submitted.
 */

/**
 * A single input field of a form.
 *
 * @internal
 */
export interface IHtmlField {
	name: string;
	id: string;
	type: string;
	value: string;
	checked: boolean;
	disabled: boolean;
}

/**
 * A single button of a form.
 *
 * @internal
 */
export interface IHtmlButton {
	name: string;
	value: string;
	type: string;
	label: string;
}

/**
 * A single form of a page.
 *
 * @internal
 */
export interface IHtmlForm {
	/** The absolute URL the form is submitted to. */
	action: string;

	/** The HTTP method, upper case. */
	method: string;

	fields: IHtmlField[];
	buttons: IHtmlButton[];

	/** The visible text of the form. */
	text: string;
}

/**
 * A log in form, with its identifier and password fields.
 *
 * @internal
 */
export interface ILoginForm {
	form: IHtmlForm;
	username: IHtmlField;
	password: IHtmlField;
}

/**
 * An OAuth consent form, with the button that accepts.
 *
 * @internal
 */
export interface IConsentForm {
	form: IHtmlForm;
	accept: { name: string; value: string; label: string };
}

const ENTITIES: { [key: string]: string } = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// An opening tag, tolerating a ">" inside a quoted value
const TagBody = `(?:"[^"]*"|'[^']*'|[^'">])*`;

const VisibleTextTypes = new Set(['text', 'email', 'tel', '']);

const ConsentLabel = /autoris|authori[sz]e|approve|allow|accepter|accept/i;

/**
 * Decodes the HTML entities of the given text.
 *
 * @param text - The text to decode.
 *
 * @returns The decoded text.
 *
 * @internal
 */
export function decodeEntities(text: string): string {
	return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match: string, entity: string) => {
		if (entity.startsWith('#')) {
			const isHex = entity[1].toLowerCase() === 'x';
			const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);

			try {
				return String.fromCodePoint(code);
			} catch {
				return match;
			}
		}

		return ENTITIES[entity.toLowerCase()] ?? match;
	});
}

function stripNoise(html: string): string {
	return String(html)
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, '');
}

function textOf(html: string): string {
	return decodeEntities(String(html).replace(/<[^>]*>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();
}

function parseAttributes(tag: string): { [key: string]: string } {
	const attrs: { [key: string]: string } = {};
	const body = String(tag)
		.replace(/^<\s*[\w:-]+/, '')
		.replace(/\/?>$/, '');
	const pattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

	let match: RegExpExecArray | null;

	while ((match = pattern.exec(body))) {
		const name = match[1].toLowerCase();

		if (!(name in attrs)) {
			attrs[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
		}
	}

	return attrs;
}

function resolveUrl(target: string | undefined, base: string): string {
	try {
		return new URL(target || '', base).toString();
	} catch {
		return String(base);
	}
}

/**
 * Parses all the forms of the given page.
 *
 * @param html - The HTML of the page.
 * @param baseUrl - The URL of the page, used to resolve form actions.
 *
 * @returns The forms of the page.
 *
 * @internal
 */
export function parseForms(html: string, baseUrl: string): IHtmlForm[] {
	const source = stripNoise(html);
	const forms: IHtmlForm[] = [];
	const formPattern = new RegExp(`(<form\\b${TagBody}>)([\\s\\S]*?)<\\/form\\s*>`, 'gi');
	const inputPattern = new RegExp(`<input\\b${TagBody}>`, 'gi');
	const buttonPattern = new RegExp(`(<button\\b${TagBody}>)([\\s\\S]*?)<\\/button\\s*>`, 'gi');

	let match: RegExpExecArray | null;

	while ((match = formPattern.exec(source))) {
		const attrs = parseAttributes(match[1]);
		const inner = match[2];

		const fields = (inner.match(inputPattern) ?? []).map((tag): IHtmlField => {
			const a = parseAttributes(tag);

			return {
				name: a.name ?? '',
				id: a.id ?? '',
				type: (a.type ?? 'text').toLowerCase(),
				value: a.value ?? '',
				checked: 'checked' in a,
				disabled: 'disabled' in a,
			};
		});

		const buttons = [...inner.matchAll(buttonPattern)].map((button): IHtmlButton => {
			const a = parseAttributes(button[1]);

			return {
				name: a.name ?? '',
				value: a.value ?? '',
				type: (a.type ?? 'submit').toLowerCase(),
				label: textOf(button[2]),
			};
		});

		forms.push({
			action: resolveUrl(attrs.action, baseUrl),
			method: (attrs.method ?? 'get').toUpperCase(),
			fields: fields,
			buttons: buttons,
			text: textOf(inner),
		});
	}

	return forms;
}

/**
 * Finds the log in form: a password field and a visible identifier field.
 *
 * @param forms - The forms of the page.
 *
 * @returns The log in form, if any.
 *
 * @internal
 */
export function findLoginForm(forms: IHtmlForm[]): ILoginForm | undefined {
	for (const form of forms) {
		const password = form.fields.find((f) => f.type === 'password' && f.name);
		const candidates = form.fields.filter((f) => VisibleTextTypes.has(f.type) && f.name && !f.disabled);

		if (!password || !candidates.length) {
			continue;
		}

		const username = candidates.find((f) => /user|mail|login|ident/i.test(`${f.name} ${f.id}`)) ?? candidates[0];

		return { form: form, username: username, password: password };
	}

	return undefined;
}

function addSubmitter(body: URLSearchParams, form: IHtmlForm): void {
	const submitInput = form.fields.find((f) => f.type === 'submit' && f.name);
	const submitButton = form.buttons.find((b) => b.type === 'submit' && b.name);
	const submitter = submitInput ?? submitButton;

	if (submitter) {
		body.set(submitter.name, submitter.value);
	}
}

/**
 * Builds the body of the log in form: hidden and prefilled fields, credentials, submit button.
 *
 * @param login - The log in form.
 * @param credentials - The credentials to fill in.
 *
 * @returns The body to submit.
 *
 * @internal
 */
export function buildLoginBody(login: ILoginForm, credentials: { email: string; secret: string }): URLSearchParams {
	const { form, username, password } = login;
	const body = new URLSearchParams();

	for (const field of form.fields) {
		if (!field.name || field.disabled) continue;
		if (field === username || field === password) continue;
		if (['password', 'submit', 'button', 'image', 'file', 'reset'].includes(field.type)) continue;
		if (['checkbox', 'radio'].includes(field.type) && !field.checked) continue;

		body.append(field.name, field.type === 'checkbox' && field.value === '' ? 'on' : field.value);
	}

	body.set(username.name, credentials.email);
	body.set(password.name, credentials.secret);

	addSubmitter(body, form);

	return body;
}

/**
 * Finds an OAuth consent form: hidden fields only, and a button that accepts.
 *
 * @param forms - The forms of the page.
 *
 * @returns The consent form, if any.
 *
 * @internal
 */
export function findConsentForm(forms: IHtmlForm[]): IConsentForm | undefined {
	for (const form of forms) {
		const hasInput = form.fields.some(
			(f) => (VisibleTextTypes.has(f.type) && f.name && !f.disabled) || f.type === 'password',
		);

		if (hasInput) {
			continue;
		}

		const submitters = [
			...form.fields
				.filter((f) => f.type === 'submit')
				.map((f) => ({ name: f.name, value: f.value, label: f.value })),
			...form.buttons
				.filter((b) => b.type === 'submit')
				.map((b) => ({ name: b.name, value: b.value, label: b.label })),
		];

		const accept = submitters.find((s) => ConsentLabel.test(`${s.name} ${s.value} ${s.label}`));

		if (accept) {
			return { form: form, accept: accept };
		}
	}

	return undefined;
}

/**
 * Builds the body of the consent form.
 *
 * @param consent - The consent form.
 *
 * @returns The body to submit.
 *
 * @internal
 */
export function buildConsentBody(consent: IConsentForm): URLSearchParams {
	const body = new URLSearchParams();

	for (const field of consent.form.fields) {
		if (!field.name || field.disabled) continue;
		if (['submit', 'button', 'image', 'file', 'reset', 'password'].includes(field.type)) continue;
		if (['checkbox', 'radio'].includes(field.type) && !field.checked) continue;

		body.append(field.name, field.value);
	}

	if (consent.accept.name) {
		body.set(consent.accept.name, consent.accept.value);
	}

	return body;
}

/**
 * Gets the title of the page.
 *
 * @param html - The HTML of the page.
 *
 * @returns The title, truncated, or an empty string.
 *
 * @internal
 */
export function pageTitle(html: string): string {
	const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html));

	return match ? textOf(match[1]).slice(0, 80) : '';
}

/**
 * Gets the error message displayed by the page (WHMCS alert).
 *
 * @param html - The HTML of the page.
 *
 * @returns The message, truncated, or an empty string.
 *
 * @internal
 */
export function extractAlert(html: string): string {
	const match =
		/<div\b[^>]*class=["'][^"']*\b(?:alert-danger|alert-error|login-error|errorbox)\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(
			stripNoise(html),
		);

	return match ? textOf(match[1]).slice(0, 200) : '';
}

/**
 * Whether the page contains a captcha widget.
 *
 * @param html - The HTML of the page.
 *
 * @internal
 */
export function hasCaptchaWidget(html: string): boolean {
	return /class=["'][^"']*\b(?:g-recaptcha|h-captcha|cf-turnstile)\b/i.test(stripNoise(html));
}

/**
 * Whether the page asks for a second authentication factor.
 *
 * @param html - The HTML of the page.
 *
 * @internal
 */
export function looksLikeTwoFactor(html: string): boolean {
	return /double authentification|authentification (?:à|a) deux|two-?factor|\b2fa\b|code de v[ée]rification|authenticator|totp/i.test(
		textOf(stripNoise(html)),
	);
}

/**
 * Whether the response is a Cloudflare challenge.
 *
 * @param status - The status code of the response.
 * @param headers - The headers of the response.
 * @param html - The body of the response.
 *
 * @internal
 */
export function looksLikeChallenge(
	status: number,
	headers: { [key: string]: unknown } | undefined,
	html: string,
): boolean {
	if (headers?.['cf-mitigated'] === 'challenge') {
		return true;
	}

	return [403, 429, 503].includes(status) && /just a moment|cf-chl|attention required|cloudflare/i.test(String(html));
}
