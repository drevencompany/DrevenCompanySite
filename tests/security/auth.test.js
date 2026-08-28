const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createOAuthChallenge,
  verifyCodeChallenge,
  issueSession,
  verifySession,
  issueCsrfToken,
  verifyCsrfToken,
  isAuthorizedAdmin,
  serializeCookie
} = require('../../server/core/auth');
const { invokeHandler } = require('../helpers/http');

const sessionHandler = require('../../api/auth/session');
const csrfHandler = require('../../api/auth/csrf');
const logoutHandler = require('../../api/auth/logout');

const TEST_SECRET = 'a_very_secret_signing_key_for_testing_purposes_123456';
const ADMIN_ID = 123456;

test('createOAuthChallenge generates state and valid PKCE S256 challenge', () => {
  const challenge = createOAuthChallenge();
  assert.ok(challenge.state && challenge.state.length >= 32);
  assert.ok(challenge.codeVerifier && challenge.codeVerifier.length >= 43);
  assert.ok(challenge.codeChallenge && challenge.codeChallenge.length >= 43);
  assert.equal(verifyCodeChallenge(challenge.codeVerifier, challenge.codeChallenge), true);
  assert.equal(verifyCodeChallenge('wrong_verifier', challenge.codeChallenge), false);
});

test('issueSession and verifySession handle valid and tampered tokens', () => {
  const user = { id: ADMIN_ID, login: 'drevencompany' };
  const token = issueSession(user, TEST_SECRET, { ttlSeconds: 3600 });
  assert.ok(token);

  const verified = verifySession(token, TEST_SECRET);
  assert.ok(verified);
  assert.equal(verified.id, ADMIN_ID);
  assert.equal(verified.login, 'drevencompany');

  // Tampered payload
  const parts = token.split('.');
  const tamperedToken = `${parts[0]}tampered.${parts[1]}`;
  assert.equal(verifySession(tamperedToken, TEST_SECRET), null);

  // Wrong secret
  assert.equal(verifySession(token, 'different_secret_key_1234567890'), null);

  // Expired token
  const expiredToken = issueSession(user, TEST_SECRET, { ttlSeconds: -10 });
  assert.equal(verifySession(expiredToken, TEST_SECRET), null);
});

test('issueCsrfToken and verifyCsrfToken enforce session linkage and tamper resistance', () => {
  const sessionToken = issueSession({ id: ADMIN_ID, login: 'drevencompany' }, TEST_SECRET);
  const csrfToken = issueCsrfToken(sessionToken, TEST_SECRET);
  assert.ok(csrfToken);

  assert.equal(verifyCsrfToken(csrfToken, sessionToken, TEST_SECRET), true);
  assert.equal(verifyCsrfToken(csrfToken, 'different_session_token', TEST_SECRET), false);
  assert.equal(verifyCsrfToken('tampered_csrf_token', sessionToken, TEST_SECRET), false);
});

test('isAuthorizedAdmin checks strict numeric user ID matching', () => {
  assert.equal(isAuthorizedAdmin(123456, 123456), true);
  assert.equal(isAuthorizedAdmin('123456', 123456), true);
  assert.equal(isAuthorizedAdmin(999999, 123456), false);
  assert.equal(isAuthorizedAdmin(null, 123456), false);
  assert.equal(isAuthorizedAdmin(undefined, 123456), false);
});

test('session and csrf endpoints return 401 for unauthorized or missing session', async () => {
  process.env.SESSION_SECRET = TEST_SECRET;
  process.env.ADMIN_GITHUB_USER_ID = String(ADMIN_ID);

  const anonymousSession = await invokeHandler(sessionHandler, { headers: {} });
  assert.equal(anonymousSession.status, 401);
  assert.equal(anonymousSession.body.authenticated, false);

  const anonymousCsrf = await invokeHandler(csrfHandler, { headers: {} });
  assert.equal(anonymousCsrf.status, 401);

  // Valid session
  const validToken = issueSession({ id: ADMIN_ID, login: 'drevencompany' }, TEST_SECRET);
  const validCookie = serializeCookie('admin_session', validToken);

  const authenticatedSession = await invokeHandler(sessionHandler, {
    headers: { cookie: validCookie }
  });
  assert.equal(authenticatedSession.status, 200);
  assert.equal(authenticatedSession.body.authenticated, true);
  assert.equal(authenticatedSession.body.user.id, ADMIN_ID);

  const authenticatedCsrf = await invokeHandler(csrfHandler, {
    headers: { cookie: validCookie }
  });
  assert.equal(authenticatedCsrf.status, 200);
  assert.ok(authenticatedCsrf.body.csrfToken);

  // Logout
  const logout = await invokeHandler(logoutHandler, {});
  assert.equal(logout.status, 200);
  assert.ok(logout.headers['set-cookie']);
});
