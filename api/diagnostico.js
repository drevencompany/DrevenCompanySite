const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Utilize POST.'
    });
  }

  try {
    const {
      company,
      segment,
      moment,
      bottleneck,
      process_desc,
      data_location,
      frequency,
      impact,
      previous_attempts,
      decision_makers,
      timeline,
      channel,
      referrer,
      name,
      role,
      phone,
      email
    } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Por favor, informe seu nome completo.' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Por favor, informe um endereço de e-mail corporativo válido.' });
    }

    const cleanName = name.trim().replace(/[<>]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanCompany = company ? String(company).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanSegment = segment ? String(segment).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanMoment = moment ? String(moment).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanBottleneck = bottleneck ? String(bottleneck).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanProcess = process_desc ? String(process_desc).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanLocations = Array.isArray(data_location) ? data_location.join(', ') : (data_location || 'Não informado');
    const cleanFrequency = frequency ? String(frequency).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanImpact = impact ? String(impact).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanAttempts = previous_attempts ? String(previous_attempts).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanDecisors = decision_makers ? String(decision_makers).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanTimeline = timeline ? String(timeline).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanChannel = channel ? String(channel).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanReferrer = referrer ? String(referrer).trim().replace(/[<>]/g, '') : 'Não informado';
    const cleanRole = role ? String(role).trim().replace(/[<>]/g, '') : 'Não informado';

    const rawPhoneDigits = cleanPhone.replace(/\D/g, '');
    const wppLink = rawPhoneDigits ? `https://wa.me/${rawPhoneDigits.startsWith('55') ? rawPhoneDigits : '55' + rawPhoneDigits}` : '#';

    const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER || 'contato@dreven.company';
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const formattedDate = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    if (!pass) {
      console.warn('[Vercel Mailer Warning] SMTP_PASS não configurado nas Environment Variables.');
      return res.status(200).json({
        success: true,
        message: 'Diagnóstico recebido com sucesso.'
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    // 1. Notificação Completa para Dreven Company (Daniel M. Santos)
    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#F4F2F3; padding:30px; color:#090809;">
        <div style="max-width:680px; margin:0 auto; background:#fff; border:1px solid #E1E1E1; border-radius:6px; padding:32px; box-shadow: 0 4px 20px rgba(9,8,9,0.05);">
          <div style="font-weight:800; letter-spacing:0.24em; font-size:16px; margin-bottom:14px; text-transform: uppercase;">DREVEN CO.</div>
          <div style="display:inline-block; background:#090809; color:#F4F2F3; font-size:10.5px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; padding:6px 12px; border-radius:3px; margin-bottom:16px;">
            Novo Diagnóstico Operacional &amp; Briefing
          </div>
          <h2 style="margin:0 0 10px; font-size: 22px; font-weight: 800; letter-spacing:-0.02em;">${cleanCompany} (${cleanName})</h2>
          <p style="font-size:14px; color:#656565; line-height: 1.6; margin-bottom:24px;">Um novo cliente concluiu o mapeamento completo de processos e gargalos operacionais.</p>
          
          <!-- Bloco Decisor & Contato -->
          <div style="background:#F4F2F3; padding:18px; border-radius:4px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">Decisor &amp; Origem</div>
            <p style="margin:0 0 4px;"><strong>Nome:</strong> ${cleanName} (${cleanRole})</p>
            <p style="margin:0 0 4px;"><strong>Empresa / Operação:</strong> ${cleanCompany}</p>
            <p style="margin:0 0 4px;"><strong>E-mail:</strong> <a href="mailto:${cleanEmail}" style="color:#090809;">${cleanEmail}</a></p>
            <p style="margin:0 0 4px;"><strong>WhatsApp:</strong> <a href="${wppLink}" style="color:#090809; font-weight:600;">${cleanPhone}</a></p>
            <p style="margin:0 0 4px;"><strong>Canal de Origem:</strong> ${cleanChannel}</p>
            ${cleanChannel.includes('Indicação') ? `<p style="margin:0 0 4px; color:#090809; background:#fff; padding:6px 10px; border-radius:3px; display:inline-block;"><strong>👤 Quem indicou:</strong> ${cleanReferrer}</p>` : ''}
            <p style="margin:0;"><strong>Data / Horário:</strong> ${formattedDate}</p>
          </div>

          <!-- Bloco Diagnóstico de Engenharia -->
          <div style="background:#fff; border:1px solid #E1E1E1; padding:20px; border-radius:4px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:#090809; margin-bottom:12px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">Mapeamento Técnico &amp; Gargalos</div>
            
            <p style="margin:0 0 8px;"><strong>1. Segmento:</strong> ${cleanSegment}</p>
            <p style="margin:0 0 8px;"><strong>2. Momento Atual:</strong> ${cleanMoment}</p>
            <p style="margin:0 0 8px;"><strong>3. Gargalo Principal:</strong> ${cleanBottleneck}</p>
            
            <div style="margin:12px 0; background:#F4F2F3; padding:12px; border-radius:4px;">
              <strong>4. Como o processo funciona hoje (detalhe):</strong><br>
              <span style="color:#333; font-style:italic;">"${cleanProcess}"</span>
            </div>

            <p style="margin:0 0 8px;"><strong>5. Onde os dados ficam guardados:</strong> ${cleanLocations}</p>
            <p style="margin:0 0 8px;"><strong>6. Frequência do gargalo:</strong> ${cleanFrequency}</p>
            <p style="margin:0 0 8px;"><strong>7. Impacto / Consequência:</strong> ${cleanImpact}</p>
            <p style="margin:0 0 8px;"><strong>8. Tentativas anteriores:</strong> ${cleanAttempts}</p>
            <p style="margin:0 0 8px;"><strong>9. Quem decide:</strong> ${cleanDecisors}</p>
            <p style="margin:0 0 8px;"><strong>10. Prazo desejado:</strong> ${cleanTimeline}</p>
          </div>

          <!-- Ações Rápidas -->
          <div style="display:flex; gap:12px; margin-top:24px;">
            <a href="${wppLink}" style="display:inline-block; background:#090809; color:#F4F2F3; padding:12px 24px; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:3px; font-weight:700;">Chamar Decisor no WhatsApp</a>
            <a href="mailto:${cleanEmail}?subject=Dreven%20Company%20%E2%80%94%20Diagn%C3%B3stico%20T%C3%A9cnico%20%E2%80%A2%20${encodeURIComponent(cleanCompany)}" style="display:inline-block; background:#E1E1E1; color:#090809; padding:12px 24px; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:3px; font-weight:700;">Responder por E-mail</a>
          </div>

          <div style="margin-top:32px; font-size:11px; color:#656565; border-top:1px solid #E1E1E1; padding-top:16px; text-align:center;">
            Dreven Company &copy; 2026 · Painel de Engenharia &amp; Diagnóstico
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Dreven Company" <${user}>`,
      to: 'contato@dreven.company',
      subject: `[Diagnóstico Estratégico] ${cleanCompany} — ${cleanName}`,
      html: adminHtml
    });

    // 2. Confirmação VIP para o Cliente
    const clientHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#F4F2F3; padding:30px; color:#090809;">
        <div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #E1E1E1; border-radius:6px; padding:36px; box-shadow: 0 4px 20px rgba(9,8,9,0.05);">
          <div style="font-weight:800; letter-spacing:0.24em; font-size:18px; margin-bottom:20px; text-transform: uppercase;">DREVEN CO.</div>
          <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Olá, ${cleanName}.</h2>
          <p style="font-size:14.5px; line-height:1.7; color:#383536;">Recebemos com sucesso as respostas do diagnóstico operacional da <strong>${cleanCompany}</strong>.</p>
          <p style="font-size:14.5px; line-height:1.7; color:#383536;">Nosso time de engenharia e produto — liderado por <strong>Daniel M. Santos</strong> — está analisando cada gargalo e detalhe compartilhado para estruturar a arquitetura técnica ideal antes de qualquer conversa.</p>
          <div style="background:#F4F2F3; border-left:2px solid #090809; padding:16px; border-radius:4px; margin:22px 0; font-size:13.5px; color: #090809; font-weight: 500;">
            “Não vendemos serviços genéricos. Construímos o que usaríamos nós mesmos, com o padrão que usaríamos para nós mesmos.”
          </div>
          <p style="font-size:14px; line-height:1.7; color:#656565;">Em breve entraremos em contato diretamente com você através do WhatsApp e por este e-mail para apresentar a devolutiva com a leitura de cenário e próximos passos.</p>
          
          <div style="text-align:center; margin-top:24px; padding-top:20px; border-top:1px solid #E1E1E1;">
            <a href="https://wa.me/5541920046931" style="display:inline-block; background:#090809; color:#F4F2F3; padding:12px 24px; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; text-decoration:none; border-radius:3px;">Falar com Daniel no WhatsApp</a>
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
      to: cleanEmail,
      subject: `Diagnóstico Recebido — Dreven Company`,
      html: clientHtml
    });

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico recebido com sucesso.'
    });

  } catch (err) {
    console.error('[Serverless Briefing Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar diagnóstico.'
    });
  }
};
