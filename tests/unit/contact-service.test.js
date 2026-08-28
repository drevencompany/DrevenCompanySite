const assert = require('node:assert/strict');
const test = require('node:test');

const { createContactService } = require('../../server/core/contact-service');

const validContact = {
  name: ' Ana Ribeiro ',
  email: ' ANA.RIBEIRO@EXAMPLE.COM ',
  phone: '+55 (41) 99999-9999',
  segment: 'Tecnologia, SaaS & Softwares',
  hp: '',
  source: ''
};

function createService({ createLead, sendContact, clock = () => new Date('2026-08-28T12:00:00.000Z') } = {}) {
  return createContactService({
    repository: { createLead: createLead || (async record => ({ ok: true, value: record })) },
    mailer: { sendContact: sendContact || (async () => ({ sent: true })) },
    clock,
    idFactory: () => 'lead_fixed'
  });
}

test('persists the normalized contact record before reporting a non-fatal mail failure', async () => {
  const service = createService({
    sendContact: async () => ({ sent: false, error: 'MAIL_DELIVERY_FAILED' })
  });

  const result = await service.submit(validContact);

  assert.deepEqual(result, {
    lead: {
      id: 'lead_fixed',
      name: 'Ana Ribeiro',
      email: 'ana.ribeiro@example.com',
      phone: '+55 (41) 99999-9999',
      segment: 'Tecnologia, SaaS & Softwares',
      ip: 'unknown',
      userAgent: 'unknown',
      source: 'website_contact_form',
      status: 'novo',
      createdAt: '2026-08-28T12:00:00.000Z'
    },
    persisted: true,
    mail: { sent: false, error: 'MAIL_DELIVERY_FAILED' }
  });
});

test('keeps supplied contact request metadata in the persisted record', async () => {
  const service = createService();

  const result = await service.submit({
    ...validContact,
    source: 'website_diagnostico_form',
    ip: '203.0.113.7',
    userAgent: 'Dreven test browser'
  });

  assert.deepEqual(result.lead, {
    id: 'lead_fixed',
    name: 'Ana Ribeiro',
    email: 'ana.ribeiro@example.com',
    phone: '+55 (41) 99999-9999',
    segment: 'Tecnologia, SaaS & Softwares',
    ip: '203.0.113.7',
    userAgent: 'Dreven test browser',
    source: 'website_diagnostico_form',
    status: 'novo',
    createdAt: '2026-08-28T12:00:00.000Z'
  });
});

test('rejects an explicit failed contact write instead of reporting persistence success', async () => {
  const service = createService({
    createLead: async () => ({ ok: false, value: null }),
    sendContact: async () => {
      throw new Error('mail must not run after a failed write');
    }
  });

  await assert.rejects(service.submit(validContact), /createLead failed/);
});

test('turns a rejected mail delivery into a non-fatal mail outcome after persistence', async () => {
  const service = createService({
    sendContact: async () => {
      throw new Error('SMTP is unavailable');
    }
  });

  const result = await service.submit(validContact);

  assert.deepEqual(result.mail, { sent: false });
  assert.equal(result.persisted, true);
});

test('fails fast when the contact repository contract is incomplete', () => {
  assert.throws(() => createContactService({
    repository: {},
    mailer: { sendContact: async () => ({ sent: true }) },
    clock: () => new Date(),
    idFactory: () => 'lead_fixed'
  }), /repository\.createLead must be a function/);
});
