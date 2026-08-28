const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createDiagnosticService,
  calculateLinhaSugerida
} = require('../../server/core/diagnostic-service');

const validDiagnostic = {
  empresa: ' Dreven Labs ',
  segmento: 'Tecnologia & SaaS',
  segmento_outro: '',
  momento: 'Já temos site/sistema mas virou gargalo',
  gargalo_principal: 'Ferramentas e dados desconectados',
  descricao_livre: 'A equipe registra informações em sistemas separados.',
  ferramentas_atuais: ['Planilhas', 'ERP/CRM'],
  frequencia: 'Algumas vezes por semana',
  impacto: 'Retrabalho da equipe',
  tentativas_anteriores: 'Equipe tentou internamente',
  estrutura_decisoria: 'Eu e mais um sócio',
  prazo_esperado: '60–90 dias',
  canal_origem: 'Indicação',
  indicado_por: ' Uma parceira ',
  contato_nome: ' Ana Ribeiro ',
  contato_cargo: ' Fundadora ',
  contato_whatsapp: '+55 (41) 99999-9999',
  contato_email: ' ANA.RIBEIRO@EXAMPLE.COM ',
  consentimento_lgpd: true
};

function createService({ createDiagnostic, sendDiagnostic, clock = () => new Date('2026-08-28T12:00:00.000Z') } = {}) {
  return createDiagnosticService({
    repository: { createDiagnostic: createDiagnostic || (async record => ({ ok: true, value: record })) },
    mailer: { sendDiagnostic: sendDiagnostic || (async () => ({ sent: true })) },
    clock,
    idFactory: () => 'briefing_fixed'
  });
}

test('persists the normalized diagnostic record and keeps a mail failure distinct', async () => {
  const service = createService({
    sendDiagnostic: async () => ({ sent: false, error: 'MAIL_DELIVERY_FAILED' })
  });

  const result = await service.submit(validDiagnostic);

  assert.deepEqual(result, {
    diagnostic: {
      id: 'briefing_fixed',
      empresa: 'Dreven Labs',
      segmento: 'Tecnologia & SaaS',
      momento: 'Já temos site/sistema mas virou gargalo',
      gargalo_principal: 'Ferramentas e dados desconectados',
      linha_sugerida: 'Linha 3 · Integrações & Engenharia',
      descricao_livre: 'A equipe registra informações em sistemas separados.',
      ferramentas_atuais: 'Planilhas, ERP/CRM',
      frequencia: 'Algumas vezes por semana',
      impacto: 'Retrabalho da equipe',
      tentativas_anteriores: 'Equipe tentou internamente',
      estrutura_decisoria: 'Eu e mais um sócio',
      prazo_esperado: '60–90 dias',
      canal_origem: 'Indicação',
      indicado_por: 'Uma parceira',
      contato_nome: 'Ana Ribeiro',
      contato_cargo: 'Fundadora',
      contato_whatsapp: '+55 (41) 99999-9999',
      contato_email: 'ana.ribeiro@example.com',
      consentimento_lgpd: true,
      consentimento_lgpd_em: '2026-08-28T12:00:00.000Z',
      status: 'novo',
      createdAt: '2026-08-28T12:00:00.000Z'
    },
    persisted: true,
    mail: { sent: false, error: 'MAIL_DELIVERY_FAILED' }
  });
});

test('rejects an explicit failed diagnostic write instead of reporting persistence success', async () => {
  const service = createService({
    createDiagnostic: async () => ({ ok: false, value: null }),
    sendDiagnostic: async () => {
      throw new Error('mail must not run after a failed write');
    }
  });

  await assert.rejects(service.submit(validDiagnostic), /createDiagnostic failed/);
});

test('turns a rejected diagnostic mail delivery into a non-fatal mail outcome after persistence', async () => {
  const service = createService({
    sendDiagnostic: async () => {
      throw new Error('SMTP is unavailable');
    }
  });

  const result = await service.submit(validDiagnostic);

  assert.deepEqual(result.mail, { sent: false });
  assert.equal(result.persisted, true);
});

test('fails fast when the diagnostic mailer contract is incomplete', () => {
  assert.throws(() => createDiagnosticService({
    repository: { createDiagnostic: async record => ({ ok: true, value: record }) },
    mailer: {},
    clock: () => new Date(),
    idFactory: () => 'briefing_fixed'
  }), /mailer\.sendDiagnostic must be a function/);
});

test('preserves every current suggested-line branch and its precedence', () => {
  const cases = [
    { gargalo: '', expected: 'Linha 1 · Presença Digital' },
    { gargalo: 'Conversão baixa', expected: 'Linha 1 · Presença Digital' },
    { gargalo: 'Presença fraca', expected: 'Linha 1 · Presença Digital' },
    { gargalo: 'Precisamos de uma plataforma', expected: 'Linha 2 · Produto Digital (Web App/Portal)' },
    { gargalo: 'Precisamos de um app próprio', expected: 'Linha 2 · Produto Digital (Web App/Portal)' },
    { gargalo: 'Precisamos de um Web App', expected: 'Linha 2 · Produto Digital (Web App/Portal)' },
    { gargalo: 'Processos manuais repetitivos', expected: 'Linha 2 / 3 · Sistemas & Automações' },
    { gargalo: 'Muito retrabalho', expected: 'Linha 2 / 3 · Sistemas & Automações' },
    { gargalo: 'Ferramentas e dados desconectados', expected: 'Linha 3 · Integrações & Engenharia' },
    { gargalo: 'Precisamos de Integrações', expected: 'Linha 3 · Integrações & Engenharia' },
    { gargalo: 'Falta de IA prática', expected: 'Linha 3 · Motores de Regras & IA' },
    { gargalo: 'Inteligência Artificial', expected: 'Linha 3 · Motores de Regras & IA' },
    { gargalo: 'Falta de sistema dedicado', expected: 'Linha 1 · Presença Digital' },
    { gargalo: 'Conversão e Processos manuais', expected: 'Linha 1 · Presença Digital' },
    { gargalo: 'plataforma com Processos manuais', expected: 'Linha 2 · Produto Digital (Web App/Portal)' },
    { gargalo: 'Processos manuais com dados desconectados', expected: 'Linha 2 / 3 · Sistemas & Automações' },
    { gargalo: 'dados desconectados e IA', expected: 'Linha 3 · Integrações & Engenharia' }
  ];

  for (const { gargalo, expected } of cases) {
    assert.equal(calculateLinhaSugerida(gargalo), expected, gargalo || '(empty)');
  }
});
