'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const html = require('../dist/helper/HtmlForms');

const LOGIN_PAGE = `
<html><head><title>Log in &amp; more</title></head><body>
<!-- <form action="/fake"><input type="password" name="nope"></form> -->
<script>var x = '<form action="/evil">';</script>
<form method="post" action="/dologin.php">
	<input type="hidden" name="token" value="abc&quot;123">
	<input type="email" name="username" id="inputEmail">
	<input type="password" name="password">
	<input type="checkbox" name="rememberme">
	<input type="checkbox" name="agree" checked>
	<input type="text" name="disabled_field" value="x" disabled>
	<button type="submit" name="login" value="1">Se connecter</button>
</form>
</body></html>`;

const CONSENT_PAGE = `
<form method="POST" action="https://my.example.org/oauth/authorize">
	<input type="hidden" name="state" value="s1">
	<button type="submit" name="deny" value="0">Refuser</button>
	<button type="submit" name="authorize" value="yes">Autoriser</button>
</form>`;

test('parseForms ignores comments and scripts, and resolves the action', () => {
	const forms = html.parseForms(LOGIN_PAGE, 'https://my.example.org/login');

	assert.equal(forms.length, 1);
	assert.equal(forms[0].action, 'https://my.example.org/dologin.php');
	assert.equal(forms[0].method, 'POST');
	assert.equal(forms[0].fields.find((f) => f.name === 'token').value, 'abc"123');
	assert.equal(forms[0].buttons[0].label, 'Se connecter');
});

test('findLoginForm and buildLoginBody fill credentials and keep hidden fields', () => {
	const forms = html.parseForms(LOGIN_PAGE, 'https://my.example.org/login');
	const login = html.findLoginForm(forms);

	assert.ok(login);
	assert.equal(login.username.name, 'username');
	assert.equal(login.password.name, 'password');

	const body = html.buildLoginBody(login, { email: 'a@b.c', secret: 's3cret' });

	assert.equal(body.get('token'), 'abc"123');
	assert.equal(body.get('username'), 'a@b.c');
	assert.equal(body.get('password'), 's3cret');
	assert.equal(body.get('agree'), 'on');
	assert.equal(body.get('rememberme'), null);
	assert.equal(body.get('disabled_field'), null);
	assert.equal(body.get('login'), '1');
});

test('findConsentForm picks the accepting button', () => {
	const forms = html.parseForms(CONSENT_PAGE, 'https://my.example.org/');

	assert.equal(html.findLoginForm(forms), undefined);

	const consent = html.findConsentForm(forms);

	assert.ok(consent);
	assert.equal(consent.accept.name, 'authorize');

	const body = html.buildConsentBody(consent);

	assert.equal(body.get('state'), 's1');
	assert.equal(body.get('authorize'), 'yes');
	assert.equal(body.get('deny'), null);
});

test('page helpers', () => {
	assert.equal(html.pageTitle(LOGIN_PAGE), 'Log in & more');
	assert.equal(
		html.extractAlert('<div class="alert alert-danger">Identifiants <b>invalides</b></div>'),
		'Identifiants invalides',
	);
	assert.equal(html.hasCaptchaWidget('<div class="g-recaptcha" data-sitekey="x"></div>'), true);
	assert.equal(html.hasCaptchaWidget(LOGIN_PAGE), false);
	assert.equal(html.decodeEntities('&#233;&#x41;&lt;'), 'éA<');
});

test('looksLikeTwoFactor', () => {
	assert.equal(html.looksLikeTwoFactor('<p>Entrez le code de vérification</p>'), true);
	assert.equal(html.looksLikeTwoFactor('<p>Two-factor authentication</p>'), true);
	assert.equal(html.looksLikeTwoFactor(LOGIN_PAGE), false);
});

test('looksLikeChallenge', () => {
	assert.equal(html.looksLikeChallenge(200, { 'cf-mitigated': 'challenge' }, ''), true);
	assert.equal(html.looksLikeChallenge(403, {}, '<title>Just a moment...</title>'), true);
	assert.equal(html.looksLikeChallenge(200, {}, '<title>Just a moment...</title>'), false);
	assert.equal(html.looksLikeChallenge(403, {}, 'Forbidden'), false);
});
