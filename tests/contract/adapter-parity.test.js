const assert = require('node:assert/strict');
const test = require('node:test');
const { invokeHandler } = require('../helpers/http');

const vercelLeadsHandler = require('../../api/admin/leads');
const vercelDiagnosticosHandler = require('../../api/admin/diagnosticos');
const { handleGetLeads } = require('../../server/controllers/contact');
const { handleGetBriefings } = require('../../server/controllers/briefing');
const { expressAdminAuth } = require('../../server/middleware/admin-auth');

const TEST_SECRET = 'a_very_secret_signing_key_for_testing_purposes_123456';
const ADMIN_ID = 123456;

test('adapter parity: both Vercel and Express reject anonymous admin access with 401', async () => {
  process.env.SESSION_SECRET = TEST_SECRET;
  process.env.ADMIN_GITHUB_USER_ID = String(ADMIN_ID);

  // Vercel
  const vercelLeads = await invokeHandler(vercelLeadsHandler, { method: 'GET', headers: {} });
  assert.equal(vercelLeads.status, 401);

  const vercelDiag = await invokeHandler(vercelDiagnosticosHandler, { method: 'GET', headers: {} });
  assert.equal(vercelDiag.status, 401);

  // Express
  const expressMiddleware = expressAdminAuth();
  let expressNextCalled = false;
  const expressRes = await invokeHandler(async (req, res) => {
    expressMiddleware(req, res, () => {
      expressNextCalled = true;
      handleGetLeads(req, res);
    });
  }, { method: 'GET', headers: {} });

  assert.equal(expressRes.status, 401);
  assert.equal(expressNextCalled, false);
});
