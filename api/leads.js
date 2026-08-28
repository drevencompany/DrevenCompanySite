const db = require('./lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const leads = await db.getLeads();
      return res.status(200).json({ success: true, leads });
    } catch (err) {
      return res.status(200).json({ success: true, leads: [] });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
};
