function requireValue(value, name) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    const error = new Error(`${name} is required`);
    error.code = 'CONFIG_MISSING';
    throw error;
  }
  return typeof value === 'string' ? value.trim() : value;
}

function requireSecret(value, name) {
  return requireValue(value, name);
}

function optionalValue(value, defaultValue = '') {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return defaultValue;
  }
  return typeof value === 'string' ? value.trim() : value;
}

function loadConfig(env = process.env) {
  const githubToken = requireSecret(env.GITHUB_TOKEN, 'GITHUB_TOKEN');
  const githubGistId = requireValue(env.GITHUB_GIST_ID || 'fe0ead3a7d55f1409f8b543010587b9e', 'GITHUB_GIST_ID');

  const smtpHost = optionalValue(env.SMTP_HOST, 'smtp.hostinger.com');
  const smtpPort = parseInt(optionalValue(env.SMTP_PORT, '465'), 10);
  const smtpUser = optionalValue(env.SMTP_USER, 'contato@dreven.company');
  const smtpPass = optionalValue(env.SMTP_PASS, '');
  const smtpSecure = env.SMTP_SECURE === 'true' || smtpPort === 465;

  const adminGithubUserIdStr = optionalValue(env.ADMIN_GITHUB_USER_ID, '');
  const adminGithubUserId = adminGithubUserIdStr ? parseInt(adminGithubUserIdStr, 10) : null;

  return {
    githubToken,
    githubGistId,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      secure: smtpSecure
    },
    adminGithubUserId,
    sessionSecret: optionalValue(env.SESSION_SECRET, ''),
    githubOAuth: {
      clientId: optionalValue(env.GITHUB_OAUTH_CLIENT_ID, ''),
      clientSecret: optionalValue(env.GITHUB_OAUTH_CLIENT_SECRET, '')
    },
    dataReadBackend: optionalValue(env.DATA_READ_BACKEND, 'gist'),
    dataWriteBackends: optionalValue(env.DATA_WRITE_BACKENDS, 'gist').split(',').map(s => s.trim()).filter(Boolean)
  };
}

module.exports = {
  loadConfig,
  requireValue,
  requireSecret,
  optionalValue
};
