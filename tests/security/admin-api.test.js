const assert = require('node:assert/strict');
const test = require('node:test');
const { invokeHandler } = require('../helpers/http');
const { issueSession, issueCsrfToken, serializeCookie } = require('../../server/core/auth');

const adminLeadsHandler = require('../../api/admin/leads');
const adminDiagnosticosHandler = require('../../api/admin/diagnosticos');
const legacyLeadsHandler = require('../../api/leads');
const legacyDiagnosticoHandler = require('../../api/diagnostico');

const TEST_SECRET = 'a_very_secret_signing_key_for_testing_purposes_123456';
const ADMIN_ID = 123456;

test('admin APIs reject anonymous listing with 401', async () => {
  process.env.SESSION_SECRET = TEST_SECRET;
  process.env.ADMIN_GITHUB_USER_ID = String(ADMIN_ID);

  const leadsRes = await invokeHandler(adminLeadsHandler, { method: 'GET', headers: {} });
  assert.equal(leadsRes.status, 401);

  const diagRes = await invokeHandler(adminDiagnosticosHandler, { method: 'GET', headers: {} });
  assert.equal(diagRes.status, 401);

  const legacyLeadsRes = await invokeHandler(legacyLeadsHandler, { method: 'GET', headers: {} });
  assert.equal(legacyLeadsRes.status, 401);

  const legacyDiagRes = await invokeHandler(legacyDiagnosticoHandler, { method: 'GET', headers: {} });
  assert.equal(legacyDiagRes.status, 401);
});

test('admin APIs reject mutations when CSRF token is missing or invalid', async () => {
  process.env.SESSION_SECRET = TEST_SECRET;
  process.env.ADMIN_GITHUB_USER_ID = String(ADMIN_ID);

  const validToken = issueSession({ id: ADMIN_ID, login: 'drevencompany' }, TEST_SECRET);
  const cookie = serializeCookie('admin_session', validToken);

  const missingCsrf = await invokeHandler(adminLeadsHandler, {
    method: 'DELETE',
    headers: { cookie },
    query: { id: 'lead_123' }
  });
  assert.equal(missingCsrf.status, 403);

  const invalidCsrf = await invokeHandler(adminLeadsHandler, {
    method: 'DELETE',
    headers: { cookie, 'x-csrf-token': 'wrong_token' },
    query: { id: 'lead_123' }
  });
  assert.equal(invalidCsrf.status, 403);
});

test('admin APIs accept authenticated mutations with valid session and CSRF', async () => {
  process.env.SESSION_SECRET = TEST_SECRET;
  process.env.ADMIN_GITHUB_USER_ID = String(ADMIN_ID);
  process.env.GITHUB_TOKEN = 'test_token';
  process.env.GITHUB_GIST_ID = 'test_gist';

  const validToken = issueSession({ id: ADMIN_ID, login: 'drevencompany' }, TEST_SECRET);
  const cookie = serializeCookie('admin_session', validToken);
  const csrfToken = issueCsrfToken(validToken, TEST_SECRET);

  // Missing id returns 400
  const missingIdRes = await invokeHandler(adminLeadsHandler, {
    method: 'PUT',
    headers: { cookie, 'x-csrf-token': csrfToken },
    body: { status: 'contatado' },
    query: {}
  });
  assert.equal(missingIdRes.status, 400);
});
