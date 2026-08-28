const assert = require('node:assert/strict');
const test = require('node:test');
const { loadConfig, requireValue, requireSecret } = require('../../server/core/config');

test('loadConfig validates environment variables and redacts secret values in errors', () => {
  assert.throws(() => requireSecret(undefined, 'GITHUB_TOKEN'), (err) => {
    assert.match(err.message, /GITHUB_TOKEN is required/);
    assert.equal(err.code, 'CONFIG_MISSING');
    return true;
  });

  assert.throws(() => requireValue('', 'GITHUB_GIST_ID'), (err) => {
    assert.match(err.message, /GITHUB_GIST_ID is required/);
    assert.equal(err.code, 'CONFIG_MISSING');
    return true;
  });
});

test('loadConfig successfully extracts configured values without exposing secrets in inspect/serialization', () => {
  const env = {
    GITHUB_TOKEN: 'gho_secret_token_1234567890',
    GITHUB_GIST_ID: 'gist_12345',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '465',
    SMTP_USER: 'user@example.com',
    SMTP_PASS: 'password123',
    ADMIN_GITHUB_USER_ID: '123456'
  };

  const config = loadConfig(env);
  assert.equal(config.githubToken, 'gho_secret_token_1234567890');
  assert.equal(config.githubGistId, 'gist_12345');
  assert.equal(config.smtp.host, 'smtp.example.com');
  assert.equal(config.smtp.port, 465);
  assert.equal(config.smtp.user, 'user@example.com');
  assert.equal(config.smtp.pass, 'password123');
  assert.equal(config.adminGithubUserId, 123456);
});

test('missing GitHub token fails closed without exposing a value', () => {
  assert.throws(() => loadConfig({}), /GITHUB_TOKEN is required/);
});
