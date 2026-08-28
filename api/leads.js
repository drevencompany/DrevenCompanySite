module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', '</api/admin/leads>; rel="successor-version"');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: this endpoint is deprecated and requires administrative authentication via /api/admin/leads.'
    });
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
};
