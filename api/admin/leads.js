const { requireAdminAuth } = require('../../server/middleware/admin-auth');
const { getSharedRepository, parseRequestBody } = require('../../server/adapters/vercel');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const repo = getSharedRepository();

  if (req.method === 'GET') {
    const session = requireAdminAuth(req, res);
    if (!session) return;

    const result = await repo.listLeads();
    if (!result.ok) {
      return res.status(500).json({ success: false, error: 'Falha ao buscar leads.' });
    }
    return res.status(200).json({
      success: true,
      total: result.value.length,
      leads: result.value
    });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const session = requireAdminAuth(req, res, { requireCsrf: true });
    if (!session) return;

    const body = parseRequestBody(req);
    const id = req.query.id || body.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID do lead é obrigatório.' });
    }

    const result = await repo.updateLead(id, body);
    if (!result.ok) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado.' });
    }
    return res.status(200).json({ success: true, lead: result.value });
  }

  if (req.method === 'DELETE') {
    const session = requireAdminAuth(req, res, { requireCsrf: true });
    if (!session) return;

    const body = parseRequestBody(req);
    const id = req.query.id || body.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID do lead é obrigatório.' });
    }

    const result = await repo.deleteLead(id);
    if (!result.ok) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado.' });
    }
    return res.status(200).json({ success: true, message: 'Lead excluído com sucesso.' });
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
};
