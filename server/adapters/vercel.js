const { loadConfig } = require('../core/config');
const { createGistRepository } = require('./gist-repository');

let sharedRepo = null;

function getSharedRepository() {
  if (sharedRepo) return sharedRepo;
  try {
    const config = loadConfig(process.env);
    sharedRepo = createGistRepository({
      token: config.githubToken,
      gistId: config.githubGistId
    });
    return sharedRepo;
  } catch (err) {
    // If config fails to load, create a fallback repo instance that fails closed
    return createGistRepository({ token: '', gistId: '' });
  }
}

function parseRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = {
  getSharedRepository,
  parseRequestBody
};
