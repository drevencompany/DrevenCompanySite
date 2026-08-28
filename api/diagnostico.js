const { createDiagnosticService } = require('../server/core/diagnostic-service');
const { getSharedRepository, getSharedMailer, parseRequestBody } = require('../server/adapters/vercel');
const { toHttpError } = require('../server/core/errors');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Endpoint legado protegido
  if (req.method === 'GET') {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/admin/diagnosticos>; rel="successor-version"');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: this endpoint is deprecated and requires administrative authentication via /api/admin/diagnosticos.'
    });
  }

  // POST: Submissão de novo diagnóstico
  if (req.method === 'POST') {
    try {
      const rawBody = parseRequestBody(req);

      const service = createDiagnosticService({
        repository: getSharedRepository(),
        mailer: getSharedMailer(),
        clock: () => new Date(),
        idFactory: () => `briefing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      });

      const result = await service.submit(rawBody);

      return res.status(200).json({
        success: true,
        message: 'Diagnóstico registrado com sucesso.',
        briefing: result.diagnostic
      });
    } catch (err) {
      const httpErr = toHttpError(err);
      return res.status(httpErr.status).json({
        success: false,
        error: httpErr.error
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
};
