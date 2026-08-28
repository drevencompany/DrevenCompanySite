const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');

test('script.js redirects #admin hash to /admin', () => {
  const scriptContent = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  assert.match(scriptContent, /['"]#admin['"]/);
  assert.match(scriptContent, /['"]\/admin['"]/);
});

test('vercel.json routes /admin to /admin.html', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const adminRoute = vercelConfig.rewrites.find(r => r.source === '/admin');
  assert.ok(adminRoute, 'A rota /admin deve estar configurada em vercel.json');
  assert.equal(adminRoute.destination, '/admin.html');
});
