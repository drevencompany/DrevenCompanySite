const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json']);

function trackedTextFiles() {
  return execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file)));
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function findCredentialFallback(source, pattern, file, kind) {
  if (pattern.test(source)) {
    return `${file}: ${kind} detected`;
  }
  return null;
}

test('tracked product source contains no credential-shaped fallback', () => {
  const failures = [];
  for (const file of trackedTextFiles()) {
    const source = read(file);
    const tokenFailure = findCredentialFallback(source, /gh[opusr]_[A-Za-z0-9_]{20,}/, file, 'credential-shaped fallback');
    const assembledTokenFailure = findCredentialFallback(source, /const\s+p1\s*=\s*['"]gh[opusr]_/, file, 'assembled GitHub credential fallback');
    const smtpFailure = findCredentialFallback(source, /SMTP_PASS\s*\|\|\s*['"][^'"]+['"]/, file, 'SMTP password fallback');
    if (tokenFailure) failures.push(tokenFailure);
    if (assembledTokenFailure) failures.push(assembledTokenFailure);
    if (smtpFailure) failures.push(smtpFailure);
  }
  assert.deepEqual(failures, []);
});
