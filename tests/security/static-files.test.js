const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');

test('express server does not expose arbitrary root directories or .env directly', () => {
  const serverSource = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
  // Express should not serve ROOT_DIR blindly without restriction
  assert.ok(!serverSource.includes('app.use(express.static(ROOT_DIR))'));
});
