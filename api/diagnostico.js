const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Seed inicial para o painel administrativo na Vercel
let memoryBriefings = [
  {
    id: "briefing_1724800010_d93a",
    empresa: "MedCenter Diagnósticos Integrados",
    company: "MedCenter Diagnósticos Integrados",
    segmento: "Saúde & Medicina",
    segment: "Saúde & Medicina",
    momento: "Já temos site/sistema mas virou gargalo",
    moment: "Já temos site/sistema mas virou gargalo",
    gargalo_principal: "Ferramentas e dados desconectados",
    bottleneck: "Ferramentas e dados desconectados",
    linha_sugerida: "Linha 3 · Integrações & Engenharia",
    descricao_livre: "Os laudos saem de um sistema legado, as recepcionistas passam para o WhatsApp manualmente e os médicos precisam consultar 3 telas diferentes para fechar o diagnóstico. Perdemos quase 2 horas por dia com digitação repetitiva.",
    process_desc: "Os laudos saem de um sistema legado, as recepcionistas passam para o WhatsApp manualmente e os médicos precisam consultar 3 telas diferentes para fechar o diagnóstico. Perdemos quase 2 horas por dia com digitação repetitiva.",
    ferramentas_atuais: "WhatsApp, ERP/CRM, Sistema próprio legado, Planilhas",
    data_location: ["WhatsApp", "ERP/CRM", "Sistema próprio legado", "Planilhas"],
    frequencia: "Todo dia",
    frequency: "Todo dia",
    impacto: "Retrabalho da equipe",
    impact: "Retrabalho da equipe",
    tentativas_anteriores: "Contratamos terceiros mas não deu certo",
    previous_attempts: "Contratamos terceiros mas não deu certo",
    estrutura_decisoria: "Eu e mais um sócio",
    decision_makers: "Eu e mais um sócio",
    prazo_esperado: "60–90 dias",
    timeline: "60–90 dias",
    canal_origem: "Indicação",
    channel: "Indicação",
    indicado_por: "Dr. Roberto Silveira (Hospital Paraná)",
    referrer: "Dr. Roberto Silveira (Hospital Paraná)",
    contato_nome: "Dra. Juliana Carvalho",
    name: "Dra. Juliana Carvalho",
    contato_cargo: "Diretora Clínica & Sócia",
    role: "Diretora Clínica & Sócia",
    contato_whatsapp: "(41) 99888-7766",
    phone: "(41) 99888-7766",
    contato_email: "juliana@medcenterdiagnosticos.com.br",
    email: "juliana@medcenterdiagnosticos.com.br",
    consentimento_lgpd: true,
    consentimento_lgpd_em: "2026-08-27T20:10:00.000Z",
    status: "novo",
    createdAt: new Date().toISOString()
  }
];

