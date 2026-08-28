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
    const savedBriefing = storage.saveBriefing(data);

    // Disparo de e-mails
    const transporter = createTransporter();
    if (transporter) {
      const user = process.env.SMTP_USER || 'contato@dreven.company';
      
      // 1. Notificação Admin (conforme seção 6)
      const adminText = `Novo diagnóstico — ${savedBriefing.empresa} (${savedBriefing.linha_sugerida})

Empresa: ${savedBriefing.empresa}
Segmento: ${savedBriefing.segmento}
Momento atual: ${savedBriefing.momento}
Gargalo principal: ${savedBriefing.gargalo_principal} → Linha sugerida: ${savedBriefing.linha_sugerida}

Como funciona hoje:
${savedBriefing.descricao_livre || 'Não detalhado'}

Ferramentas atuais: ${savedBriefing.ferramentas_atuais}
Frequência do problema: ${savedBriefing.frequencia}
Impacto quando falha: ${savedBriefing.impacto}
Tentativas anteriores: ${savedBriefing.tentativas_anteriores}

Estrutura decisória: ${savedBriefing.estrutura_decisoria}
Prazo esperado: ${savedBriefing.prazo_esperado}
Canal de origem: ${savedBriefing.canal_origem} ${savedBriefing.indicado_por ? `(Indicado por: ${savedBriefing.indicado_por})` : ''}

Contato: ${savedBriefing.contato_nome} (${savedBriefing.contato_cargo}) · ${savedBriefing.contato_whatsapp} · ${savedBriefing.contato_email}`;

      await transporter.sendMail({
        from: `"Dreven Company" <${user}>`,
        to: 'contato@dreven.company',
        subject: `Novo diagnóstico — ${savedBriefing.empresa} (${savedBriefing.linha_sugerida})`,
        text: adminText
      });

      // 2. Confirmação Cliente (conforme seção 6)
      const clientText = `${savedBriefing.contato_nome},

Recebemos seu diagnóstico. Vamos analisar o que você descreveu antes de qualquer proposta — sem isso, qualquer solução seria genérica.

Retornamos por WhatsApp ou e-mail assim que a leitura estiver pronta.

Dreven Company
Estratégia · Marca · Produto · Engenharia · IA · Governança`;

      await transporter.sendMail({
        from: `"Dreven Company" <${user}>`,
        to: savedBriefing.contato_email,
        subject: 'Diagnóstico recebido — Dreven Company',
        text: clientText
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico registrado com sucesso.',
      briefing: savedBriefing
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
