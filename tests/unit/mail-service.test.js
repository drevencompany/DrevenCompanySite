const assert = require('node:assert/strict');
const test = require('node:test');
const { createMailService } = require('../../server/core/mail-service');

test('sendContact sends escaped emails and returns sent outcome', async () => {
  const sentMessages = [];
  const fakeTransport = {
    async sendMail(opts) {
      sentMessages.push(opts);
      return { messageId: '123' };
    }
  };

  const mailer = createMailService({
    transport: fakeTransport,
    fromAddress: 'contato@dreven.company',
    adminEmail: 'contato@dreven.company'
  });

  const lead = {
    id: 'lead_1',
    name: 'Carlos <script>alert(1)</script>',
    email: 'carlos@example.com',
    phone: '(41) 99999-9999',
    segment: 'Outro & Cia',
    createdAt: new Date().toISOString()
  };

  const outcome = await mailer.sendContact(lead);
  assert.equal(outcome.sent, true);
  assert.equal(sentMessages.length, 2); // 1 admin + 1 client

  // Check escaping in admin email HTML
  const adminMsg = sentMessages[0];
  assert.ok(adminMsg.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!adminMsg.html.includes('<script>alert(1)</script>'));
});

test('sendContact handles transport errors without throwing', async () => {
  const failingTransport = {
    async sendMail() {
      throw new Error('SMTP connection timed out');
    }
  };

  const mailer = createMailService({
    transport: failingTransport,
    fromAddress: 'contato@dreven.company',
    adminEmail: 'contato@dreven.company'
  });

  const lead = {
    id: 'lead_1',
    name: 'Carlos',
    email: 'carlos@example.com',
    phone: '(41) 99999-9999',
    segment: 'Tecnologia'
  };

  const outcome = await mailer.sendContact(lead);
  assert.equal(outcome.sent, false);
});