function calculateLinhaSugerida(gargalo) {
  if (!gargalo) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('Conversão') || gargalo.includes('Presença') || gargalo.includes('Linha 1')) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('sistema dedicado') || gargalo.includes('plataforma') || gargalo.includes('Web App') || gargalo.includes('Linha 2')) return 'Linha 2 · Produto Digital (Web App/Portal)';
  if (gargalo.includes('Processos manuais') || gargalo.includes('repetitivos')) return 'Linha 2 / 3 · Sistemas & Automações';
  if (gargalo.includes('desconectados') || gargalo.includes('Integrações')) return 'Linha 3 · Integrações & Engenharia';
  if (gargalo.includes('IA') || gargalo.includes('Inteligência Artificial') || gargalo.includes('Motores')) return 'Linha 3 · Motores de Regras & IA';
  return 'Linha 1 · Presença Digital';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Retornar lista de briefings para o painel admin
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      briefings: memoryBriefings
    });
  }

  // POST: Submissão de novo diagnóstico
  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      const nome = (data.contato_nome || data.name || '').trim();
      const email = (data.contato_email || data.email || '').trim().toLowerCase();
      const empresa = (data.empresa || data.company || 'Não informado').trim();
      const cargo = (data.contato_cargo || data.role || 'Responsável').trim();
      const whatsapp = (data.contato_whatsapp || data.phone || 'Não informado').trim();
      const gargalo = (data.gargalo_principal || data.bottleneck || '').trim();
      const segmento = (data.segmento || data.segment || 'Geral').trim();
      const momento = (data.momento || data.moment || 'Não informado').trim();
      const processo = (data.descricao_livre || data.process_desc || 'Não detalhado').trim();
      const frequencia = (data.frequencia || data.frequency || 'Não informado').trim();
      const impacto = (data.impacto || data.impact || 'Não informado').trim();
      const tentativas = (data.tentativas_anteriores || data.previous_attempts || 'Não informado').trim();
      const decisores = (data.estrutura_decisoria || data.decision_makers || 'Não informado').trim();
      const prazo = (data.prazo_esperado || data.timeline || 'Não informado').trim();
      const canal = (data.canal_origem || data.channel || 'Direto').trim();
      const indicadoPor = (data.indicado_por || data.referrer || '').trim();
      const linhaSugerida = calculateLinhaSugerida(gargalo);

      if (!nome || nome.length < 2) {
        return res.status(400).json({ success: false, error: 'Por favor, informe seu nome completo.' });
      }

      if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ success: false, error: 'Por favor, informe um endereço de e-mail corporativo válido.' });
      }

      const cleanLocations = Array.isArray(data.ferramentas_atuais || data.data_location)
        ? (data.ferramentas_atuais || data.data_location).join(', ')
        : (data.ferramentas_atuais || data.data_location || 'Não informado');

      const rawPhoneDigits = whatsapp.replace(/\D/g, '');
      const wppLink = rawPhoneDigits ? `https://wa.me/${rawPhoneDigits.startsWith('55') ? rawPhoneDigits : '55' + rawPhoneDigits}` : '#';

      const formattedDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'full',
        timeStyle: 'medium'
      });

      const briefing = {
        id: `briefing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        empresa,
        company: empresa,
        segmento,
        segment: segmento,
        momento,
        moment: momento,
        gargalo_principal: gargalo,
        bottleneck: gargalo,
        linha_sugerida: linhaSugerida,
        descricao_livre: processo,
        process_desc: processo,
        ferramentas_atuais: cleanLocations,
        data_location: cleanLocations,
        frequencia,
        frequency: frequencia,
        impacto,
        impact: impacto,
        tentativas_anteriores: tentativas,
        previous_attempts: tentativas,
        estrutura_decisoria: decisores,
        decision_makers: decisores,
        prazo_esperado: prazo,
        timeline: prazo,
        canal_origem: canal,
        channel: canal,
        indicado_por: indicadoPor,
        referrer: indicadoPor,
        contato_nome: nome,
        name: nome,
        contato_cargo: cargo,
        role: cargo,
        contato_whatsapp: whatsapp,
        phone: whatsapp,
        contato_email: email,
        email: email,
        consentimento_lgpd: Boolean(data.consentimento_lgpd !== false),
        consentimento_lgpd_em: data.consentimento_lgpd_em || new Date().toISOString(),
        status: 'novo',
        createdAt: new Date().toISOString()
      };

      // Adicionar à lista em memória
      memoryBriefings.unshift(briefing);

      // Disparo de E-mails via Nodemailer
      const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const user = process.env.SMTP_USER || 'contato@dreven.company';
      const pass = process.env.SMTP_PASS;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      if (pass) {
        const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

        // 1. E-mail ao Admin (Daniel M. Santos) — Template HTML de Luxo Dreven
        const adminHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F4F2F3; padding:32px 16px; color:#090809;">
            <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #E1E1E1; border-radius:8px; padding:36px 32px; box-shadow: 0 4px 24px rgba(9,8,9,0.06);">
              
              <!-- Header com Brand -->
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EAEAEA; padding-bottom:18px; margin-bottom:24px;">
                <div style="font-weight:800; letter-spacing:0.24em; font-size:16px; text-transform: uppercase; color:#090809;">DREVEN CO.</div>
                <div style="background:#090809; color:#F4F2F3; font-size:10px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; padding:5px 12px; border-radius:3px;">
                  Diagnóstico Estratégico
                </div>
              </div>

              <!-- Título do Briefing -->
              <h2 style="margin:0 0 6px; font-size: 22px; font-weight: 800; letter-spacing:-0.02em; color:#090809;">${empresa}</h2>
              <div style="font-size:13.5px; color:#656565; margin-bottom:24px;">
                Decisor: <strong>${nome}</strong> (${cargo}) · ${segmento} · <span style="display:inline-block; background:#EAEAEA; color:#090809; padding:2px 8px; border-radius:3px; font-weight:700; font-size:11px;">${linhaSugerida}</span>
              </div>

              <!-- Bloco 1: Contato e Procedência -->
              <div style="background:#F4F2F3; padding:18px 20px; border-radius:6px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
                <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">1. Decisor &amp; Procedência</div>
                <p style="margin:0 0 4px;"><strong>Nome:</strong> ${nome} (${cargo})</p>
                <p style="margin:0 0 4px;"><strong>Empresa:</strong> ${empresa}</p>
                <p style="margin:0 0 4px;"><strong>E-mail:</strong> <a href="mailto:${email}" style="color:#090809; text-decoration:underline;">${email}</a></p>
                <p style="margin:0 0 4px;"><strong>WhatsApp:</strong> <a href="${wppLink}" target="_blank" style="color:#090809; font-weight:700; text-decoration:none;">📱 ${whatsapp}</a></p>
                <p style="margin:0 0 4px;"><strong>Canal de Origem:</strong> ${canal}</p>
                ${indicadoPor ? `<div style="margin-top:8px; background:#ffffff; border:1px solid #E1E1E1; padding:8px 12px; border-radius:4px; font-weight:600; color:#090809;">👤 <strong>Indicado por:</strong> ${indicadoPor}</div>` : ''}
              </div>

              <!-- Bloco 2: Mapeamento Técnico & Gargalos -->
              <div style="background:#ffffff; border:1px solid #E1E1E1; padding:20px; border-radius:6px; margin-bottom:20px; font-size:13.5px; line-height:1.7;">
                <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:12px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">2. Diagnóstico Técnico &amp; Gargalos</div>
                
                <p style="margin:0 0 6px;"><strong>Segmento:</strong> ${segmento}</p>
                <p style="margin:0 0 6px;"><strong>Momento Atual:</strong> ${momento}</p>
                <p style="margin:0 0 6px;"><strong>Gargalo Principal:</strong> ${gargalo}</p>
                
                <div style="margin:14px 0; background:#F4F2F3; border-left:3px solid #090809; padding:14px 16px; border-radius:0 4px 4px 0;">
                  <strong style="font-size:12.5px; text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:4px; color:#090809;">Como funciona hoje na prática:</strong>
                  <span style="color:#222; font-style:italic; font-size:14px;">"${processo}"</span>
                </div>

                <p style="margin:0 0 6px;"><strong>Onde as informações ficam:</strong> ${cleanLocations}</p>
                <p style="margin:0 0 6px;"><strong>Frequência do Problema:</strong> ${frequencia}</p>
                <p style="margin:0 0 6px;"><strong>Impacto quando falha:</strong> ${impacto}</p>
                <p style="margin:0 0 6px;"><strong>Tentativas anteriores:</strong> ${tentativas}</p>
              </div>

              <!-- Bloco 3: Decisão & Prazos -->
              <div style="background:#F4F2F3; padding:18px 20px; border-radius:6px; margin-bottom:24px; font-size:13.5px; line-height:1.7;">
                <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.16em; color:#090809; margin-bottom:10px; border-bottom:1px solid #E1E1E1; padding-bottom:6px;">3. Decisão &amp; Prazos</div>
                <p style="margin:0 0 4px;"><strong>Estrutura Decisória:</strong> ${decisores}</p>
                <p style="margin:0 0 4px;"><strong>Prazo Esperado:</strong> ${prazo}</p>
                <p style="margin:0 0 4px;"><strong>Data do Preenchimento:</strong> ${formattedDate}</p>
              </div>

              <!-- Ações Rápidas -->
              <div style="text-align:center; padding-top:10px; margin-bottom:24px;">
                <a href="${wppLink}" style="display:inline-block; background:#090809; color:#F4F2F3; padding:14px 28px; font-size:11.5px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:4px; font-weight:700; margin-right:8px;">Chamar Decisor no WhatsApp</a>
                <a href="mailto:${email}?subject=Dreven%20Company%20%E2%80%94%20Diagn%C3%B3stico%20T%C3%A9cnico%20%E2%80%A2%20${encodeURIComponent(empresa)}" style="display:inline-block; background:#E1E1E1; color:#090809; padding:14px 24px; font-size:11.5px; text-transform:uppercase; letter-spacing:0.18em; text-decoration:none; border-radius:4px; font-weight:700;">Responder por E-mail</a>
              </div>

              <!-- Rodapé -->
              <div style="font-size:11px; color:#656565; border-top:1px solid #E1E1E1; padding-top:18px; text-align:center;">
                Dreven Company &copy; 2026 · Estratégia · Marca · Produto · Engenharia · IA · Governança
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"Dreven Company" <${user}>`,
          to: 'contato@dreven.company',
          subject: `Novo diagnóstico — ${empresa} (${linhaSugerida})`,
          html: adminHtml
        });

        // 2. E-mail ao Cliente — Template VIP Dreven Company
        const clientHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#F4F2F3; padding:32px 16px; color:#090809;">
            <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #E1E1E1; border-radius:8px; padding:38px 32px; box-shadow: 0 4px 24px rgba(9,8,9,0.06);">
              
              <div style="font-weight:800; letter-spacing:0.24em; font-size:18px; margin-bottom:22px; text-transform: uppercase; color:#090809;">DREVEN CO.</div>
              
              <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color:#090809;">Olá, ${nome}.</h2>
              
              <p style="font-size:14.5px; line-height:1.75; color:#383536; margin-bottom:14px;">
                Recebemos o diagnóstico da <strong>${empresa}</strong>. Vamos analisar o que você descreveu antes de qualquer proposta — sem isso, qualquer solução seria genérica.
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
          to: email,
          subject: 'Diagnóstico recebido — Dreven Company',
          html: clientHtml
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Diagnóstico recebido com sucesso.',
        briefing
      });
    } catch (err) {
      console.error('[Serverless Briefing Error]:', err);
      return res.status(500).json({ success: false, error: 'Erro ao processar diagnóstico.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Método não permitido.' });
};
