const { serializeCookie } = require('../../server/core/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const clearSession = serializeCookie('admin_session', '', { maxAge: 0, sameSite: 'Strict' });
  res.setHeader('Set-Cookie', [clearSession]);
  return res.status(200).json({ success: true, message: 'Desconectado com sucesso.' });
};
