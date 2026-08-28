const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { invokeHandler } = require('../helpers/http');

const ROOT = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('public contract retains contact and diagnostic endpoints', () => {
  assert.match(read('script.js'), /['"]\/api\/contact['"]/);
  assert.match(read('diagnostico.js'), /['"]\/api\/diagnostico['"]/);
});

test('public handlers accept CORS preflight without a network listener', async () => {
  const contactHandler = require('../../api/contact');
  const diagnosticHandler = require('../../api/diagnostico');

  for (const handler of [contactHandler, diagnosticHandler]) {
    const response = await invokeHandler(handler, { method: 'OPTIONS' });
    assert.equal(response.status, 200);
    assert.equal(response.headers['access-control-allow-origin'], '*');
  }
});
