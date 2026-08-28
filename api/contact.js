const db = require('./lib/db');
const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^s@]+@[^s@]+.[^s@]+$/;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  try {
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try { parsedBody = JSON.parse(parsedBody); } catch (e) { parsedBody = {}; }
    }
    const { name, email, phone, segment, hp } = parsedBody || {};

    if (hp) {
      return res.status(200).json({ success: true, message: 'Processado com sucesso.' });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe seu nome completo válido.'
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.length > 120) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, informe um endereço de e-mail válido.'
      });
    }

    const cleanName = name.trim().replace(/[<>]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanSegment = segment ? String(segment).trim().replace(/[<>]/g, '') : 'Não informado';
    const rawPhoneDigits = cleanPhone.replace(/\D/g, '');
    const wppLink = rawPhoneDigits ? `https://wa.me/${rawPhoneDigits.startsWith('55') ? rawPhoneDigits : '55' + rawPhoneDigits}` : '#';

    // 1. SALVAR NO BANCO DE DADOS EM NUVEM
    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      segment: cleanSegment,
      source: 'Formulário do Site',
      status: 'novo',
      notes: '',
      createdAt: new Date().toISOString()
    };

    try {
      await db.saveLead(newLead);
      console.log('[Lead Cloud Saved]:', newLead.id, cleanName);
    } catch (saveErr) {
      console.error('[DB Cloud Save Lead Error]:', saveErr);
    }

    // 2. DISPARAR NOTIFICAÇÕES POR E-MAIL (ISOLADO EM TRY/CATCH)
    try {
      const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const user = process.env.SMTP_USER || 'contato@dreven.company';
      const pass = process.env.SMTP_PASS;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      if (pass) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass }
        });

        const formattedDate = new Date().toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'full',
          timeStyle: 'medium'
        });

        const adminHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#F4F2F3; padding:30px; color:#090809;">
            <div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #E1E1E1; border-radius:6px; padding:30px; box-shadow: 0 4px 20px rgba(9,8,9,0.05);">
              <div style="font-weight:800; letter-spacing:0.22em; font-size:16px; margin-bottom:16px; text-transform: uppercase;">DREVEN CO.</div>
              <div style="display:inline-block; background:#090809; color:#F4F2F3; font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; padding:5px 10px; border-radius:3px; margin-bottom:14px;">Novo Lead · Rodapé do Site</div>
              <h2 style="margin:0 0 14px; font-size: 20px; font-weight: 800;">Solicitação de Contato Recebida</h2>
              <p style="font-size:14px; color:#656565; line-height: 1.6;">Um novo visitante solicitou início de conversa através do formulário principal.</p>
              <div style="background:#F4F2F3; padding:18px; border-radius:4px; margin:18px 0; font-size:14px;">
                <p style="margin:0 0 8px;"><strong>Nome:</strong> ${cleanName}</p>
                <p style="margin:0 0 8px;"><strong>E-mail:</strong> <a href="mailto:${cleanEmail}" style="color:#090809;">${cleanEmail}</a></p>
                <p style="margin:0 0 8px;"><strong>WhatsApp / Telefone:</strong> <a href="${wppLink}" style="color:#090809;">${cleanPhone}</a></p>
                <p style="margin:0 0 8px;"><strong>Segmento / Nicho:</strong> ${cleanSegment}</p>
                <p style="margin:0;"><strong>Data e Horário:</strong> ${formattedDate}</p>
              </div>
              <div style="display:flex; gap:10px; margin-top:20px;">
                <a href="${wppLink}" style="display:inline-block; background:#090809; color:#F4F2F3; padding:12px 20px; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:3px; font-weight:700;">Chamar no WhatsApp</a>
                <a href="mailto:${cleanEmail}?subject=Dreven%20Company%20%E2%80%94%20Diagn%C3%B3stico%20e%20Alinhamento%20Estrat%C3%A9gico" style="display:inline-block; background:#E1E1E1; color:#090809; padding:12px 20px; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:3px; font-weight:700;">Responder por E-mail</a>
              </div>
              <div style="margin-top:28px; font-size:11px; color:#656565; border-top:1px solid #E1E1E1; padding-top:16px; text-align:center;">
                Dreven Company &copy; 2026 · Curitiba, Paraná, Brasil
              </div>
            </div>
          </div>
        `;

        const clientHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#F4F2F3; padding:30px; color:#090809;">
            <div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #E1E1E1; border-radius:6px; padding:36px; box-shadow: 0 4px 20px rgba(9,8,9,0.05);">
              <div style="font-weight:800; letter-spacing:0.24em; font-size:18px; margin-bottom:20px; text-transform: uppercase;">DREVEN CO.</div>
              <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Olá, ${cleanName}.</h2>
              <p style="font-size:14.5px; line-height:1.7; color:#383536;">Confirmamos o recebimento da sua mensagem através do site oficial da <strong>Dreven Company</strong>.</p>
              <p style="font-size:14.5px; line-height:1.7; color:#383536;">Analisamos cada solicitação minuciosamente para compreender a sua necessidade. Em breve, entraremos em contato diretamente com você pelo WhatsApp ou e-mail.</p>
              <div style="background:#F4F2F3; border-left:2px solid #090809; padding:16px; border-radius:4px; margin:22px 0; font-size:13.5px; color: #090809; font-weight: 500;">
                “Não vendemos serviços genéricos. Construímos o que usaríamos nós mesmos, com o padrão que usaríamos para nós mesmos.”
              </div>
              <div style="text-align:center; margin-top:24px; padding-top:20px; border-top:1px solid #E1E1E1;">
                <p style="font-size:13px; color:#656565; margin:0 0 10px;">Caso tenha urgência ou queira falar diretamente conosco:</p>
                <a href="https://wa.me/5541920046931" style="display:inline-block; background:#090809; color:#F4F2F3; padding:12px 24px; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; text-decoration:none; border-radius:3px;">Falar pelo WhatsApp Oficial</a>
              </div>
              <div style="margin-top:32px; padding-top:22px; border-top:1px solid #E1E1E1; font-size:13px; color:#656565; line-height: 1.6;">
                <div style="font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #656565; margin-bottom: 6px;">Estratégia · Produto · Engenharia · IA</div>
                <div style="margin-bottom: 8px;">
                  <a href="mailto:contato@dreven.company" style="color: #090809; text-decoration: underline;">contato@dreven.company</a><br>
                  <a href="https://wa.me/5541920046931" style="color: #090809; text-decoration: none;">+55 (41) 92004-6931</a>
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #090809; margin-bottom: 2px;">Daniel M. Santos</div>
                <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #090809;">Dreven Company</div>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Dreven Company" <${user}>`,
          to: 'contato@dreven.company',
          subject: `[Novo Lead] ${cleanName} — Contato via Site`,
          html: adminHtml
        });

        await transporter.sendMail({
          from: `"Dreven Company" <${user}>`,
          to: cleanEmail,
          subject: `Recebemos sua mensagem — Dreven Company`,
          html: clientHtml
        });
      }
    } catch (mailErr) {
      console.warn('[Nodemailer Warning (Lead já salvo no banco)]:', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Recebemos seu contato com sucesso. Entraremos em contato com brevidade.',
      lead: newLead
    });
  } catch (err) {
    console.error('[Serverless Contact Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar envio.'
    });
  }
};
