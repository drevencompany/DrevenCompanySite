const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const ADMIN_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'admin-alert.html');
const CLIENT_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'client-ack.html');
const BANNER_IMAGE_PATH = path.join(__dirname, '..', '..', 'assets', 'email-banner.png');
const MONOGRAM_IMAGE_PATH = path.join(__dirname, '..', '..', 'assets', 'monogram.png');

/**
 * Cria o transporte do nodemailer baseado nas variáveis de ambiente
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

/**
 * Dispara e-mail de notificação para a Dreven e confirmação para o lead
 * @param {Object} lead - { name, email, createdAt }
 */
async function sendContactEmails(lead) {
  const transporter = createTransporter();
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || 'contato@dreven.company';
  const senderEmail = process.env.SMTP_FROM || `"Dreven Company" <${process.env.SMTP_USER || 'contato@dreven.company'}>`;

  const formattedDate = new Date(lead.createdAt || Date.now()).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  // Se não houver configuração SMTP ativa, loga no console e prossegue com segurança
  if (!transporter) {
    console.log('\n[Mailer Info] SMTP não configurado no .env. Dados do lead registrados com sucesso:');
    console.log(`- Nome: ${lead.name}`);
    console.log(`- E-mail: ${lead.email}`);
    console.log(`- Horário: ${formattedDate}\n`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    // 1. Notificação para a Dreven Company
    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    let adminHtml = fs.readFileSync(ADMIN_TEMPLATE_PATH, 'utf-8');
    adminHtml = adminHtml
      .replace(/{{NAME}}/g, lead.name)
      .replace(/{{EMAIL}}/g, lead.email)
      .replace(/{{PHONE}}/g, lead.phone || 'Não informado')
      .replace(/{{CLEAN_PHONE}}/g, cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`)
      .replace(/{{SEGMENT}}/g, lead.segment || 'Não informado')
      .replace(/{{DATETIME}}/g, formattedDate);

    await transporter.sendMail({
      from: senderEmail,
      to: receiverEmail,
      subject: `[Novo Lead] ${lead.name} — Diagnóstico Solicitado`,
      html: adminHtml
    });

    // 2. Confirmação para o cliente com banner embutido
    let clientHtml = fs.readFileSync(CLIENT_TEMPLATE_PATH, 'utf-8');
    clientHtml = clientHtml.replace(/{{NAME}}/g, lead.name);

    const attachments = [];
    if (fs.existsSync(BANNER_IMAGE_PATH)) {
      attachments.push({
        filename: 'dreven-banner.png',
        path: BANNER_IMAGE_PATH,
        cid: 'dreven-banner'
      });
    }
    if (fs.existsSync(MONOGRAM_IMAGE_PATH)) {
      attachments.push({
        filename: 'dreven-monogram.png',
        path: MONOGRAM_IMAGE_PATH,
        cid: 'dreven-monogram'
      });
    }

    await transporter.sendMail({
      from: senderEmail,
      to: lead.email,
      subject: `Recebemos sua solicitação — Dreven Company`,
      html: clientHtml,
      attachments
    });

    console.log(`[Mailer Success] Notificação e confirmação com banner enviadas com sucesso para ${lead.email}`);
    return { sent: true };
  } catch (err) {
    console.error('[Mailer Error] Falha ao disparar e-mail:', err);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendContactEmails
};
