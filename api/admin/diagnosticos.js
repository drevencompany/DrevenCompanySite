const { requireAdminAuth } = require('../../server/middleware/admin-auth');
const { getSharedRepository, parseRequestBody } = require('../../server/adapters/vercel');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const repo = getSharedRepository();

  if (req.method === 'GET') {
    const session = requireAdminAuth(req, res);
    if (!session) return;

    const result = await repo.listDiagnostics();
    if (!result.ok) {
      return res.status(500).json({ success: false, error: 'Falha ao buscar diagnósticos.' });
    }
    return res.status(200).json({
      success: true,
      total: result.value.length,
      briefings: result.value
    });
  }

  if (req.method === 'DELETE') {
    const session = requireAdminAuth(req, res, { requireCsrf: true });
    if (!session) return;

    const body = parseRequestBody(req);
    const id = req.query.id || body.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID do diagnóstico é obrigatório.' });
    }

    const result = await repo.deleteDiagnostic(id);
    if (!result.ok) {
      return res.status(404).json({ success: false, error: 'Diagnóstico não encontrado.' });
    }
    return res.status(200).json({ success: true, message: 'Diagnóstico excluído com sucesso.' });
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
};
