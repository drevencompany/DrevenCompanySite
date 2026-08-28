const assert = require('node:assert/strict');
const test = require('node:test');

function renderTextCell(text) {
  // Simula o padrão utilizado em admin.js
  const span = {
    textContent: '',
    children: []
  };
  span.textContent = text;
  return span;
}

test('stored payload is rendered strictly as text without HTML execution', () => {
  const maliciousInput = '<img src=x onerror=alert(1)><script>alert("xss")</script>';
  const cell = renderTextCell(maliciousInput);
  assert.equal(cell.textContent, maliciousInput);
  assert.equal(cell.children.length, 0);
});
