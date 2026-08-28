const { escapeHtml, escapeUrlParam } = require('./escape');

function formatWhatsAppLink(phone) {
  if (!phone) return '#';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '#';
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

function createMailService({ transport, fromAddress = 'contato@dreven.company', adminEmail = 'contato@dreven.company' } = {}) {
  const fromHeader = `"Dreven Company" <${fromAddress}>`;

  async function sendContact(lead) {
    if (!transport || typeof transport.sendMail !== 'function') {
      return { sent: false };
    }

    const safeName = escapeHtml(lead.name);
    const safeEmail = escapeHtml(lead.email);
    const safePhone = escapeHtml(lead.phone || 'Não informado');
    const safeSegment = escapeHtml(lead.segment || 'Não informado');
    const wppLink = formatWhatsAppLink(lead.phone);

    const formattedDate = new Date(lead.createdAt || Date.now()).toLocaleString('pt-BR', {
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
            <p style="margin:0 0 8px;"><strong>Nome:</strong> ${safeName}</p>
            <p style="margin:0 0 8px;"><strong>E-mail:</strong> <a href="mailto:${safeEmail}" style="color:#090809;">${safeEmail}</a></p>
            <p style="margin:0 0 8px;"><strong>WhatsApp / Telefone:</strong> <a href="${wppLink}" style="color:#090809;">${safePhone}</a></p>
            <p style="margin:0 0 8px;"><strong>Segmento / Nicho:</strong> ${safeSegment}</p>
            <p style="margin:0;"><strong>Data e Horário:</strong> ${formattedDate}</p>
          </div>
          <div style="display:flex; gap:10px; margin-top:20px;">
            <a href="${wppLink}" style="display:inline-block; background:#090809; color:#F4F2F3; padding:12px 20px; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:3px; font-weight:700;">Chamar no WhatsApp</a>
            <a href="mailto:${safeEmail}?subject=Dreven%20Company%20%E2%80%94%20Diagn%C3%B3stico" style="display:inline-block; background:#E1E1E1; color:#090809; padding:12px 20px; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:3px; font-weight:700;">Responder por E-mail</a>
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
          <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Olá, ${safeName}.</h2>
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

    try {
      await Promise.all([
        transport.sendMail({
          from: fromHeader,
          to: adminEmail,
          subject: `[Novo Lead] ${safeName} — Contato via Site`,
          html: adminHtml
        }),
        transport.sendMail({
          from: fromHeader,
          to: lead.email,
          subject: 'Recebemos sua mensagem — Dreven Company',
          html: clientHtml
        })
      ]);
      return { sent: true };
    } catch (err) {
      return { sent: false, error: err };
    }
  }

  async function sendDiagnostic(diagnostic) {
    if (!transport || typeof transport.sendMail !== 'function') {
      return { sent: false };
    }

    const safeCompany = escapeHtml(diagnostic.empresa);
    const safeName = escapeHtml(diagnostic.contato_nome);
    const safeCargo = escapeHtml(diagnostic.contato_cargo);
    const safeEmail = escapeHtml(diagnostic.contato_email);
    const safePhone = escapeHtml(diagnostic.contato_whatsapp);
    const safeSegment = escapeHtml(diagnostic.segmento);
    const safeLinha = escapeHtml(diagnostic.linha_sugerida);
    const safeGargalo = escapeHtml(diagnostic.gargalo_principal);
    const safeProcess = escapeHtml(diagnostic.descricao_livre);
    const safeTools = escapeHtml(diagnostic.ferramentas_atuais);
    const safeFreq = escapeHtml(diagnostic.frequencia);
    const safeImpact = escapeHtml(diagnostic.impacto);
    const safeAttempts = escapeHtml(diagnostic.tentativas_anteriores);
    const safeDecision = escapeHtml(diagnostic.estrutura_decisoria);
    const safeTimeline = escapeHtml(diagnostic.prazo_esperado);
    const safeChannel = escapeHtml(diagnostic.canal_origem);
    const safeReferrer = escapeHtml(diagnostic.indicado_por || '');

    const wppLink = formatWhatsAppLink(diagnostic.contato_whatsapp);

    const formattedDate = new Date(diagnostic.createdAt || Date.now()).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const rawFormattedBriefing = `Novo diagnóstico — ${diagnostic.empresa} (${diagnostic.linha_sugerida})

Empresa: ${diagnostic.empresa}
Segmento: ${diagnostic.segmento}
Momento atual: ${diagnostic.momento}
Gargalo principal: ${diagnostic.gargalo_principal} → Linha sugerida: ${diagnostic.linha_sugerida}

Como funciona hoje:
${diagnostic.descricao_livre}

Ferramentas atuais: ${diagnostic.ferramentas_atuais}
Frequência do problema: ${diagnostic.frequencia}
Impacto quando falha: ${diagnostic.impacto}
Tentativas anteriores: ${diagnostic.tentativas_anteriores}

Estrutura decisória: ${diagnostic.estrutura_decisoria}
Prazo esperado: ${diagnostic.prazo_esperado}
Canal de origem: ${diagnostic.canal_origem}${diagnostic.indicado_por ? ` (Indicado por: ${diagnostic.indicado_por})` : ''}

Contato: ${diagnostic.contato_nome} (${diagnostic.contato_cargo}) · ${diagnostic.contato_whatsapp} · ${diagnostic.contato_email}`;

    const adminHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F4F2F3; padding:32px 16px; color:#090809;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #E1E1E1; border-radius:8px; padding:36px 32px; box-shadow: 0 4px 24px rgba(9,8,9,0.06);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EAEAEA; padding-bottom:18px; margin-bottom:24px;">
            <div style="font-weight:800; letter-spacing:0.24em; font-size:16px; text-transform: uppercase; color:#090809;">DREVEN CO.</div>
            <div style="background:#090809; color:#F4F2F3; font-size:10px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; padding:5px 12px; border-radius:3px;">
              Diagnóstico Estratégico
            </div>
          </div>

          <h2 style="margin:0 0 6px; font-size: 22px; font-weight: 800; letter-spacing:-0.02em; color:#090809;">${safeCompany}</h2>
          <div style="font-size:13.5px; color:#656565; margin-bottom:24px;">
            Decisor: <strong>${safeName}</strong> (${safeCargo}) · ${safeSegment} · <span style="display:inline-block; background:#EAEAEA; color:#090809; padding:2px 8px; border-radius:3px; font-weight:700; font-size:11px;">${safeLinha}</span>
          </div>

          <div style="margin-bottom:24px; display:flex; flex-wrap:wrap; gap:8px;">
            <a href="${wppLink}" target="_blank" style="display:inline-block; background:#090809; color:#F4F2F3; padding:10px 18px; font-size:11px; text-transform:uppercase; letter-spacing:0.16em; text-decoration:none; border-radius:4px; font-weight:700;">📱 Chamar no WhatsApp</a>
            <a href="mailto:${safeEmail}?subject=Dreven%20Company%20%E2%80%94%20Diagn%C3%B3stico%20T%C3%A9cnico%20%E2%80%A2%20${escapeUrlParam(diagnostic.empresa)}" style="display:inline-block; background:#EAEAEA; color:#090809; padding:10px 18px; font-size:11px; text-transform:uppercase; letter-spacing:0.16em; text-decoration:none; border-radius:4px; font-weight:700;">✉️ Responder por E-mail</a>
          </div>

          <div style="background:#F4F2F3; padding:18px 20px; border-radius:6px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
            <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">1. Decisor &amp; Procedência</div>
            <p style="margin:0 0 4px;"><strong>Nome:</strong> ${safeName} (${safeCargo})</p>
            <p style="margin:0 0 4px;"><strong>Empresa:</strong> ${safeCompany}</p>
            <p style="margin:0 0 4px;"><strong>E-mail:</strong> <a href="mailto:${safeEmail}" style="color:#090809; text-decoration:underline;">${safeEmail}</a></p>
            <p style="margin:0 0 4px;"><strong>WhatsApp:</strong> <a href="${wppLink}" target="_blank" style="color:#090809; font-weight:700; text-decoration:none;">📱 ${safePhone}</a></p>
            <p style="margin:0 0 4px;"><strong>Canal de Origem:</strong> ${safeChannel}</p>
            ${safeReferrer ? `<div style="margin-top:8px; background:#ffffff; border:1px solid #E1E1E1; padding:8px 12px; border-radius:4px; font-weight:600; color:#090809;">👤 <strong>Indicado por:</strong> ${safeReferrer}</div>` : ''}
          </div>

          <div style="background:#ffffff; border:1px solid #E1E1E1; padding:20px; border-radius:6px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
            <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:12px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">2. Diagnóstico Técnico &amp; Gargalos</div>
            <p style="margin:0 0 6px;"><strong>Segmento:</strong> ${safeSegment}</p>
            <p style="margin:0 0 6px;"><strong>Gargalo Principal:</strong> ${safeGargalo}</p>
            <div style="margin:14px 0; background:#F4F2F3; border-left:3px solid #090809; padding:14px 16px; border-radius:0 4px 4px 0;">
              <strong style="font-size:12.5px; text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:4px; color:#090809;">Como funciona hoje na prática:</strong>
              <span style="color:#222; font-style:italic; font-size:14px;">"${safeProcess}"</span>
            </div>
            <p style="margin:0 0 6px;"><strong>Onde as informações ficam:</strong> ${safeTools}</p>
            <p style="margin:0 0 6px;"><strong>Frequência do Problema:</strong> ${safeFreq}</p>
            <p style="margin:0 0 6px;"><strong>Impacto quando falha:</strong> ${safeImpact}</p>
            <p style="margin:0 0 6px;"><strong>Tentativas anteriores:</strong> ${safeAttempts}</p>
          </div>

          <div style="background:#F4F2F3; padding:18px 20px; border-radius:6px; margin-bottom:24px; font-size:13.5px; line-height:1.7;">
            <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">3. Decisão &amp; Prazos</div>
            <p style="margin:0 0 4px;"><strong>Estrutura Decisória:</strong> ${safeDecision}</p>
            <p style="margin:0 0 4px;"><strong>Prazo Esperado:</strong> ${safeTimeline}</p>
            <p style="margin:0 0 4px;"><strong>Data do Preenchimento:</strong> ${formattedDate}</p>
          </div>

          <div style="font-size:11px; color:#656565; border-top:1px solid #E1E1E1; padding-top:18px; text-align:center;">
            Dreven Company &copy; 2026 · Estratégia · Marca · Produto · Engenharia · IA · Governança
          </div>
        </div>
      </div>
    `;

    const clientHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F4F2F3; padding:32px 16px; color:#090809;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #E1E1E1; border-radius:8px; padding:38px 32px; box-shadow: 0 4px 24px rgba(9,8,9,0.06);">
          <div style="font-weight:800; letter-spacing:0.24em; font-size:18px; margin-bottom:22px; text-transform: uppercase; color:#090809;">DREVEN CO.</div>
          <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color:#090809;">Olá, ${safeName}.</h2>
          <p style="font-size:14.5px; line-height:1.75; color:#383536; margin-bottom:14px;">
            Recebemos o diagnóstico da <strong>${safeCompany}</strong>. Vamos analisar o que você descreveu antes de qualquer proposta — sem isso, qualquer solução seria genérica.
          </p>
          <p style="font-size:14.5px; line-height:1.75; color:#383536; margin-bottom:20px;">
            Nosso time de engenharia e produto — liderado por <strong>Daniel M. Santos</strong> — está avaliando o cenário da sua operação e retornaremos por WhatsApp ou e-mail assim que a leitura estiver pronta.
          </p>
          <div style="background:#F4F2F3; border-left:2px solid #090809; padding:16px 18px; border-radius:4px; margin:24px 0; font-size:13.5px; color: #090809; font-weight: 500; line-height: 1.6;">
            “Não vendemos serviços genéricos. Construímos o que usaríamos nós mesmos, com o padrão que usaríamos para nós mesmos.”
          </div>
          <div style="text-align:center; margin-top:24px; padding-top:20px; border-top:1px solid #E1E1E1;">
            <p style="font-size:13px; color:#656565; margin:0 0 12px;">Caso precise falar diretamente com Daniel antes do contato:</p>
            <a href="https://wa.me/5541920046931" style="display:inline-block; background:#090809; color:#F4F2F3; padding:12px 24px; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; text-decoration:none; border-radius:3px;">Falar com Daniel no WhatsApp</a>
          </div>
        </div>
      </div>
    `;

    try {
      await Promise.all([
        transport.sendMail({
          from: fromHeader,
          to: adminEmail,
          subject: `Novo diagnóstico — ${safeCompany} (${safeLinha})`,
          html: adminHtml,
          text: rawFormattedBriefing
        }),
        transport.sendMail({
          from: fromHeader,
          to: diagnostic.contato_email,
          subject: 'Diagnóstico recebido — Dreven Company',
          html: clientHtml
        })
      ]);
      return { sent: true };
    } catch (err) {
      return { sent: false, error: err };
    }
  }

  return {
    sendContact,
    sendDiagnostic
  };
}

module.exports = {
  createMailService,
  formatWhatsAppLink
};
