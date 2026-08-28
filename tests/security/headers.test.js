const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');

test('vercel.json defines essential security headers', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.ok(Array.isArray(vercelConfig.headers), 'Headers de segurança devem estar configurados em vercel.json');

  const globalHeaderRule = vercelConfig.headers.find(h => h.source === '/(.*)');
  assert.ok(globalHeaderRule, 'Deve haver uma regra de headers global para /(.*)');

  const headerMap = {};
  globalHeaderRule.headers.forEach(h => {
    headerMap[h.key.toLowerCase()] = h.value;
  });

  assert.equal(headerMap['x-content-type-options'], 'nosniff');
  assert.equal(headerMap['x-frame-options'], 'DENY');
  assert.ok(headerMap['referrer-policy']);
  assert.ok(headerMap['permissions-policy']);
});
