const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Memória temporária para serverless runtime
let memoryBriefings = [];

function calculateLinhaSugerida(gargalo) {
  if (!gargalo) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('Conversão') || gargalo.includes('Presença') || gargalo.includes('Linha 1')) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('plataforma') || gargalo.includes('app próprio') || gargalo.includes('Web App') || gargalo.includes('Linha 2')) return 'Linha 2 · Produto Digital (Web App/Portal)';
  if (gargalo.includes('Processos manuais') || gargalo.includes('retrabalho')) return 'Linha 2 / 3 · Sistemas & Automações';
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
      const gargalo = (data.gargalo_principal || data.bottleneck || '').trim();
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

      const briefing = {
        id: `briefing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        empresa,
        segmento: (data.segmento || data.segment || 'Geral').trim(),
        momento: (data.momento || data.moment || 'Não informado').trim(),
        gargalo_principal: gargalo,
        linha_sugerida: linhaSugerida,
        descricao_livre: (data.descricao_livre || data.process_desc || '').trim(),
        ferramentas_atuais: cleanLocations,
        frequencia: (data.frequencia || data.frequency || 'Não informado').trim(),
        impacto: (data.impacto || data.impact || 'Não informado').trim(),
        tentativas_anteriores: (data.tentativas_anteriores || data.previous_attempts || 'Não informado').trim(),
        estrutura_decisoria: (data.estrutura_decisoria || data.decision_makers || 'Não informado').trim(),
        prazo_esperado: (data.prazo_esperado || data.timeline || 'Não informado').trim(),
        canal_origem: (data.canal_origem || data.channel || 'Direto').trim(),
        indicado_por: (data.indicado_por || data.referrer || '').trim(),
        contato_nome: nome,
        contato_cargo: (data.contato_cargo || data.role || 'Responsável').trim(),
        contato_whatsapp: (data.contato_whatsapp || data.phone || '').trim(),
        contato_email: email,
        consentimento_lgpd: Boolean(data.consentimento_lgpd !== false),
        consentimento_lgpd_em: data.consentimento_lgpd_em || new Date().toISOString(),
        status: 'novo',
        createdAt: new Date().toISOString()
      };

      // Guardar na memória serverless
      memoryBriefings.unshift(briefing);

      // Disparo de E-mails via Nodemailer
      const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const user = process.env.SMTP_USER || 'contato@dreven.company';
      const pass = process.env.SMTP_PASS;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      if (pass) {
        const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

        // 1. E-mail ao admin (Formato exato do Plano v2, Seção 6)
        const adminText = `Novo diagnóstico — ${briefing.empresa} (${briefing.linha_sugerida})

Empresa: ${briefing.empresa}
Segmento: ${briefing.segmento}
Momento atual: ${briefing.momento}
Gargalo principal: ${briefing.gargalo_principal} → Linha sugerida: ${briefing.linha_sugerida}

Como funciona hoje:
${briefing.descricao_livre || 'Não detalhado'}

Ferramentas atuais: ${briefing.ferramentas_atuais}
Frequência do problema: ${briefing.frequencia}
Impacto quando falha: ${briefing.impacto}
Tentativas anteriores: ${briefing.tentativas_anteriores}

Estrutura decisória: ${briefing.estrutura_decisoria}
Prazo esperado: ${briefing.prazo_esperado}
Canal de origem: ${briefing.canal_origem} ${briefing.indicado_por ? `(Indicado por: ${briefing.indicado_por})` : ''}

Contato: ${briefing.contato_nome} (${briefing.contato_cargo}) · ${briefing.contato_whatsapp} · ${briefing.contato_email}`;

        await transporter.sendMail({
          from: `"Dreven Company" <${user}>`,
          to: 'contato@dreven.company',
          subject: `Novo diagnóstico — ${briefing.empresa} (${briefing.linha_sugerida})`,
          text: adminText
        });

        // 2. E-mail ao cliente (Formato exato do Plano v2, Seção 6)
        const clientText = `${briefing.contato_nome},

Recebemos seu diagnóstico. Vamos analisar o que você descreveu antes de qualquer proposta — sem isso, qualquer solução seria genérica.

Retornamos por WhatsApp ou e-mail assim que a leitura estiver pronta.

Dreven Company
Estratégia · Marca · Produto · Engenharia · IA · Governança`;

        await transporter.sendMail({
          from: `"Dreven Company" <${user}>`,
          to: briefing.contato_email,
          subject: 'Diagnóstico recebido — Dreven Company',
          text: clientText
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
