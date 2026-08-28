const assert = require('node:assert/strict');
const test = require('node:test');

const { ValidationError, toHttpError } = require('../../server/core/errors');

test('maps validation failures to a stable non-sensitive client response', () => {
  const response = toHttpError(new ValidationError('INVALID_EMAIL', 'email'));

  assert.deepEqual(response, {
    status: 400,
    body: { success: false, error: { code: 'INVALID_EMAIL', field: 'email' } }
  });
});

test('does not expose unexpected error details to the client', () => {
  const response = toHttpError(new Error('submitted@example.com must not leak'));

  assert.deepEqual(response, {
    status: 500,
    body: { success: false, error: { code: 'INTERNAL_ERROR' } }
  });
  assert.doesNotMatch(JSON.stringify(response), /submitted@example\.com/);
});
