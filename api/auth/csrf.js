const { parseCookies, verifySession, issueCsrfToken, isAuthorizedAdmin } = require('../../server/core/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionToken = cookies.admin_session;
  const sessionSecret = process.env.SESSION_SECRET;
  const adminId = process.env.ADMIN_GITHUB_USER_ID;

  if (!sessionToken || !sessionSecret || !adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = verifySession(sessionToken, sessionSecret);
  if (!session || !isAuthorizedAdmin(session.id, adminId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const csrfToken = issueCsrfToken(sessionToken, sessionSecret);
  return res.status(200).json({ csrfToken });
};
