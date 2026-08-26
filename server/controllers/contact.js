const { saveLead, getLeads } = require('../services/storage');
const { sendContactEmails } = require('../services/mailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Processa o envio do formulário de contato / diagnóstico
 */
async function handleContactForm(req, res) {
  try {
    const { name, email, phone, segment, hp, source } = req.body;

    // Honeypot anti-spam: se o campo invisível 'hp' estiver preenchido, é um bot
    if (hp) {
      console.warn('[Anti-Spam] Bot bloqueado via Honeypot');
      return res.status(200).json({ success: true, message: 'Solicitação processada com sucesso.' });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe seu nome completo válido.'
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe um endereço de e-mail corporativo válido.'
      });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Salva o lead no banco de dados local
    const savedLead = saveLead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      segment: segment ? String(segment).trim() : '',
      ip,
      userAgent,
      source: source || 'website_contact_form'
    });

    // 2. Dispara e-mails de notificação e confirmação em background
    sendContactEmails(savedLead).catch((err) => {
      console.error('[Contact Error] Erro no envio assíncrono de e-mails:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'Recebemos seu contato com sucesso. Entraremos em contato com brevidade para o diagnóstico.',
      leadId: savedLead.id
    });
  } catch (err) {
    console.error('[Contact Error] Erro ao processar formulário:', err);
    return res.status(500).json({
      success: false,
      error: 'Ocorreu um erro interno ao processar seu contato. Por favor, tente novamente ou use o WhatsApp direto.'
    });
  }
}

/**
 * Rota administrativa para consulta de leads
 */
function handleGetLeads(req, res) {
  const leads = getLeads(200);
  return res.json({ success: true, total: leads.length, leads });
}

/**
 * Rota administrativa para atualizar status ou notas de um lead
 */
function handleUpdateLead(req, res) {
  const { id } = req.params;
  const updates = req.body;
  const updated = updateLead(id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Lead não encontrado.' });
  }
  return res.json({ success: true, lead: updated });
}

/**
 * Rota administrativa para excluir um lead
 */
function handleDeleteLead(req, res) {
  const { id } = req.params;
  const success = deleteLead(id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Lead não encontrado.' });
  }
  return res.json({ success: true, message: 'Lead excluído com sucesso.' });
}

module.exports = {
  handleContactForm,
  handleGetLeads,
  handleUpdateLead,
  handleDeleteLead
};
