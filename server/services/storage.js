const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const BRIEFINGS_FILE = path.join(DATA_DIR, 'briefings.json');

// Garante que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Garante que os arquivos JSON existem
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
}
if (!fs.existsSync(BRIEFINGS_FILE)) {
  fs.writeFileSync(BRIEFINGS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Helper de Linha Sugerida
function calculateLinhaSugerida(gargalo) {
  if (!gargalo) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('Conversão') || gargalo.includes('Presença')) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('plataforma') || gargalo.includes('app próprio') || gargalo.includes('Web App')) return 'Linha 2 · Produto Digital (Web App/Portal)';
  if (gargalo.includes('Processos manuais') || gargalo.includes('retrabalho')) return 'Linha 2 / 3 · Sistemas & Automações';
  if (gargalo.includes('desconectados') || gargalo.includes('Integrações')) return 'Linha 3 · Integrações & Engenharia';
  if (gargalo.includes('IA') || gargalo.includes('Inteligência Artificial')) return 'Linha 3 · Motores de Regras & IA';
  return 'Linha 1 · Presença Digital';
}

/* ── LEADS ───────────────────────────────────────────────────────── */
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

function getLeads() {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function updateLead(id, updates) {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    const leads = JSON.parse(raw || '[]');
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return null;

    leads[index] = {
      ...leads[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    return leads[index];
  } catch (err) {
    console.error('[Storage Error] Falha ao atualizar lead:', err);
    throw err;
  }
}

function deleteLead(id) {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    let leads = JSON.parse(raw || '[]');
    const initialLen = leads.length;
    leads = leads.filter(l => l.id !== id);
    if (leads.length === initialLen) return false;

    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage Error] Falha ao excluir lead:', err);
    throw err;
  }
}

/* ── BRIEFINGS / DIAGNÓSTICOS (PLANO V2) ─────────────────────────── */
function saveBriefing(data) {
  try {
    const raw = fs.readFileSync(BRIEFINGS_FILE, 'utf-8');
    const briefings = JSON.parse(raw || '[]');

    const gargalo = data.gargalo_principal || data.bottleneck || '';
    const linhaSugerida = calculateLinhaSugerida(gargalo);

    const newBriefing = {
      id: `briefing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      empresa: (data.empresa || data.company || 'Não informado').trim(),
      segmento: (data.segmento || data.segment || 'Geral').trim(),
      momento: (data.momento || data.moment || 'Não informado').trim(),
      gargalo_principal: gargalo.trim(),
      linha_sugerida: linhaSugerida,
      descricao_livre: (data.descricao_livre || data.process_desc || '').trim(),
      ferramentas_atuais: Array.isArray(data.ferramentas_atuais || data.data_location) 
        ? (data.ferramentas_atuais || data.data_location).join(', ') 
        : (data.ferramentas_atuais || data.data_location || 'Não informado'),
      frequencia: (data.frequencia || data.frequency || 'Não informado').trim(),
      impacto: (data.impacto || data.impact || 'Não informado').trim(),
      tentativas_anteriores: (data.tentativas_anteriores || data.previous_attempts || 'Não informado').trim(),
      estrutura_decisoria: (data.estrutura_decisoria || data.decision_makers || 'Não informado').trim(),
      prazo_esperado: (data.prazo_esperado || data.timeline || 'Não informado').trim(),
      canal_origem: (data.canal_origem || data.channel || 'Direto').trim(),
      indicado_por: (data.indicado_por || data.referrer || '').trim(),
      contato_nome: (data.contato_nome || data.name || 'Decisor').trim(),
      contato_cargo: (data.contato_cargo || data.role || 'Responsável').trim(),
      contato_whatsapp: (data.contato_whatsapp || data.phone || '').trim(),
      contato_email: (data.contato_email || data.email || '').trim().toLowerCase(),
      consentimento_lgpd: Boolean(data.consentimento_lgpd !== false),
      consentimento_lgpd_em: data.consentimento_lgpd_em || new Date().toISOString(),
      status: 'novo',
      createdAt: new Date().toISOString()
    };

    briefings.unshift(newBriefing);
    fs.writeFileSync(BRIEFINGS_FILE, JSON.stringify(briefings, null, 2), 'utf-8');
    return newBriefing;
  } catch (err) {
    console.error('[Storage Error] Falha ao salvar briefing:', err);
    throw err;
  }
}

function getBriefings() {
  try {
    const raw = fs.readFileSync(BRIEFINGS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function updateBriefing(id, updates) {
  try {
    const raw = fs.readFileSync(BRIEFINGS_FILE, 'utf-8');
    const briefings = JSON.parse(raw || '[]');
    const index = briefings.findIndex(b => b.id === id);
    if (index === -1) return null;

    briefings[index] = {
      ...briefings[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(BRIEFINGS_FILE, JSON.stringify(briefings, null, 2), 'utf-8');
    return briefings[index];
  } catch (err) {
    console.error('[Storage Error] Falha ao atualizar briefing:', err);
    throw err;
  }
}

function deleteBriefing(id) {
  try {
    const raw = fs.readFileSync(BRIEFINGS_FILE, 'utf-8');
    let briefings = JSON.parse(raw || '[]');
    const initialLen = briefings.length;
    briefings = briefings.filter(b => b.id !== id);
    if (briefings.length === initialLen) return false;

    fs.writeFileSync(BRIEFINGS_FILE, JSON.stringify(briefings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage Error] Falha ao excluir briefing:', err);
    throw err;
  }
}

module.exports = {
  saveLead,
  getLeads,
  updateLead,
  deleteLead,
  saveBriefing,
  getBriefings,
  updateBriefing,
  deleteBriefing,
  calculateLinhaSugerida
};
