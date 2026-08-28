const { ValidationError } = require('./errors');

const CONTACT_SEGMENTS = new Set([
  'Saúde & Medicina (Clínicas, Médicos, Terapeutas)',
  'Tecnologia, SaaS & Softwares',
  'E-commerce & Varejo Digital',
  'Serviços Jurídicos & Advocacia',
  'Finanças, Investimentos & Fintechs',
  'Consultoria & Serviços B2B',
  'Educação & Infoprodutos',
  'Imobiliário & Construção Civil',
  'Gastronomia, Hotelaria & Lifestyle',
  'Indústria & Logística'
]);

const DIAGNOSTIC_OPTIONS = {
  segmento: new Set(['Saúde & Medicina', 'Tecnologia & SaaS', 'Serviços B2B', 'Jurídico & Finanças', 'E-commerce', 'Indústria', 'Outro']),
  momento: new Set(['Já temos site/sistema mas virou gargalo', 'Processos manuais exigem produto sob medida', 'Começando do zero']),
  gargalo_principal: new Set(['Conversão baixa / presença fraca', 'Processos manuais repetitivos', 'Ferramentas e dados desconectados', 'Falta de IA prática', 'Falta de sistema dedicado']),
  ferramentas_atuais: new Set(['Planilhas', 'WhatsApp', 'ERP/CRM', 'E-mails', 'Sistema próprio legado', 'Papel / na cabeça da equipe']),
  frequencia: new Set(['Várias vezes ao dia', 'Todo dia', 'Algumas vezes por semana', 'Esporádico']),
  impacto: new Set(['Perda de vendas/leads', 'Retrabalho da equipe', 'Cliente reclama', 'Sobra pro gestor resolver']),
  tentativas_anteriores: new Set(['Primeira vez que olhamos', 'Tentamos ferramenta pronta sem sucesso', 'Equipe tentou internamente', 'Contratamos terceiros mas não deu certo', 'Usamos IA sem método']),
  estrutura_decisoria: new Set(['Só eu decido', 'Eu e mais um sócio', 'Diretoria/Comitê', 'Preciso de aprovação de outra área']),
  prazo_esperado: new Set(['Imediato (30 dias)', '60–90 dias', 'Próximo trimestre', 'Planejamento estratégico']),
  canal_origem: new Set(['Instagram', 'Indicação', 'LinkedIn', 'YouTube', 'Google/Pesquisa', 'Outro'])
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_REGEX = /^[+()\d\s.-]+$/;

function requireObject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('INVALID_TYPE', 'input');
  }
}

function requireText(value, field, { min = 0, maxBytes }) {
  if (typeof value !== 'string') throw new ValidationError('INVALID_TYPE', field);
  const normalized = value.trim();
  if (normalized.length < min || Buffer.byteLength(normalized, 'utf8') > maxBytes) {
    throw new ValidationError('INVALID_LENGTH', field);
  }
  return normalized;
}

function optionalText(value, field, maxBytes) {
  if (value === undefined) return '';
  return requireText(value, field, { maxBytes });
}

function normalizeEmail(value, field = 'email') {
  const email = requireText(value, field, { min: 3, maxBytes: 254 }).toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw new ValidationError('INVALID_EMAIL', field);
  return email;
}

function normalizePhone(value, field) {
  const phone = requireText(value, field, { min: 8, maxBytes: 32 });
  const digits = phone.replace(/\D/g, '');
  if (!PHONE_CHARS_REGEX.test(phone) || digits.length < 8 || digits.length > 15) {
    throw new ValidationError('INVALID_PHONE', field);
  }
  return phone;
}

function requireOption(value, field, options) {
  const normalized = requireText(value, field, { min: 1, maxBytes: 160 });
  if (!options.has(normalized)) throw new ValidationError('INVALID_OPTION', field);
  return normalized;
}

function requireOptionList(value, field, options) {
  if (!Array.isArray(value)) throw new ValidationError('INVALID_TYPE', field);
  if (value.length < 1 || value.length > options.size) throw new ValidationError('INVALID_LENGTH', field);
  const normalized = value.map(item => requireOption(item, field, options));
  if (new Set(normalized).size !== normalized.length) throw new ValidationError('INVALID_OPTION', field);
  return normalized;
}

