const nodemailer = require('nodemailer');
const { loadConfig } = require('../core/config');
const { createGistRepository } = require('./gist-repository');
const { createMailService } = require('../core/mail-service');

let sharedRepo = null;
let sharedMailer = null;

function getSharedRepository() {
  if (sharedRepo) return sharedRepo;
  try {
    const config = loadConfig(process.env);
    sharedRepo = createGistRepository({
      token: config.githubToken,
      gistId: config.githubGistId
    });
    return sharedRepo;
  } catch {
    return createGistRepository({ token: '', gistId: '' });
  }
}

function getSharedMailer() {
  if (sharedMailer) return sharedMailer;
  try {
    const config = loadConfig(process.env);
    let transport = null;
    if (config.smtp && config.smtp.pass) {
      transport = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      });
    }
    sharedMailer = createMailService({
      transport,
      fromAddress: config.smtp ? config.smtp.user : 'contato@dreven.company',
      adminEmail: 'contato@dreven.company'
    });
    return sharedMailer;
  } catch {
    return createMailService({ transport: null });
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
  getSharedMailer,
  parseRequestBody
};
