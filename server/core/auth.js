const crypto = require('node:crypto');

function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createOAuthChallenge() {
  const state = base64url(crypto.randomBytes(32));
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  return { state, codeVerifier, codeChallenge };
}

function verifyCodeChallenge(verifier, challenge) {
  if (!verifier || !challenge) return false;
  const computed = base64url(crypto.createHash('sha256').update(verifier).digest());
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(challenge));
}

function sign(data, secret) {
  return base64url(crypto.createHmac('sha256', secret).update(data).digest());
}

function issueSession(user, secret, { ttlSeconds = 86400 } = {}) {
  if (!secret) throw new Error('SESSION_SECRET is required to issue session');
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
    login: user.login || '',
    iat: now,
    exp: now + ttlSeconds
  };
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function verifySession(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSig = sign(encodedPayload, secret);
  if (signature.length !== expectedSig.length) return null;

  const sigValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  if (!sigValid) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function issueCsrfToken(sessionToken, secret) {
  if (!sessionToken || !secret) return '';
  const hash = sign(`csrf:${sessionToken}`, secret);
  return hash;
}

function verifyCsrfToken(csrfToken, sessionToken, secret) {
  if (!csrfToken || !sessionToken || !secret) return false;
  const expected = issueCsrfToken(sessionToken, secret);
  if (csrfToken.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(csrfToken), Buffer.from(expected));
}

function isAuthorizedAdmin(userId, expectedAdminId) {
  if (userId === undefined || userId === null || expectedAdminId === undefined || expectedAdminId === null) {
    return false;
  }
  const numericId = parseInt(String(userId), 10);
  const expectedNumeric = parseInt(String(expectedAdminId), 10);
  if (Number.isNaN(numericId) || Number.isNaN(expectedNumeric)) return false;
  return numericId === expectedNumeric;
}

function parseCookies(cookieHeader = '') {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      cookies[name] = decodeURIComponent(val);
    }
  });
  return cookies;
}

function serializeCookie(name, val, options = {}) {
  const opt = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    ...options
  };
  let cookie = `${name}=${encodeURIComponent(val)}`;
  if (opt.maxAge !== undefined) cookie += `; Max-Age=${opt.maxAge}`;
  if (opt.domain) cookie += `; Domain=${opt.domain}`;
  if (opt.path) cookie += `; Path=${opt.path}`;
  if (opt.expires) cookie += `; Expires=${opt.expires.toUTCString()}`;
  if (opt.httpOnly) cookie += '; HttpOnly';
  if (opt.secure) cookie += '; Secure';
  if (opt.sameSite) cookie += `; SameSite=${opt.sameSite}`;
  return cookie;
}

module.exports = {
  createOAuthChallenge,
  verifyCodeChallenge,
  issueSession,
  verifySession,
  issueCsrfToken,
  verifyCsrfToken,
  isAuthorizedAdmin,
  parseCookies,
  serializeCookie
};
