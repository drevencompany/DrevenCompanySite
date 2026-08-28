const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const https = require('node:https');
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

function restoreCachedModule(modulePath, cacheEntry) {
  if (cacheEntry) require.cache[modulePath] = cacheEntry;
  else delete require.cache[modulePath];
}

test('legacy database read does not send a credential-shaped fallback when GitHub token is absent', async () => {
  const modulePath = require.resolve('../../api/lib/db');
  const originalCacheEntry = require.cache[modulePath];
  const originalRequest = https.request;
  const tokenWasSet = Object.hasOwn(process.env, 'GITHUB_TOKEN');
  const originalToken = process.env.GITHUB_TOKEN;
  let authorization = '';
  let requestCount = 0;

  delete process.env.GITHUB_TOKEN;
  https.request = (options, onResponse) => {
    requestCount += 1;
    authorization = String(options.headers.Authorization || '');
    const request = new EventEmitter();
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = 401;
      onResponse(response);
      response.emit('data', '{}');
      response.emit('end');
    };
    return request;
  };

  delete require.cache[modulePath];
  try {
    const database = require(modulePath);
    assert.deepEqual(await database.getLeads(), []);
    assert.equal(requestCount, 1);
    if (/gh[opusr]_[A-Za-z0-9_]{20,}/.test(authorization)) {
      assert.fail('legacy database read sent a credential-shaped Authorization fallback');
    }
  } finally {
    https.request = originalRequest;
    restoreCachedModule(modulePath, originalCacheEntry);
    if (tokenWasSet) process.env.GITHUB_TOKEN = originalToken;
    else delete process.env.GITHUB_TOKEN;
  }
});

test('legacy database request harness preserves a pre-existing module cache entry', async () => {
  const modulePath = require.resolve('../../api/lib/db');
  const initialCacheEntry = require.cache[modulePath];
  const originalRequest = https.request;
  const tokenWasSet = Object.hasOwn(process.env, 'GITHUB_TOKEN');
  const originalToken = process.env.GITHUB_TOKEN;
  const preExistingEntry = require(modulePath) && require.cache[modulePath];

  delete process.env.GITHUB_TOKEN;
  https.request = (_options, onResponse) => {
    const request = new EventEmitter();
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = 401;
      onResponse(response);
      response.emit('data', '{}');
      response.emit('end');
    };
    return request;
  };

  delete require.cache[modulePath];
  try {
    await require(modulePath).getLeads();
  } finally {
    https.request = originalRequest;
    if (tokenWasSet) process.env.GITHUB_TOKEN = originalToken;
    else delete process.env.GITHUB_TOKEN;
    restoreCachedModule(modulePath, preExistingEntry);
  }

  try {
    assert.strictEqual(require.cache[modulePath], preExistingEntry);
  } finally {
    restoreCachedModule(modulePath, initialCacheEntry);
  }
});

test('tracked product source contains no credential-shaped fallback', () => {
  const failures = [];
  for (const file of trackedTextFiles()) {
    const source = read(file);
    const tokenFailure = findCredentialFallback(source, /gh[opusr]_[A-Za-z0-9_]{20,}/, file, 'credential-shaped fallback');
    const smtpFailure = findCredentialFallback(source, /SMTP_PASS\s*\|\|\s*['"][^'"]+['"]/, file, 'SMTP password fallback');
    if (tokenFailure) failures.push(tokenFailure);
    if (smtpFailure) failures.push(smtpFailure);
  }
  assert.deepEqual(failures, []);
});
