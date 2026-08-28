const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('contact form retains its public submission fields', () => {
  const page = read('index.html');

  for (const field of ['hp', 'name', 'email', 'phone', 'segment']) {
    assert.match(page, new RegExp(`name=["']${field}["']`));
  }
});

test('diagnostic flow retains contact fields submitted to its public endpoint', () => {
  const page = read('diagnostico.html');
  const client = read('diagnostico.js');

  for (const id of ['input-company', 'input-name', 'input-role', 'input-phone', 'input-email', 'consent-check']) {
    assert.match(page, new RegExp(`id=["']${id}["']`));
  }

  for (const field of ['empresa', 'contato_nome', 'contato_cargo', 'contato_whatsapp', 'contato_email']) {
    assert.match(client, new RegExp(field));
  }
});
