const { createContactService } = require('../server/core/contact-service');
const { getSharedRepository, getSharedMailer, parseRequestBody } = require('../server/adapters/vercel');
const { toHttpError } = require('../server/core/errors');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  try {
    const rawBody = parseRequestBody(req);

    // Honeypot anti-spam
    if (rawBody.hp) {
      return res.status(200).json({ success: true, message: 'Processado com sucesso.' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const service = createContactService({
      repository: getSharedRepository(),
      mailer: getSharedMailer(),
      clock: () => new Date(),
      idFactory: () => `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    });

    const result = await service.submit({ ...rawBody, ip, userAgent });

    return res.status(200).json({
      success: true,
      message: 'Recebemos seu contato com sucesso. Entraremos em contato com brevidade.',
      lead: result.lead
    });
  } catch (err) {
    const httpErr = toHttpError(err);
    return res.status(httpErr.status).json({
      success: false,
      error: httpErr.error
    });
  }
};
