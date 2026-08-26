const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Garante que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Garante que o arquivo de leads existe
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Salva um novo lead no banco de dados local
 * @param {Object} leadData - { name, email, ip, userAgent, source }
 * @returns {Object} Lead salvo com ID e timestamp
 */
function saveLead(leadData) {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    const leads = JSON.parse(raw || '[]');

    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: leadData.name ? leadData.name.trim() : '',
      email: leadData.email ? leadData.email.trim().toLowerCase() : '',
      phone: leadData.phone ? leadData.phone.trim() : '',
      segment: leadData.segment ? leadData.segment.trim() : '',
      ip: leadData.ip || 'unknown',
      userAgent: leadData.userAgent || 'unknown',
      source: leadData.source || 'website_contact_form',
      status: 'novo',
      createdAt: new Date().toISOString()
    };

    leads.unshift(newLead);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    return newLead;
  } catch (err) {
    console.error('[Storage Error] Falha ao salvar lead:', err);
    throw err;
  }
}

/**
 * Recupera a lista de leads
 * @param {number} limit
 * @returns {Array}
 */
function getLeads(limit = 50) {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    const leads = JSON.parse(raw || '[]');
    return leads.slice(0, limit);
  } catch (err) {
    console.error('[Storage Error] Falha ao ler leads:', err);
    return [];
  }
}

module.exports = {
  saveLead,
  getLeads
};
