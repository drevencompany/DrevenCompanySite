const { validateContact } = require('./validation');
const { assertServiceDependencies, requireSuccessfulWrite } = require('./repositories');

function toIsoString(clock) {
  const now = clock();
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('clock must return a valid Date');
  }
  return now.toISOString();
}

function requestMetadata(rawInput, field) {
  return typeof rawInput[field] === 'string' && rawInput[field].trim()
    ? rawInput[field].trim()
    : 'unknown';
}

function toLead(input, rawInput, clock, idFactory) {
  return {
    id: idFactory(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    segment: input.segment,
    ip: requestMetadata(rawInput, 'ip'),
    userAgent: requestMetadata(rawInput, 'userAgent'),
    source: input.source || 'website_contact_form',
    status: 'novo',
    createdAt: toIsoString(clock)
  };
}

async function deliver(mailer, lead) {
  try {
    const outcome = await mailer.sendContact(lead);
    return outcome && typeof outcome.sent === 'boolean' ? outcome : { sent: false };
  } catch {
    return { sent: false };
  }
}

function createContactService({ repository, mailer, clock, idFactory }) {
  assertServiceDependencies({
    repository,
    mailer,
    clock,
    idFactory,
    repositoryMethod: 'createLead',
    mailerMethod: 'sendContact'
  });

  return {
    async submit(rawInput) {
      const input = validateContact(rawInput);
      const lead = requireSuccessfulWrite(
        await repository.createLead(toLead(input, rawInput, clock, idFactory)),
        'createLead'
      );
      const mail = await deliver(mailer, lead);
      return { lead, persisted: true, mail };
    }
  };
}

module.exports = { createContactService };
