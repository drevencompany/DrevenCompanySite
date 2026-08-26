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
 * Rota administrativa para consulta de leads (opcional/protegida)
 */
function handleGetLeads(req, res) {
  const apiKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const leads = getLeads(100);
  return res.json({ total: leads.length, leads });
}

module.exports = {
  handleContactForm,
  handleGetLeads
};
