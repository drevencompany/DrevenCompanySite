const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json']);
const ASSEMBLED_GITHUB_FALLBACK = /if\s*\(\s*process\.env\.GITHUB_TOKEN\s*\)\s*return\s+process\.env\.GITHUB_TOKEN\s*;[\s\S]{0,500}?\breturn\s+[A-Za-z_$][\w$]*(?:\s*\+\s*[A-Za-z_$][\w$]*)+\s*;/;

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

test('assembled GitHub fallback detector ignores an isolated token-like fragment', () => {
  assert.doesNotMatch("const p1 = 'gho_';", ASSEMBLED_GITHUB_FALLBACK);
});

test('assembled GitHub fallback detector requires environment fallback and variable assembly', () => {
  const source = [
    'if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;',
    "const tokenPartA = 'gho_';",
    "const tokenPartB = 'placeholder';",
    'return tokenPartA + tokenPartB;'
  ].join('\n');

  assert.match(source, ASSEMBLED_GITHUB_FALLBACK);
});

test('tracked product source contains no credential-shaped fallback', () => {
  const failures = [];
  for (const file of trackedTextFiles()) {
    const source = read(file);
    const tokenFailure = findCredentialFallback(source, /gh[opusr]_[A-Za-z0-9_]{20,}/, file, 'credential-shaped fallback');
    const assembledTokenFailure = findCredentialFallback(source, ASSEMBLED_GITHUB_FALLBACK, file, 'assembled GitHub credential fallback');
    const smtpFailure = findCredentialFallback(source, /SMTP_PASS\s*\|\|\s*['"][^'"]+['"]/, file, 'SMTP password fallback');
    if (tokenFailure) failures.push(tokenFailure);
    if (assembledTokenFailure) failures.push(assembledTokenFailure);
    if (smtpFailure) failures.push(smtpFailure);
  }
  assert.deepEqual(failures, []);
});
