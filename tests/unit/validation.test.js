const assert = require('node:assert/strict');
const test = require('node:test');

const {
  validateContact,
  validateDiagnostic,
  normalizeEmail
} = require('../../server/core/validation');

const validContact = {
  name: 'Ana Ribeiro',
  email: 'ANA.RIBEIRO@EXAMPLE.COM ',
  phone: '+55 (41) 99999-9999',
  segment: 'Tecnologia, SaaS & Softwares',
  hp: '',
  source: 'website_diagnostico_form'
};

const validDiagnostic = {
  empresa: 'Dreven Labs',
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
  indicado_por: 'Uma parceira',
  contato_nome: 'Ana Ribeiro',
  contato_cargo: 'Fundadora',
  contato_whatsapp: '+55 (41) 99999-9999',
  contato_email: ' ANA.RIBEIRO@EXAMPLE.COM ',
  consentimento_lgpd: true
};

test('normalizes email whitespace and casing', () => {
  assert.equal(normalizeEmail(' ANA.RIBEIRO@EXAMPLE.COM '), 'ana.ribeiro@example.com');
});

test('normalizes accepted contact values without changing their public field names', () => {
  const contact = validateContact(validContact);

  assert.equal(contact.name, 'Ana Ribeiro');
  assert.equal(contact.email, 'ana.ribeiro@example.com');
  assert.equal(contact.segment, 'Tecnologia, SaaS & Softwares');
  assert.equal(contact.hp, '');
});

test('accepts every current contact segment option', () => {
  const segments = [
    'Saúde & Medicina (Clínicas, Médicos, Terapeutas)',
    'Tecnologia, SaaS & Softwares',
    'E-commerce & Varejo Digital',
    'Serviços Jurídicos & Advocacia',
    'Finanças, Investimentos & Fintechs',
    'Consultoria & Serviços B2B',
    'Educação & Infoprodutos',
    'Imobiliário & Construção Civil',
    'Gastronomia, Hotelaria & Lifestyle',
    'Indústria & Logística',
    'Outro: Economia criativa'
  ];

  for (const segment of segments) {
    assert.equal(validateContact({ ...validContact, segment }).segment, segment);
  }
});

test('accepts the contact form sentinel when no custom segment was supplied', () => {
  const contact = validateContact({ ...validContact, segment: 'Outro nicho...' });

  assert.equal(contact.segment, 'Outro nicho...');
});

test('rejects non-string contact fields before normalization', () => {
  assert.throws(() => validateContact({ ...validContact, name: { trim() {} } }),
    error => error.code === 'INVALID_TYPE' && error.field === 'name');
});

test('uses UTF-8 byte limits instead of JavaScript character counts', () => {
  assert.throws(() => validateContact({ ...validContact, name: 'á'.repeat(81) }),
    error => error.code === 'INVALID_LENGTH' && error.field === 'name');
});

test('rejects malformed emails and phones with too few digits', () => {
  assert.throws(() => validateContact({ ...validContact, email: 'ana.example.com' }),
    error => error.code === 'INVALID_EMAIL' && error.field === 'email');
  assert.throws(() => validateContact({ ...validContact, phone: '(41) 1234' }),
    error => error.code === 'INVALID_PHONE' && error.field === 'phone');
});

test('accepts every current diagnostic enum option', () => {
  const options = {
    segmento: ['Saúde & Medicina', 'Tecnologia & SaaS', 'Serviços B2B', 'Jurídico & Finanças', 'E-commerce', 'Indústria'],
    momento: ['Já temos site/sistema mas virou gargalo', 'Processos manuais exigem produto sob medida', 'Começando do zero'],
    gargalo_principal: ['Conversão baixa / presença fraca', 'Processos manuais repetitivos', 'Ferramentas e dados desconectados', 'Falta de IA prática', 'Falta de sistema dedicado'],
    frequencia: ['Várias vezes ao dia', 'Todo dia', 'Algumas vezes por semana', 'Esporádico'],
    impacto: ['Perda de vendas/leads', 'Retrabalho da equipe', 'Cliente reclama', 'Sobra pro gestor resolver'],
    tentativas_anteriores: ['Primeira vez que olhamos', 'Tentamos ferramenta pronta sem sucesso', 'Equipe tentou internamente', 'Contratamos terceiros mas não deu certo', 'Usamos IA sem método'],
    estrutura_decisoria: ['Só eu decido', 'Eu e mais um sócio', 'Diretoria/Comitê', 'Preciso de aprovação de outra área'],
    prazo_esperado: ['Imediato (30 dias)', '60–90 dias', 'Próximo trimestre', 'Planejamento estratégico'],
    canal_origem: ['Instagram', 'Indicação', 'LinkedIn', 'YouTube', 'Google/Pesquisa', 'Outro']
  };

  for (const [field, values] of Object.entries(options)) {
    for (const value of values) {
      const input = { ...validDiagnostic, [field]: value };
      if (field === 'canal_origem' && value !== 'Indicação') input.indicado_por = '';
      assert.equal(validateDiagnostic(input)[field], value);
    }
  }

  for (const location of ['Planilhas', 'WhatsApp', 'ERP/CRM', 'E-mails', 'Sistema próprio legado', 'Papel / na cabeça da equipe']) {
    assert.deepEqual(validateDiagnostic({ ...validDiagnostic, ferramentas_atuais: [location] }).ferramentas_atuais, [location]);
  }
});

test('accepts the diagnostic frontend serialized custom segment shape', () => {
  const diagnostic = validateDiagnostic({
    ...validDiagnostic,
    segmento: 'Outro: Economia criativa',
    segmento_outro: 'Economia criativa'
  });

  assert.equal(diagnostic.segmento, 'Outro: Economia criativa');
  assert.equal(diagnostic.segmento_outro, 'Economia criativa');
});

test('diagnostic requires explicit LGPD consent', () => {
  assert.throws(() => validateDiagnostic({ ...validDiagnostic, consentimento_lgpd: false }),
    error => error.code === 'CONSENT_REQUIRED');
  const { consentimento_lgpd, ...withoutConsent } = validDiagnostic;
  assert.throws(() => validateDiagnostic(withoutConsent),
    error => error.code === 'CONSENT_REQUIRED');
});

test('diagnostic rejects values outside its current enum allowlists', () => {
  assert.throws(() => validateDiagnostic({ ...validDiagnostic, frequencia: 'Sempre' }),
    error => error.code === 'INVALID_OPTION' && error.field === 'frequencia');
  assert.throws(() => validateDiagnostic({ ...validDiagnostic, ferramentas_atuais: ['Banco de dados'] }),
    error => error.code === 'INVALID_OPTION' && error.field === 'ferramentas_atuais');
});

test('diagnostic requires the custom segment and referrer when their selections require them', () => {
  assert.throws(() => validateDiagnostic({ ...validDiagnostic, segmento: 'Outro', segmento_outro: ' ' }),
    error => error.code === 'INVALID_LENGTH' && error.field === 'segmento_outro');
  assert.throws(() => validateDiagnostic({ ...validDiagnostic, indicado_por: ' ' }),
    error => error.code === 'INVALID_LENGTH' && error.field === 'indicado_por');
});
