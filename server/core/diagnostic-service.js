const { validateDiagnostic } = require('./validation');
const { assertServiceDependencies, requireSuccessfulWrite } = require('./repositories');

function calculateLinhaSugerida(gargalo) {
  if (!gargalo) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('Conversão') || gargalo.includes('Presença')) return 'Linha 1 · Presença Digital';
  if (gargalo.includes('plataforma') || gargalo.includes('app próprio') || gargalo.includes('Web App')) return 'Linha 2 · Produto Digital (Web App/Portal)';
  if (gargalo.includes('Processos manuais') || gargalo.includes('retrabalho')) return 'Linha 2 / 3 · Sistemas & Automações';
  if (gargalo.includes('desconectados') || gargalo.includes('Integrações')) return 'Linha 3 · Integrações & Engenharia';
  if (gargalo.includes('IA') || gargalo.includes('Inteligência Artificial')) return 'Linha 3 · Motores de Regras & IA';
  return 'Linha 1 · Presença Digital';
}

function toIsoString(clock) {
  const now = clock();
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('clock must return a valid Date');
  }
  return now.toISOString();
}

function toDiagnostic(input, clock, idFactory) {
  const timestamp = toIsoString(clock);
  return {
    id: idFactory(),
    empresa: input.empresa,
    segmento: input.segmento,
    momento: input.momento,
    gargalo_principal: input.gargalo_principal,
    linha_sugerida: calculateLinhaSugerida(input.gargalo_principal),
    descricao_livre: input.descricao_livre,
    ferramentas_atuais: input.ferramentas_atuais.join(', '),
    frequencia: input.frequencia,
    impacto: input.impacto,
    tentativas_anteriores: input.tentativas_anteriores,
    estrutura_decisoria: input.estrutura_decisoria,
    prazo_esperado: input.prazo_esperado,
    canal_origem: input.canal_origem,
    indicado_por: input.indicado_por,
    contato_nome: input.contato_nome,
    contato_cargo: input.contato_cargo,
    contato_whatsapp: input.contato_whatsapp,
    contato_email: input.contato_email,
    consentimento_lgpd: input.consentimento_lgpd,
    consentimento_lgpd_em: timestamp,
    status: 'novo',
    createdAt: timestamp
  };
}

async function deliver(mailer, diagnostic) {
  try {
    const outcome = await mailer.sendDiagnostic(diagnostic);
    return outcome && typeof outcome.sent === 'boolean' ? outcome : { sent: false };
  } catch {
    return { sent: false };
  }
}

function createDiagnosticService({ repository, mailer, clock, idFactory }) {
  assertServiceDependencies({
    repository,
    mailer,
    clock,
    idFactory,
    repositoryMethod: 'createDiagnostic',
    mailerMethod: 'sendDiagnostic'
  });

  return {
    async submit(rawInput) {
      const input = validateDiagnostic(rawInput);
      const diagnostic = requireSuccessfulWrite(
        await repository.createDiagnostic(toDiagnostic(input, clock, idFactory)),
        'createDiagnostic'
      );
      const mail = await deliver(mailer, diagnostic);
      return { diagnostic, persisted: true, mail };
    }
  };
}

module.exports = { createDiagnosticService, calculateLinhaSugerida };