function normalizeContactSegment(value) {
  const segment = requireText(value, 'segment', { min: 1, maxBytes: 160 });
  if (CONTACT_SEGMENTS.has(segment)) return segment;
  if (segment.startsWith('Outro: ') && Buffer.byteLength(segment.slice(7).trim(), 'utf8') >= 2) return segment;
  throw new ValidationError('INVALID_OPTION', 'segment');
}

function validateContact(input) {
  requireObject(input);
  return {
    name: requireText(input.name, 'name', { min: 2, maxBytes: 160 }),
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone, 'phone'),
    segment: normalizeContactSegment(input.segment),
    hp: optionalText(input.hp, 'hp', 160),
    source: optionalText(input.source, 'source', 80)
  };
}

function validateDiagnostic(input) {
  requireObject(input);
  if (input.consentimento_lgpd !== true) throw new ValidationError('CONSENT_REQUIRED', 'consentimento_lgpd');

  const segmento = requireOption(input.segmento, 'segmento', DIAGNOSTIC_OPTIONS.segmento);
  const segmentoOutro = optionalText(input.segmento_outro, 'segmento_outro', 160);
  const canalOrigem = requireOption(input.canal_origem, 'canal_origem', DIAGNOSTIC_OPTIONS.canal_origem);
  const indicadoPor = optionalText(input.indicado_por, 'indicado_por', 160);

  if (segmento === 'Outro' && Buffer.byteLength(segmentoOutro, 'utf8') < 2) {
    throw new ValidationError('INVALID_LENGTH', 'segmento_outro');
  }
  if (canalOrigem === 'Indicação' && Buffer.byteLength(indicadoPor, 'utf8') < 2) {
    throw new ValidationError('INVALID_LENGTH', 'indicado_por');
  }

  return {
    empresa: requireText(input.empresa, 'empresa', { min: 2, maxBytes: 160 }),
    segmento,
    segmento_outro: segmentoOutro,
    momento: requireOption(input.momento, 'momento', DIAGNOSTIC_OPTIONS.momento),
    gargalo_principal: requireOption(input.gargalo_principal, 'gargalo_principal', DIAGNOSTIC_OPTIONS.gargalo_principal),
    descricao_livre: requireText(input.descricao_livre, 'descricao_livre', { min: 4, maxBytes: 4000 }),
    ferramentas_atuais: requireOptionList(input.ferramentas_atuais, 'ferramentas_atuais', DIAGNOSTIC_OPTIONS.ferramentas_atuais),
    frequencia: requireOption(input.frequencia, 'frequencia', DIAGNOSTIC_OPTIONS.frequencia),
    impacto: requireOption(input.impacto, 'impacto', DIAGNOSTIC_OPTIONS.impacto),
    tentativas_anteriores: requireOption(input.tentativas_anteriores, 'tentativas_anteriores', DIAGNOSTIC_OPTIONS.tentativas_anteriores),
    estrutura_decisoria: requireOption(input.estrutura_decisoria, 'estrutura_decisoria', DIAGNOSTIC_OPTIONS.estrutura_decisoria),
    prazo_esperado: requireOption(input.prazo_esperado, 'prazo_esperado', DIAGNOSTIC_OPTIONS.prazo_esperado),
    canal_origem: canalOrigem,
    indicado_por: indicadoPor,
    contato_nome: requireText(input.contato_nome, 'contato_nome', { min: 3, maxBytes: 160 }),
    contato_cargo: optionalText(input.contato_cargo, 'contato_cargo', 160),
    contato_whatsapp: normalizePhone(input.contato_whatsapp, 'contato_whatsapp'),
    contato_email: normalizeEmail(input.contato_email, 'contato_email'),
    consentimento_lgpd: true
  };
}

module.exports = {
  CONTACT_SEGMENTS,
  DIAGNOSTIC_OPTIONS,
  normalizeEmail,
  validateContact,
  validateDiagnostic
};
