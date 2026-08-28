const { createOAuthChallenge, serializeCookie } = require('../../server/core/auth');

module.exports = async function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'OAuth client ID not configured' });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (req.connection && req.connection.encrypted ? 'https' : 'http');
  const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK_URL || `${proto}://${host}/api/auth/callback`;

  const { state, codeVerifier, codeChallenge } = createOAuthChallenge();

  const stateCookie = serializeCookie('oauth_state', state, { maxAge: 600, sameSite: 'Lax' });
  const verifierCookie = serializeCookie('oauth_verifier', codeVerifier, { maxAge: 600, sameSite: 'Lax' });

  res.setHeader('Set-Cookie', [stateCookie, verifierCookie]);
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('allow_signup', 'false');

  res.writeHead(302, { Location: authUrl.toString() });
  return res.end();
};
