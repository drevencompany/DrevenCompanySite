/**
 * Dreven Company — Diagnóstico & Briefing Estratégico
 * Lógica do Fluxo Multi-Step, Validações e Submissão
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_STEPS = 13;
  let currentStep = 1;
  
  // Estado das respostas
  const state = {
    company: '',
    segment: '',
    moment: '',
    bottleneck: '',
    process_desc: '',
    data_location: [],
    frequency: '',
    impact: '',
    previous_attempts: '',
    decision_makers: '',
    timeline: '',
    channel: '',
    referrer: '',
    name: '',
    role: '',
    phone: '',
    email: '',
    consent: true
  };

  // Elementos DOM
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

  // Inicializar listeners de opções
  initOptionButtons();
  initFormInputs();
  updateUI();

  // Avançar Etapa
  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);

  // Atalho Teclado Enter
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && currentStep <= TOTAL_STEPS) {
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
        if (!e.shiftKey) return; // Permite quebra de linha no textarea sem shift
      }
      e.preventDefault();
      handleNext();
    }
  });

  function initOptionButtons() {
    // Single Selects
    document.querySelectorAll('.diag-options-grid.single-select, .diag-options-list.single-select').forEach((container) => {
      const field = container.dataset.field;
      container.querySelectorAll('.diag-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.diag-opt').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          state[field] = btn.dataset.value;
          saveDraft();
          hideError();

          // Lógica condicional de indicação na etapa 12
          if (field === 'channel') {
            if (btn.dataset.value === 'Indicação / Recomendação') {
              referralBox.style.display = 'block';
              inputReferrer.focus();
              return; // Não avança automaticamente para permitir digitar quem indicou
            } else {
              referralBox.style.display = 'none';
              state.referrer = '';
            }
          }

          // Avanço suave automático
          setTimeout(() => {
            if (currentStep === 12 && state.channel === 'Indicação / Recomendação') return;
            handleNext();
          }, 220);
        });
      });
    });

    // Multi Selects (Etapa 6)
    document.querySelectorAll('.diag-options-grid.multi-select').forEach((container) => {
      const field = container.dataset.field;
      container.querySelectorAll('.diag-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.classList.toggle('selected');
          const selectedValues = Array.from(container.querySelectorAll('.diag-opt.selected')).map(b => b.dataset.value);
          state[field] = selectedValues;
          saveDraft();
          hideError();
        });
      });
    });
  }

  function initFormInputs() {
    // Input Empresa
    const inputCompany = document.getElementById('input-company');
    if (inputCompany) {
      if (state.company) inputCompany.value = state.company;
      inputCompany.addEventListener('input', (e) => {
        state.company = e.target.value;
        saveDraft();
      });
    }

    // Textarea Processo
    const inputProcess = document.getElementById('input-process-desc');
    if (inputProcess) {
      if (state.process_desc) inputProcess.value = state.process_desc;
      inputProcess.addEventListener('input', (e) => {
        state.process_desc = e.target.value;
        saveDraft();
      });
    }

    // Input Quem indicou
    if (inputReferrer) {
      if (state.referrer) inputReferrer.value = state.referrer;
      inputReferrer.addEventListener('input', (e) => {
        state.referrer = e.target.value;
        saveDraft();
      });
    }

    // Inputs Finais
    ['name', 'role', 'phone', 'email'].forEach((f) => {
      const el = document.getElementById(`input-${f}`);
      if (el) {
        if (state[f]) el.value = state[f];
        el.addEventListener('input', (e) => {
          state[f] = e.target.value;
          saveDraft();
        });
      }
    });

    // Consentimento
    const consentEl = document.getElementById('consent-check');
    if (consentEl) {
      consentEl.addEventListener('change', (e) => {
        state.consent = e.target.checked;
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
    }
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.company || state.company.trim().length < 2) {
        showError('Por favor, informe o nome da sua empresa ou projeto para continuar.');
        document.getElementById('input-company').focus();
        return false;
      }
    } else if (step === 2) {
      if (!state.segment) {
        showError('Selecione o segmento principal da sua operação.');
        return false;
      }
    } else if (step === 3) {
      if (!state.moment) {
        showError('Selecione o momento atual da sua empresa.');
        return false;
      }
    } else if (step === 4) {
      if (!state.bottleneck) {
        showError('Selecione o principal gargalo operacional que precisa ser resolvido.');
        return false;
      }
    } else if (step === 5) {
      if (!state.process_desc || state.process_desc.trim().length < 5) {
        showError('Por favor, descreva brevemente como funciona esse processo hoje.');
        document.getElementById('input-process-desc').focus();
        return false;
      }
    } else if (step === 6) {
      if (!state.data_location || state.data_location.length === 0) {
        showError('Selecione pelo menos um local ou ferramenta onde os dados ficam guardados.');
        return false;
      }
    } else if (step === 7) {
      if (!state.frequency) {
        showError('Selecione a frequência com que esse problema acontece.');
        return false;
      }
    } else if (step === 8) {
      if (!state.impact) {
        showError('Selecione a principal consequência quando o processo atrasa ou falha.');
        return false;
      }
    } else if (step === 9) {
      if (!state.previous_attempts) {
        showError('Selecione se vocês já tentaram resolver isso anteriormente.');
        return false;
      }
    } else if (step === 10) {
      if (!state.decision_makers) {
        showError('Informe quem participa da decisão estratégica do projeto.');
        return false;
      }
    } else if (step === 11) {
      if (!state.timeline) {
        showError('Selecione a expectativa de prazo para a implementação.');
        return false;
      }
    } else if (step === 12) {
      if (!state.channel) {
        showError('Informe como você conheceu a Dreven Company.');
        return false;
      }
      if (state.channel === 'Indicação / Recomendação' && (!state.referrer || state.referrer.trim().length < 2)) {
        showError('Por favor, digite o nome de quem te indicou para a Dreven.');
        inputReferrer.focus();
        return false;
      }
    } else if (step === 13) {
      if (!state.name || state.name.trim().length < 3) {
        showError('Por favor, informe seu nome completo.');
        document.getElementById('input-name').focus();
        return false;
      }
      if (!state.phone || state.phone.trim().replace(/\D/g, '').length < 8) {
        showError('Por favor, informe um WhatsApp ou telefone de contato válido com DDD.');
        document.getElementById('input-phone').focus();
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!state.email || !emailRegex.test(state.email.trim())) {
        showError('Por favor, informe um e-mail corporativo válido.');
        document.getElementById('input-email').focus();
        return false;
      }
      if (!state.consent) {
        showError('É necessário autorizar o contato para envio do diagnóstico.');
        return false;
      }
    }
    return true;
  }

  function updateUI() {
    // Atualizar Barra e Contador
    const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
    progressBar.style.width = `${pct}%`;
    stepCounter.textContent = `ETAPA ${String(currentStep).padStart(2, '0')} DE ${TOTAL_STEPS}`;

    // Atualizar Steps visíveis
    document.querySelectorAll('.diag-step').forEach((sec) => {
      const s = parseInt(sec.dataset.step, 10);
      if (s === currentStep) {
        sec.classList.add('active');
        // Focar no primeiro input se houver
        const input = sec.querySelector('input, textarea');
        if (input && window.innerWidth > 768) {
          setTimeout(() => input.focus(), 150);
        }
      } else {
        sec.classList.remove('active');
      }
    });

    // Botões
    if (currentStep === 1) {
      btnBack.style.visibility = 'hidden';
    } else {
      btnBack.style.visibility = 'visible';
    }

    if (currentStep === TOTAL_STEPS) {
      btnNextText.textContent = 'Enviar Diagnóstico';
    } else {
      btnNextText.textContent = 'Continuar';
    }

    // Rolar suavemente para o topo do card se necessário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitDiagnosis() {
    const briefingRecord = {
      id: `briefing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...state,
      status: 'novo',
      createdAt: new Date().toISOString()
    };
    
    // Salva localmente para visualização instantânea no painel admin
    try {
      const stored = localStorage.getItem('dreven_admin_briefings');
      const briefings = stored ? JSON.parse(stored) : [];
      briefings.unshift(briefingRecord);
      localStorage.setItem('dreven_admin_briefings', JSON.stringify(briefings));
    } catch(e) {}

    btnNext.disabled = true;
    btnNextText.textContent = 'Enviando...';
    hideError();

    try {
      const response = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Limpar rascunho
        localStorage.removeItem('dreven_diag_draft');

        // Mostrar tela de sucesso
        document.querySelectorAll('.diag-step').forEach(s => s.classList.remove('active'));
        document.getElementById('success-screen').classList.add('active');
        actionsBar.style.display = 'none';
        stepCounter.textContent = 'CONCLUÍDO';
        progressBar.style.width = '100%';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showError(data.error || 'Ocorreu um erro ao enviar. Por favor, tente novamente ou entre em contato pelo WhatsApp.');
        btnNext.disabled = false;
        btnNextText.textContent = 'Enviar Diagnóstico';
      }
    } catch (err) {
      console.error('Erro na submissão:', err);
      // Fallback offline / local
      localStorage.setItem('dreven_last_diag_submitted', JSON.stringify(state));
      document.querySelectorAll('.diag-step').forEach(s => s.classList.remove('active'));
      document.getElementById('success-screen').classList.add('active');
      actionsBar.style.display = 'none';
      stepCounter.textContent = 'CONCLUÍDO';
      progressBar.style.width = '100%';
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
