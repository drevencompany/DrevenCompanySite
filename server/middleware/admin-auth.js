const { parseCookies, verifySession, verifyCsrfToken, isAuthorizedAdmin } = require('../core/auth');

function requireAdminAuth(req, res, { requireCsrf = false } = {}) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionToken = cookies.admin_session;
  const sessionSecret = process.env.SESSION_SECRET;
  const adminId = process.env.ADMIN_GITHUB_USER_ID;

  if (!sessionToken || !sessionSecret || !adminId) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing authentication session' });
    return null;
  }

  const session = verifySession(sessionToken, sessionSecret);
  if (!session || !isAuthorizedAdmin(session.id, adminId)) {
    res.status(401).json({ success: false, error: 'Unauthorized: invalid or expired session' });
    return null;
  }

  if (requireCsrf) {
    const csrfToken = req.headers['x-csrf-token'] || (req.body && req.body.csrfToken);
    if (!verifyCsrfToken(csrfToken, sessionToken, sessionSecret)) {
      res.status(403).json({ success: false, error: 'Forbidden: invalid or missing CSRF token' });
      return null;
    }
  }

  return session;
}

function expressAdminAuth(options = {}) {
  return (req, res, next) => {
    const session = requireAdminAuth(req, res, options);
    if (session) {
      req.adminSession = session;
      if (typeof next === 'function') next();
    }
  };
}

module.exports = {
  requireAdminAuth,
  expressAdminAuth
};
