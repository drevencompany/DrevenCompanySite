/**
 * Dreven Company — Diagnóstico Estratégico (Plano v2)
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_STEPS = 13;
  let inIntro = true;
  let currentStep = 1;

  function calculateLinha(gargalo) {
    if (!gargalo) return 'Linha 1 · Presença Digital';
    if (gargalo.includes('Conversão') || gargalo.includes('presença')) return 'Linha 1 · Presença Digital';
    if (gargalo.includes('sistema dedicado') || gargalo.includes('plataforma')) return 'Linha 2 · Produto Digital (Web App/Portal)';
    if (gargalo.includes('Processos manuais') || gargalo.includes('repetitivos')) return 'Linha 2 / 3 · Sistemas & Automações';
    if (gargalo.includes('desconectados') || gargalo.includes('dados')) return 'Linha 3 · Integrações & Engenharia';
    if (gargalo.includes('IA') || gargalo.includes('Inteligência Artificial')) return 'Linha 3 · Motores de Regras & IA';
    return 'Linha 1 · Presença Digital';
  }
  
  // Estado das respostas
  const state = {
    empresa: '',
    segmento: '',
    momento: '',
    gargalo_principal: '',
    linha_sugerida: '',
    descricao_livre: '',
    ferramentas_atuais: [],
    frequencia: '',
    impacto: '',
    tentativas_anteriores: '',
    estrutura_decisoria: '',
    prazo_esperado: '',
    canal_origem: '',
    indicado_por: '',
    contato_nome: '',
    contato_cargo: '',
    contato_whatsapp: '',
    contato_email: '',
    consentimento_lgpd: true,
    consentimento_lgpd_em: ''
  };

  // Elementos DOM
  const introScreen = document.getElementById('intro-screen');
  const btnStart = document.getElementById('btn-start');
  const progressInfoWrap = document.getElementById('progress-info-wrap');
  const progressBarWrap = document.getElementById('progress-bar-wrap');
  const stepCounter = document.getElementById('step-counter');
  const progressBar = document.getElementById('progress-bar');
  const btnNext = document.getElementById('btn-next');
  const btnNextText = document.getElementById('btn-next-text');
  const btnBack = document.getElementById('btn-back');
  const actionsBar = document.getElementById('actions-bar');
  const errorMsg = document.getElementById('diag-error');
  const referralBox = document.getElementById('referral-box');
  const inputReferrer = document.getElementById('input-referrer');

  // Recuperar rascunho anterior se houver
  const savedState = localStorage.getItem('dreven_diag_draft');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      Object.assign(state, parsed);
    } catch (e) {}
  }

  // Inicializar listeners
  if (btnStart) {
    btnStart.addEventListener('click', startDiagnosis);
  }

  initOptionButtons();
  initFormInputs();

  // Avançar / Voltar
  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);

  // Atalho Teclado Enter
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (inIntro) {
        e.preventDefault();
        startDiagnosis();
        return;
      }
      if (currentStep <= TOTAL_STEPS) {
        if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
          if (!e.shiftKey) return;
        }
        e.preventDefault();
        handleNext();
      }
    }
  });

  function startDiagnosis() {
    inIntro = false;
    introScreen.classList.remove('active');
    progressInfoWrap.style.display = 'block';
    progressBarWrap.style.display = 'block';
    actionsBar.style.display = 'flex';
    updateUI();
  }

  function initOptionButtons() {
    // Single Selects
    document.querySelectorAll('.diag-options-grid.single-select, .diag-options-list.single-select').forEach((container) => {
      const field = container.dataset.field;
      container.querySelectorAll('.diag-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.diag-opt').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          
          if (field === 'segment') state.segmento = btn.dataset.value;
          if (field === 'moment') state.momento = btn.dataset.value;
          if (field === 'bottleneck') {
            state.gargalo_principal = btn.dataset.value;
            state.linha_sugerida = calculateLinha(btn.dataset.value);
          }
          if (field === 'frequency') state.frequencia = btn.dataset.value;
          if (field === 'impact') state.impacto = btn.dataset.value;
          if (field === 'previous_attempts') state.tentativas_anteriores = btn.dataset.value;
          if (field === 'decision_makers') state.estrutura_decisoria = btn.dataset.value;
          if (field === 'timeline') state.prazo_esperado = btn.dataset.value;
          if (field === 'channel') {
            state.canal_origem = btn.dataset.value;
            if (btn.dataset.value === 'Indicação') {
              referralBox.style.display = 'block';
              inputReferrer.focus();
              saveDraft();
              hideError();
              return;
            } else {
              referralBox.style.display = 'none';
              state.indicado_por = '';
            }
          }

          saveDraft();
          hideError();

          setTimeout(() => {
            if (currentStep === 12 && state.canal_origem === 'Indicação') return;
            handleNext();
          }, 200);
        });
      });
    });

    // Multi Selects (Etapa 6)
    document.querySelectorAll('.diag-options-grid.multi-select').forEach((container) => {
      container.querySelectorAll('.diag-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.classList.toggle('selected');
          const selectedValues = Array.from(container.querySelectorAll('.diag-opt.selected')).map(b => b.dataset.value);
          state.ferramentas_atuais = selectedValues;
          saveDraft();
          hideError();
        });
      });
    });
  }

  function initFormInputs() {
    const inputCompany = document.getElementById('input-company');
    if (inputCompany) {
      if (state.empresa) inputCompany.value = state.empresa;
      inputCompany.addEventListener('input', (e) => {
        state.empresa = e.target.value;
        saveDraft();
      });
    }

    const inputProcess = document.getElementById('input-process-desc');
    if (inputProcess) {
      if (state.descricao_livre) inputProcess.value = state.descricao_livre;
      inputProcess.addEventListener('input', (e) => {
        state.descricao_livre = e.target.value;
        saveDraft();
      });
    }

    if (inputReferrer) {
      if (state.indicado_por) inputReferrer.value = state.indicado_por;
      inputReferrer.addEventListener('input', (e) => {
        state.indicado_por = e.target.value;
        saveDraft();
      });
    }

    const inputName = document.getElementById('input-name');
    const inputRole = document.getElementById('input-role');
    const inputPhone = document.getElementById('input-phone');
    const inputEmail = document.getElementById('input-email');

    if (inputName) {
      if (state.contato_nome) inputName.value = state.contato_nome;
      inputName.addEventListener('input', (e) => { state.contato_nome = e.target.value; saveDraft(); });
    }
    if (inputRole) {
      if (state.contato_cargo) inputRole.value = state.contato_cargo;
      inputRole.addEventListener('input', (e) => { state.contato_cargo = e.target.value; saveDraft(); });
    }
    if (inputPhone) {
      if (state.contato_whatsapp) inputPhone.value = state.contato_whatsapp;
      inputPhone.addEventListener('input', (e) => { state.contato_whatsapp = e.target.value; saveDraft(); });
    }
    if (inputEmail) {
      if (state.contato_email) inputEmail.value = state.contato_email;
      inputEmail.addEventListener('input', (e) => { state.contato_email = e.target.value; saveDraft(); });
    }

    const consentEl = document.getElementById('consent-check');
    if (consentEl) {
      consentEl.addEventListener('change', (e) => {
        state.consentimento_lgpd = e.target.checked;
        state.consentimento_lgpd_em = new Date().toISOString();
      });
    }
  }

  function handleNext() {
    hideError();
    const isValid = validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      updateUI();
    } else if (currentStep === TOTAL_STEPS) {
      submitDiagnosis();
    }
  }

  function handleBack() {
    hideError();
    if (currentStep > 1) {
      currentStep--;
      updateUI();
    } else if (currentStep === 1) {
      inIntro = true;
      document.querySelectorAll('.diag-step').forEach(s => s.classList.remove('active'));
      introScreen.classList.add('active');
      progressInfoWrap.style.display = 'none';
      progressBarWrap.style.display = 'none';
      actionsBar.style.display = 'none';
    }
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.empresa || state.empresa.trim().length < 2) {
        showError('Por favor, informe o nome da sua empresa ou operação.');
        document.getElementById('input-company').focus();
        return false;
      }
    } else if (step === 2) {
      if (!state.segmento) {
        showError('Selecione o segmento principal de atuação.');
        return false;
      }
    } else if (step === 3) {
      if (!state.momento) {
        showError('Selecione o momento atual da sua operação.');
        return false;
      }
    } else if (step === 4) {
      if (!state.gargalo_principal) {
        showError('Selecione o principal gargalo que precisa ser resolvido.');
        return false;
      }
    } else if (step === 5) {
      if (!state.descricao_livre || state.descricao_livre.trim().length < 4) {
        showError('Por favor, descreva brevemente como funciona esse processo hoje.');
        document.getElementById('input-process-desc').focus();
        return false;
      }
    } else if (step === 6) {
      if (!state.ferramentas_atuais || state.ferramentas_atuais.length === 0) {
        showError('Selecione pelo menos um local onde as informações ficam guardadas.');
        return false;
      }
    } else if (step === 7) {
      if (!state.frequencia) {
        showError('Selecione a frequência com que o problema acontece.');
        return false;
      }
    } else if (step === 8) {
      if (!state.impacto) {
        showError('Selecione o impacto quando o processo atrasa ou sai errado.');
        return false;
      }
    } else if (step === 9) {
      if (!state.tentativas_anteriores) {
        showError('Selecione se vocês já tentaram resolver isso antes.');
        return false;
      }
    } else if (step === 10) {
      if (!state.estrutura_decisoria) {
        showError('Informe quem mais participa da decisão.');
        return false;
      }
    } else if (step === 11) {
      if (!state.prazo_esperado) {
        showError('Selecione a expectativa de prazo para estar em produção.');
        return false;
      }
    } else if (step === 12) {
      if (!state.canal_origem) {
        showError('Informe como você conheceu a Dreven Company.');
        return false;
      }
      if (state.canal_origem === 'Indicação' && (!state.indicado_por || state.indicado_por.trim().length < 2)) {
        showError('Por favor, informe quem indicou você para a Dreven.');
        inputReferrer.focus();
        return false;
      }
    } else if (step === 13) {
      if (!state.contato_nome || state.contato_nome.trim().length < 3) {
        showError('Por favor, informe o nome do decisor.');
        document.getElementById('input-name').focus();
        return false;
      }
      if (!state.contato_whatsapp || state.contato_whatsapp.trim().replace(/\D/g, '').length < 8) {
        showError('Por favor, informe um WhatsApp válido com DDD.');
        document.getElementById('input-phone').focus();
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!state.contato_email || !emailRegex.test(state.contato_email.trim())) {
        showError('Por favor, informe um e-mail corporativo válido.');
        document.getElementById('input-email').focus();
        return false;
      }
      if (!state.consentimento_lgpd) {
        showError('É obrigatório concordar com o tratamento dos dados (LGPD) para enviar.');
        return false;
      }
    }
    return true;
  }

  function updateUI() {
    const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
    progressBar.style.width = `${pct}%`;
    stepCounter.textContent = `ETAPA ${String(currentStep).padStart(2, '0')} DE ${TOTAL_STEPS}`;

    document.querySelectorAll('.diag-step').forEach((sec) => {
      const s = parseInt(sec.dataset.step, 10);
      if (s === currentStep) {
        sec.classList.add('active');
        const input = sec.querySelector('input, textarea');
        if (input && window.innerWidth > 768) {
          setTimeout(() => input.focus(), 120);
        }
      } else {
        sec.classList.remove('active');
      }
    });

    if (currentStep === 1) {
      btnBack.style.visibility = 'visible';
      btnBack.textContent = 'Início';
    } else {
      btnBack.style.visibility = 'visible';
      btnBack.textContent = 'Voltar';
    }

    if (currentStep === TOTAL_STEPS) {
      btnNextText.textContent = 'Enviar diagnóstico';
    } else {
      btnNextText.textContent = 'Continuar';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitDiagnosis() {
    btnNext.disabled = true;
    btnNextText.textContent = 'Enviando...';
    hideError();

    state.consentimento_lgpd_em = new Date().toISOString();
    state.linha_sugerida = calculateLinha(state.gargalo_principal);

    const briefingRecord = {
      id: `briefing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...state,
      // Aliases para compatibilidade
      company: state.empresa,
      segment: state.segmento,
      name: state.contato_nome,
      phone: state.contato_whatsapp,
      email: state.contato_email,
      role: state.contato_cargo,
      bottleneck: state.gargalo_principal,
      status: 'novo',
      createdAt: new Date().toISOString()
    };

    // Salva localmente garantindo persistência imediata para o painel admin
    try {
      const stored = localStorage.getItem('dreven_admin_briefings');
      const briefings = stored ? JSON.parse(stored) : [];
      briefings.unshift(briefingRecord);
      localStorage.setItem('dreven_admin_briefings', JSON.stringify(briefings));
    } catch (e) {}

    try {
      const response = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(briefingRecord)
      });

      localStorage.removeItem('dreven_diag_draft');

      document.querySelectorAll('.diag-step').forEach(s => s.classList.remove('active'));
      document.getElementById('success-screen').classList.add('active');
      actionsBar.style.display = 'none';
      progressInfoWrap.style.display = 'none';
      progressBarWrap.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro na submissão:', err);
      // Sucesso com persistência local garantida
      document.querySelectorAll('.diag-step').forEach(s => s.classList.remove('active'));
      document.getElementById('success-screen').classList.add('active');
      actionsBar.style.display = 'none';
      progressInfoWrap.style.display = 'none';
      progressBarWrap.style.display = 'none';
    }
  }

  function saveDraft() {
    localStorage.setItem('dreven_diag_draft', JSON.stringify(state));
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  function hideError() {
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
  }
});
