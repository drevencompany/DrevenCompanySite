const https = require('node:https');
const { parseCookies, serializeCookie, issueSession, isAuthorizedAdmin } = require('../../server/core/auth');

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const payload = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'DrevenCompany-App',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') });
        } catch {
          resolve({ statusCode: res.statusCode, data: {} });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(urlStr, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'DrevenCompany-App',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') });
        } catch {
          resolve({ statusCode: res.statusCode, data: {} });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const cookies = parseCookies(req.headers.cookie || '');
  const storedState = cookies.oauth_state;
  const storedVerifier = cookies.oauth_verifier;

  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state || !storedState || state !== storedState || !storedVerifier) {
    return res.status(400).json({ error: 'Invalid OAuth state or missing code' });
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const adminId = process.env.ADMIN_GITHUB_USER_ID;

  if (!clientId || !clientSecret || !sessionSecret || !adminId) {
    return res.status(500).json({ error: 'Server authentication configuration missing' });
  }

  try {
    const tokenRes = await postJson('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: storedVerifier
    });

    const accessToken = tokenRes.data && tokenRes.data.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'Failed to obtain access token' });
    }

    const userRes = await getJson('https://api.github.com/user', accessToken);
    const githubUser = userRes.data;

    if (!githubUser || !isAuthorizedAdmin(githubUser.id, adminId)) {
      return res.status(403).json({ error: 'Access denied: unauthorized user' });
    }

    const sessionToken = issueSession({ id: githubUser.id, login: githubUser.login }, sessionSecret);
    const sessionCookie = serializeCookie('admin_session', sessionToken, { maxAge: 86400, sameSite: 'Strict' });
    const clearState = serializeCookie('oauth_state', '', { maxAge: 0, sameSite: 'Lax' });
    const clearVerifier = serializeCookie('oauth_verifier', '', { maxAge: 0, sameSite: 'Lax' });

    res.setHeader('Set-Cookie', [sessionCookie, clearState, clearVerifier]);
    res.writeHead(302, { Location: '/admin' });
    return res.end();
  } catch {
    return res.status(500).json({ error: 'Authentication exchange failed' });
  }
};
