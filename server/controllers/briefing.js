const storage = require('../services/storage');
const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'contato@dreven.company';
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!pass) return null;

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function handleBriefingSubmit(req, res) {
  try {
    const data = req.body || {};
    const nome = (data.contato_nome || data.name || '').trim();
    const email = (data.contato_email || data.email || '').trim().toLowerCase();

    if (!nome || nome.length < 2) {
      return res.status(400).json({ success: false, error: 'Por favor, informe seu nome completo.' });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, error: 'Por favor, informe um e-mail corporativo válido.' });
    }

    // Salva no banco de dados local
    const saved = storage.saveBriefing(data);

    // Disparo de e-mails
    const transporter = createTransporter();
    if (transporter) {
      const user = process.env.SMTP_USER || 'contato@dreven.company';
      const rawPhoneDigits = (saved.contato_whatsapp || '').replace(/\D/g, '');
      const wppLink = rawPhoneDigits ? `https://wa.me/${rawPhoneDigits.startsWith('55') ? rawPhoneDigits : '55' + rawPhoneDigits}` : '#';

      const formattedDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'full',
        timeStyle: 'medium'
      });

      const rawFormattedBriefing = `Novo diagnóstico — ${saved.empresa} (${saved.linha_sugerida})

Empresa: ${saved.empresa}
Segmento: ${saved.segmento}
Momento atual: ${saved.momento}
Gargalo principal: ${saved.gargalo_principal} → Linha sugerida: ${saved.linha_sugerida}

Como funciona hoje:
${saved.descricao_livre}

Ferramentas atuais: ${saved.ferramentas_atuais}
Frequência do problema: ${saved.frequencia}
Impacto quando falha: ${saved.impacto}
Tentativas anteriores: ${saved.tentativas_anteriores}

Estrutura decisória: ${saved.estrutura_decisoria}
Prazo esperado: ${saved.prazo_esperado}
Canal de origem: ${saved.canal_origem}${saved.indicado_por ? ` (Indicado por: ${saved.indicado_por})` : ''}

Contato: ${saved.contato_nome} (${saved.contato_cargo}) · ${saved.contato_whatsapp} · ${saved.contato_email}`;

      // 1. Notificação Admin
      const adminHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F4F2F3; padding:32px 16px; color:#090809;">
          <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #E1E1E1; border-radius:8px; padding:36px 32px; box-shadow: 0 4px 24px rgba(9,8,9,0.06);">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EAEAEA; padding-bottom:18px; margin-bottom:24px;">
              <div style="font-weight:800; letter-spacing:0.24em; font-size:16px; text-transform: uppercase; color:#090809;">DREVEN CO.</div>
              <div style="background:#090809; color:#F4F2F3; font-size:10px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; padding:5px 12px; border-radius:3px;">
                Diagnóstico Estratégico
              </div>
            </div>

            <h2 style="margin:0 0 6px; font-size: 22px; font-weight: 800; letter-spacing:-0.02em; color:#090809;">${saved.empresa}</h2>
            <div style="font-size:13.5px; color:#656565; margin-bottom:24px;">
              Decisor: <strong>${saved.contato_nome}</strong> (${saved.contato_cargo}) · ${saved.segmento} · <span style="display:inline-block; background:#EAEAEA; color:#090809; padding:2px 8px; border-radius:3px; font-weight:700; font-size:11px;">${saved.linha_sugerida}</span>
            </div>

            <div style="margin-bottom:24px; display:flex; flex-wrap:wrap; gap:8px;">
              <a href="${wppLink}" target="_blank" style="display:inline-block; background:#090809; color:#F4F2F3; padding:10px 18px; font-size:11px; text-transform:uppercase; letter-spacing:0.16em; text-decoration:none; border-radius:4px; font-weight:700;">📱 Chamar no WhatsApp</a>
              <a href="mailto:${saved.contato_email}?subject=Dreven%20Company%20%E2%80%94%20Diagn%C3%B3stico%20T%C3%A9cnico%20%E2%80%A2%20${encodeURIComponent(saved.empresa)}" style="display:inline-block; background:#EAEAEA; color:#090809; padding:10px 18px; font-size:11px; text-transform:uppercase; letter-spacing:0.16em; text-decoration:none; border-radius:4px; font-weight:700;">✉️ Responder por E-mail</a>
              <a href="https://dreven.company/#admin" target="_blank" style="display:inline-block; background:#ffffff; color:#090809; border:1px solid #090809; padding:10px 18px; font-size:11px; text-transform:uppercase; letter-spacing:0.16em; text-decoration:none; border-radius:4px; font-weight:700;">📋 Abrir no Painel</a>
            </div>

            <div style="background:#F4F2F3; padding:18px 20px; border-radius:6px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
              <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">1. Decisor &amp; Procedência</div>
              <p style="margin:0 0 4px;"><strong>Nome:</strong> ${saved.contato_nome} (${saved.contato_cargo})</p>
              <p style="margin:0 0 4px;"><strong>Empresa:</strong> ${saved.empresa}</p>
              <p style="margin:0 0 4px;"><strong>E-mail:</strong> <a href="mailto:${saved.contato_email}" style="color:#090809; text-decoration:underline;">${saved.contato_email}</a></p>
              <p style="margin:0 0 4px;"><strong>WhatsApp:</strong> <a href="${wppLink}" target="_blank" style="color:#090809; font-weight:700; text-decoration:none;">📱 ${saved.contato_whatsapp}</a></p>
              <p style="margin:0 0 4px;"><strong>Canal de Origem:</strong> ${saved.canal_origem}</p>
              ${saved.indicado_por ? `<div style="margin-top:8px; background:#ffffff; border:1px solid #E1E1E1; padding:8px 12px; border-radius:4px; font-weight:600; color:#090809;">👤 <strong>Indicado por:</strong> ${saved.indicado_por}</div>` : ''}
            </div>

            <div style="background:#ffffff; border:1px solid #E1E1E1; padding:20px; border-radius:6px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
              <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:12px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">2. Diagnóstico Técnico &amp; Gargalos</div>
              <p style="margin:0 0 6px;"><strong>Segmento:</strong> ${saved.segmento}</p>
              <p style="margin:0 0 6px;"><strong>Momento Atual:</strong> ${saved.momento}</p>
              <p style="margin:0 0 6px;"><strong>Gargalo Principal:</strong> ${saved.gargalo_principal}</p>
              <div style="margin:14px 0; background:#F4F2F3; border-left:3px solid #090809; padding:14px 16px; border-radius:0 4px 4px 0;">
                <strong style="font-size:12.5px; text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:4px; color:#090809;">Como funciona hoje na prática:</strong>
                <span style="color:#222; font-style:italic; font-size:14px;">"${saved.descricao_livre}"</span>
              </div>
              <p style="margin:0 0 6px;"><strong>Onde as informações ficam:</strong> ${saved.ferramentas_atuais}</p>
              <p style="margin:0 0 6px;"><strong>Frequência do Problema:</strong> ${saved.frequencia}</p>
              <p style="margin:0 0 6px;"><strong>Impacto quando falha:</strong> ${saved.impacto}</p>
              <p style="margin:0 0 6px;"><strong>Tentativas anteriores:</strong> ${saved.tentativas_anteriores}</p>
            </div>

            <div style="background:#F4F2F3; padding:18px 20px; border-radius:6px; margin-bottom:24px; font-size:13.5px; line-height:1.7;">
              <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">3. Decisão &amp; Prazos</div>
              <p style="margin:0 0 4px;"><strong>Estrutura Decisória:</strong> ${saved.estrutura_decisoria}</p>
              <p style="margin:0 0 4px;"><strong>Prazo Esperado:</strong> ${saved.prazo_esperado}</p>
              <p style="margin:0 0 4px;"><strong>Data do Preenchimento:</strong> ${formattedDate}</p>
            </div>

            <!-- BLOCO DE BRIEFING FORMATADO (PRONTO PARA SELECIONAR / COPIAR E COLAR NA IA) -->
            <div style="background:#090809; color:#F4F2F3; padding:22px 24px; border-radius:6px; margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(244,242,243,0.15); padding-bottom:8px;">
                <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#EAEAEA;">📋 Briefing Formatado (Pronto para IA / Proposta)</span>
                <span style="font-size:10px; color:#A0A0A0; font-family:monospace;">Clique no bloco para selecionar tudo</span>
              </div>
              <pre style="margin:0; font-family:'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size:12.5px; line-height:1.65; white-space:pre-wrap; word-break:break-word; color:#F4F2F3; user-select:all; -webkit-user-select:all;">${rawFormattedBriefing}</pre>
            </div>

            <div style="font-size:11px; color:#656565; border-top:1px solid #E1E1E1; padding-top:18px; text-align:center;">
              Dreven Company &copy; 2026 · Estratégia · Marca · Produto · Engenharia · IA · Governança
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Dreven Company" <${user}>`,
        to: 'contato@dreven.company',
        subject: `Novo diagnóstico — ${saved.empresa} (${saved.linha_sugerida})`,
        html: adminHtml,
        text: rawFormattedBriefing
      });

      // 2. Confirmação Cliente
      const clientHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F4F2F3; padding:32px 16px; color:#090809;">
          <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #E1E1E1; border-radius:8px; padding:38px 32px; box-shadow: 0 4px 24px rgba(9,8,9,0.06);">
            <div style="font-weight:800; letter-spacing:0.24em; font-size:18px; margin-bottom:22px; text-transform: uppercase; color:#090809;">DREVEN CO.</div>
            <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color:#090809;">Olá, ${saved.contato_nome}.</h2>
            <p style="font-size:14.5px; line-height:1.75; color:#383536; margin-bottom:14px;">
              Recebemos o diagnóstico da <strong>${saved.empresa}</strong>. Vamos analisar o que você descreveu antes de qualquer proposta — sem isso, qualquer solução seria genérica.
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
            <div style="margin-top:32px; padding-top:22px; border-top:1px solid #E1E1E1; font-size:13px; color:#656565; line-height: 1.6;">
              <div style="font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #656565; margin-bottom: 6px;">Estratégia · Marca · Produto · Engenharia · IA · Governança</div>
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
        to: saved.contato_email,
        subject: 'Diagnóstico recebido — Dreven Company',
        html: clientHtml
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico registrado com sucesso.',
      briefing: saved
    });
  } catch (err) {
    console.error('[Briefing Controller Error]:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao salvar diagnóstico.' });
  }
}

function handleGetBriefings(req, res) {
  try {
    const briefings = storage.getBriefings();
    return res.status(200).json({ success: true, briefings });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Falha ao buscar briefings.' });
  }
}

function handleDeleteBriefing(req, res) {
  try {
    const { id } = req.params;
    const ok = storage.deleteBriefing(id);
    if (!ok) return res.status(404).json({ success: false, error: 'Briefing não encontrado.' });
    return res.status(200).json({ success: true, message: 'Briefing excluído.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Falha ao excluir briefing.' });
  }
}

module.exports = {
  handleBriefingSubmit,
  handleGetBriefings,
  handleDeleteBriefing
};
