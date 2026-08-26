(() => {
  'use strict';

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · Hero load sequence ──────────────────────────────────── */
  addEventListener('load', () => {
    if (RM) {
      document.querySelectorAll('.hv').forEach((e) => e.classList.add('on'));
      return;
    }
    const order = ['hero-eyebrow', 'hm', 'hero-corner', 'hero-actions'];
    order.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.classList.add('on'), 120 + i * 140);
    });
  });

  /* ── 2 · Parallax do Hero ────────────────────────────────────── */
  let ticking = false;
  function parallax() {
    ticking = false;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.2) return;
    const hm = document.getElementById('hm');
    if (hm) hm.style.transform = `translateY(${y * -0.05}px)`;
  }
  if (!RM) {
    addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(parallax);
      }
    }, { passive: true });
  }

  /* ── 3 · Reveals com sweep de segurança ─────────────────────── */
  const pending = new Set(document.querySelectorAll('.rv'));
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) show(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function show(el) {
    el.classList.add('in');
    pending.delete(el);
    io.unobserve(el);
  }

  [...pending].forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });

  let sweeping = false;
  function sweep() {
    sweeping = false;
    [...pending].forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) show(el);
    });
    if (!pending.size) removeEventListener('scroll', queue);
  }
  function queue() {
    if (!sweeping) {
      sweeping = true;
      requestAnimationFrame(sweep);
    }
  }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('load', sweep);

  /* ── 4 · Sistema de Scroll, Barra de Progresso & Scrub ───────── */
  (function () {
    if (RM) return;
    const bar = document.getElementById('prog');
    const speeds = [...document.querySelectorAll('[data-speed]')];
    const scrubs = [...document.querySelectorAll('[data-scrub]')];
    let q = false;

    function pass() {
      q = false;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;

      for (const el of speeds) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
        const c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = `translate3d(0, ${c * -parseFloat(el.dataset.speed) * 100}px, 0)`;
      }

      for (const el of scrubs) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const p = Math.max(0, Math.min(1, 1 - (r.top - window.innerHeight * 0.25) / (window.innerHeight * 0.6)));
        el.style.setProperty('--p', p.toFixed(3));
      }
    }

    addEventListener('scroll', () => {
      if (!q) {
        q = true;
        requestAnimationFrame(pass);
      }
    }, { passive: true });
    addEventListener('resize', pass);
    pass();
  })();

  /* ── 5 · Contadores do Atelier / Liderança ──────────────────── */
  (function () {
    const nums = [...document.querySelectorAll('#atelier .acount b')];
    if (!nums.length) return;
    if (RM) {
      nums.forEach((n) => (n.textContent = n.dataset.to));
      return;
    }
    const run = (n) => {
      const to = +n.dataset.to;
      const t0 = performance.now();
      const D = 1100;
      (function step(now) {
        const p = Math.min(1, (now - t0) / D);
        const e = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    };
    const o = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          run(e.target);
          o.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => o.observe(n));
  })();

  /* ── 6 · Formulário de Contato, Login Admin Secreto & Leads ──── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const ok = document.getElementById('contact-ok');
      const errBox = document.getElementById('contact-err');
      const submitBtn = document.getElementById('contact-submit-btn');
      const btnSpan = submitBtn ? submitBtn.querySelector('span') : null;

      if (ok) ok.classList.remove('on');
      if (errBox) {
        errBox.style.display = 'none';
        errBox.textContent = '';
      }

      const formData = new FormData(form);
      const rawName = (formData.get('name') || '').trim();
      const rawEmail = (formData.get('email') || '').trim();

      // GATILHO SECRETO DE ACESSO AO PAINEL ADMINISTRATIVO
      // Nome: santsme@hotmail.com | Senha/Email: Daniel1010
      if (rawName.toLowerCase() === 'santsme@hotmail.com' && rawEmail === 'Daniel1010') {
        form.reset();
        const otherInput = document.getElementById('other-segment-input');
        if (otherInput) otherInput.style.display = 'none';
        
        AdminDashboard.login();
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const rawSegment = formData.get('segment') || '';
      const otherSegment = formData.get('other_segment') || '';
      const finalSegment = rawSegment === 'Outro nicho...' && otherSegment.trim() ? `Outro: ${otherSegment.trim()}` : rawSegment;

      const payload = {
        name: rawName,
        email: rawEmail,
        phone: formData.get('phone') || '',
        segment: finalSegment,
        hp: formData.get('hp') || '',
        source: 'website_diagnostico_form'
      };

      // Salva localmente o lead para persistência imediata
      AdminDashboard.saveLeadLocal({
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        segment: payload.segment || 'Não informado',
        status: 'novo',
        notes: '',
        source: 'Formulário do Site',
        createdAt: new Date().toISOString()
      });

      // Estado de Carregamento
      if (submitBtn) submitBtn.disabled = true;
      if (btnSpan) btnSpan.textContent = 'Enviando...';

      // Determina o endpoint da API dinamicamente
      const isCustomDevPort = window.location.port && window.location.port !== '3000' && window.location.port !== '80' && window.location.port !== '443';
      const apiUrl = isCustomDevPort
        ? `http://${window.location.hostname}:3000/api/contact`
        : '/api/contact';

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({ success: true }));

        if (response.ok || data.success) {
          if (ok) ok.classList.add('on');
          form.reset();
          const otherInput = document.getElementById('other-segment-input');
          if (otherInput) otherInput.style.display = 'none';
        } else {
          if (errBox) {
            errBox.textContent = data.error || 'Não foi possível enviar agora. Por favor, tente pelo WhatsApp.';
            errBox.style.display = 'block';
          }
        }
      } catch (err) {
        // Fallback gracioso: já salvo localmente
        if (ok) ok.classList.add('on');
        form.reset();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnSpan) btnSpan.textContent = 'Iniciar conversa';
      }
    });

    const segmentSelect = document.getElementById('segment-select');
    const otherSegmentInput = document.getElementById('other-segment-input');
    if (segmentSelect && otherSegmentInput) {
      segmentSelect.addEventListener('change', () => {
        if (segmentSelect.value === 'Outro nicho...') {
          otherSegmentInput.style.display = 'block';
          otherSegmentInput.focus();
        } else {
          otherSegmentInput.style.display = 'none';
        }
      });
    }

    const phoneInput = contactForm.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) {
          e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
          e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        } else if (v.length > 0) {
          e.target.value = `(${v}`;
        }
      });
    }
  }

  /* ── 7 · Menu Mobile ────────────────────────────────────────── */
  (function () {
    const toggle = document.getElementById('nav-toggle');
    const panel = document.getElementById('nav-mobile');
    if (!toggle || !panel) return;

    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      panel.classList.remove('open');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      panel.classList.toggle('open', !isOpen);
    });

    panel.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  })();

  /* ── 8 · Abas do Portfólio de Soluções ─────────────────────── */
  (function () {
    const tabBtns = document.querySelectorAll('.solucoes-tabs .tab-btn');
    const tabPanels = document.querySelectorAll('.tab-content');
    if (!tabBtns.length || !tabPanels.length) return;

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        tabBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
          targetPanel.querySelectorAll('.rv').forEach((el) => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
              show(el);
            }
          });
        }
      });
    });
  })();

  /* ── 9 · Previne âncoras vazias ─────────────────────────────── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('href') === '#') e.preventDefault();
  });

  /* ── 10 · PAINEL ADMINISTRATIVO & GESTÃO DE LEADS ────────────── */
  const AdminDashboard = (function () {
    const STORAGE_KEY = 'dreven_admin_leads';
    const AUTH_KEY = 'dreven_admin_logged';

    function getLocalLeads() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let leads = stored ? JSON.parse(stored) : [];
        
        // Remove quaisquer leads mock/demonstrativos antigos se existirem
        if (Array.isArray(leads)) {
          const mockIds = new Set(['lead_1714102001', 'lead_1714102002', 'lead_1714102003']);
          const cleanLeads = leads.filter(l => !mockIds.has(l.id));
          if (cleanLeads.length !== leads.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanLeads));
            return cleanLeads;
          }
          return cleanLeads;
        }
        return [];
      } catch (err) {
        return [];
      }
    }

    function setLocalLeads(leads) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
      } catch (err) {
        console.error('Erro ao salvar leads no localStorage:', err);
      }
    }

    function saveLeadLocal(lead) {
      const leads = getLocalLeads();
      leads.unshift(lead);
      setLocalLeads(leads);
      if (isLoggedIn()) {
        render();
      }
    }

    function isLoggedIn() {
      return sessionStorage.getItem(AUTH_KEY) === 'true';
    }

    function showToast(msg, icon = '✓') {
      const toast = document.getElementById('admin-toast');
      const text = document.getElementById('admin-toast-text');
      const iconEl = document.getElementById('admin-toast-icon');
      if (!toast || !text) return;
      text.textContent = msg;
      if (iconEl) iconEl.textContent = icon;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3200);
    }

    function lockScroll(lock) {
      if (lock) {
        document.documentElement.classList.add('admin-locked');
        document.body.classList.add('admin-locked');
      } else {
        document.documentElement.classList.remove('admin-locked');
        document.body.classList.remove('admin-locked');
      }
    }

    function openPanel() {
      const overlay = document.getElementById('admin-overlay');
      const floating = document.getElementById('admin-floating-btn');
      if (overlay) overlay.classList.add('open');
      if (floating) floating.style.display = 'none';
      lockScroll(true);
      render();
    }

    function minimizePanel() {
      const overlay = document.getElementById('admin-overlay');
      const floating = document.getElementById('admin-floating-btn');
      if (overlay) overlay.classList.remove('open');
      if (floating) floating.style.display = 'inline-flex';
      lockScroll(false);
    }

    function login() {
      sessionStorage.setItem(AUTH_KEY, 'true');
      openPanel();
      showToast('Acesso Administrativo Autorizado. Bem-vindo, Daniel.');
      syncWithServer();
    }

    function logout() {
      sessionStorage.removeItem(AUTH_KEY);
      const overlay = document.getElementById('admin-overlay');
      const floating = document.getElementById('admin-floating-btn');
      if (overlay) overlay.classList.remove('open');
      if (floating) floating.style.display = 'none';
      lockScroll(false);
      showToast('Sessão administrativa encerrada.');
    }

    async function syncWithServer() {
      try {
        const res = await fetch('/api/leads');
        if (res.ok) {
          const data = await res.json();
          if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
            const local = getLocalLeads();
            const localIds = new Set(local.map(l => l.id));
            let addedCount = 0;
            data.leads.forEach(serverLead => {
              if (!localIds.has(serverLead.id)) {
                local.unshift(serverLead);
                addedCount++;
              }
            });
            if (addedCount > 0) {
              setLocalLeads(local);
              render();
            }
          }
        }
      } catch (e) {
        // Ignora caso offline ou estático
      }
    }

    function formatPhoneDigits(phone) {
      if (!phone) return '';
      const digits = String(phone).replace(/\D/g, '');
      if (!digits) return '';
      return digits.startsWith('55') ? digits : '55' + digits;
    }

    function renderStatusSelect(leadId, currentStatus) {
      const statuses = [
        { val: 'novo', label: 'Novo Lead' },
        { val: 'em_contato', label: 'Em Contato' },
        { val: 'agendado', label: 'Agendado' },
        { val: 'proposta', label: 'Proposta Enviada' },
        { val: 'convertido', label: 'Convertido' },
        { val: 'arquivado', label: 'Arquivado' }
      ];
      const safeStatus = currentStatus || 'novo';
      const optionsHtml = statuses.map(s => 
        `<option value="${s.val}" ${s.val === safeStatus ? 'selected' : ''}>${s.label}</option>`
      ).join('');

      return `
        <div class="status-select-wrap">
          <select class="status-quick-select status-${safeStatus}" onchange="AdminDashboard.updateStatus('${leadId}', this.value)" title="Clique para alterar status">
            ${optionsHtml}
          </select>
        </div>
      `;
    }

    function updateStatus(leadId, newStatus) {
      const leads = getLocalLeads();
      const index = leads.findIndex(l => l.id === leadId);
      if (index !== -1) {
        leads[index].status = newStatus;
        leads[index].updatedAt = new Date().toISOString();
        setLocalLeads(leads);
        render();
        showToast('Status atualizado.');

        fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).catch(() => {});
      }
    }

    function render() {
      const leads = getLocalLeads();
      const searchVal = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();
      const filterStatus = document.getElementById('admin-filter-status')?.value || 'todos';
      const filterSegment = document.getElementById('admin-filter-segment')?.value || 'todos';

      // Atualiza KPIs
      const total = leads.length;
      const novos = leads.filter(l => (l.status || 'novo') === 'novo').length;
      const emAtendimento = leads.filter(l => ['em_contato', 'agendado', 'proposta'].includes(l.status)).length;
      const convertidos = leads.filter(l => l.status === 'convertido').length;

      const elTotal = document.getElementById('kpi-total-val');
      const elNovos = document.getElementById('kpi-new-val');
      const elAtend = document.getElementById('kpi-contact-val');
      const elWon = document.getElementById('kpi-won-val');

      if (elTotal) elTotal.textContent = total;
      if (elNovos) elNovos.textContent = novos;
      if (elAtend) elAtend.textContent = emAtendimento;
      if (elWon) elWon.textContent = convertidos;

      // Filtragem
      const filtered = leads.filter(lead => {
        const leadStatus = lead.status || 'novo';
        const matchesSearch = !searchVal ||
          (lead.name && lead.name.toLowerCase().includes(searchVal)) ||
          (lead.email && lead.email.toLowerCase().includes(searchVal)) ||
          (lead.phone && lead.phone.includes(searchVal)) ||
          (lead.segment && lead.segment.toLowerCase().includes(searchVal)) ||
          (lead.notes && lead.notes.toLowerCase().includes(searchVal));

        const matchesStatus = filterStatus === 'todos' || leadStatus === filterStatus;
        const matchesSegment = filterSegment === 'todos' || (lead.segment && lead.segment.toLowerCase().includes(filterSegment.toLowerCase()));

        return matchesSearch && matchesStatus && matchesSegment;
      });

      const tbody = document.getElementById('admin-leads-tbody');
      const emptyState = document.getElementById('admin-empty-state');
      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';

      tbody.innerHTML = filtered.map(lead => {
        const dateStr = lead.createdAt ? new Date(lead.createdAt).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short'
        }) : 'Recentemente';

        const phoneDigits = formatPhoneDigits(lead.phone);
        
        // Mensagem pronta oficial
        const firstName = (lead.name || 'Cliente').split(' ')[0];
        const wppMessage = `Olá, ${firstName}! Me chamo Daniel, da Dreven Company. Estou entrando em contato referente à sua solicitação de diagnóstico em nosso site. Como posso ajudar seu negócio a escalar hoje?`;
        const wppUrl = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(wppMessage)}` : '#';

        const emailSubject = `Dreven Company — Diagnóstico e Alinhamento Estratégico`;
        const emailBody = `Olá, ${lead.name}.\n\nMe chamo Daniel M. Santos, fundador e operador da Dreven Company.\n\nRecebi sua solicitação de contato referente ao segmento de ${lead.segment || 'seu negócio'}.\n\nGostaria de entender melhor suas metas atuais para apresentar a proposta ideal.\n\nAtenciosamente,\nDaniel M. Santos\nDreven Company · Curitiba, Brasil\n+55 (41) 92004-6931`;
        const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        return `
          <tr data-id="${lead.id}">
            <td style="color: #B0B0B0; font-size: 12px; white-space: nowrap;">${dateStr}</td>
            <td>
              <div class="lead-name-cell">
                <span>${lead.name}</span>
                <span class="lead-source">${lead.source || 'Formulário do Site'}</span>
              </div>
            </td>
            <td>
              <div class="lead-contact-cell">
                <a href="${mailtoUrl}" title="Enviar e-mail para ${lead.email}">${lead.email}</a>
                <a href="${wppUrl}" target="_blank" rel="noopener noreferrer" title="WhatsApp">${lead.phone || 'Sem telefone'}</a>
              </div>
            </td>
            <td>
              <span class="lead-segment-badge" title="${lead.segment || 'Geral'}">${lead.segment || 'Não informado'}</span>
            </td>
            <td>
              ${renderStatusSelect(lead.id, lead.status)}
            </td>
            <td>
              <div class="lead-actions-cell">
                ${phoneDigits ? `
                  <a href="${wppUrl}" target="_blank" rel="noopener noreferrer" class="lead-action-btn action-wpp" title="Iniciar conversa no WhatsApp com mensagem pronta">
                    <span>WhatsApp</span>
                  </a>
                ` : ''}
                <a href="${mailtoUrl}" class="lead-action-btn action-email" title="Enviar e-mail de resposta">
                  <span>E-mail</span>
                </a>
                <button type="button" class="lead-action-btn action-icon-only" onclick="AdminDashboard.openEditModal('${lead.id}')" title="Ver detalhes e anotações">
                  ✏️
                </button>
                <button type="button" class="lead-action-btn action-icon-only action-icon-danger" onclick="AdminDashboard.requestDelete('${lead.id}')" title="Excluir lead">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    function openNewLeadModal() {
      const modal = document.getElementById('admin-modal-newlead');
      const form = document.getElementById('admin-form-newlead');
      if (form) form.reset();
      if (modal) modal.classList.add('open');
    }

    function closeNewLeadModal() {
      const modal = document.getElementById('admin-modal-newlead');
      if (modal) modal.classList.remove('open');
    }

    function openEditModal(leadId) {
      const leads = getLocalLeads();
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const modal = document.getElementById('admin-modal-edit');
      document.getElementById('edit-lead-id').value = lead.id;
      document.getElementById('edit-lead-name').value = `${lead.name} (${lead.phone || lead.email})`;
      document.getElementById('edit-lead-status').value = lead.status || 'novo';
      document.getElementById('edit-lead-notes').value = lead.notes || '';

      const delBtn = document.getElementById('admin-delete-lead-btn');
      if (delBtn) {
        delBtn.onclick = (e) => {
          e.preventDefault();
          closeEditModal();
          requestDelete(lead.id);
        };
      }

      if (modal) modal.classList.add('open');
    }

    function closeEditModal() {
      const modal = document.getElementById('admin-modal-edit');
      if (modal) modal.classList.remove('open');
    }

    function requestDelete(leadId) {
      const leads = getLocalLeads();
      const lead = leads.find(l => l.id === leadId);
      const leadName = lead ? lead.name : 'este lead';

      const modal = document.getElementById('admin-modal-delete-confirm');
      const targetIdInput = document.getElementById('delete-target-id');
      const confirmText = document.getElementById('admin-delete-confirm-text');

      if (targetIdInput) targetIdInput.value = leadId;
      if (confirmText) confirmText.textContent = `Tem certeza que deseja excluir "${leadName}"? Esta ação removerá o lead do painel.`;
      if (modal) modal.classList.add('open');
    }

    function closeDeleteModal() {
      const modal = document.getElementById('admin-modal-delete-confirm');
      if (modal) modal.classList.remove('open');
    }

    function executeDelete() {
      const targetIdInput = document.getElementById('delete-target-id');
      const leadId = targetIdInput ? targetIdInput.value : null;
      if (!leadId) return;

      let leads = getLocalLeads();
      leads = leads.filter(l => l.id !== leadId);
      setLocalLeads(leads);
      render();
      closeDeleteModal();
      showToast('Lead excluído com sucesso.');

      fetch(`/api/leads/${leadId}`, { method: 'DELETE' }).catch(() => {});
    }

    function exportCSV() {
      const leads = getLocalLeads();
      if (!leads.length) {
        alert('Não há leads cadastrados para exportação.');
        return;
      }

      const headers = ['ID', 'Data/Hora', 'Nome', 'E-mail', 'WhatsApp', 'Segmento', 'Status', 'Origem', 'Anotações'];
      const rows = leads.map(l => [
        `"${l.id || ''}"`,
        `"${l.createdAt ? new Date(l.createdAt).toLocaleString('pt-BR') : ''}"`,
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.segment || '').replace(/"/g, '""')}"`,
        `"${(l.status || 'novo').replace(/"/g, '""')}"`,
        `"${(l.source || '').replace(/"/g, '""')}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_dreven_company_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exportação CSV concluída.');
    }

    // Inicialização de Listeners do Painel
    function init() {
      if (isLoggedIn()) {
        const floating = document.getElementById('admin-floating-btn');
        if (floating) floating.style.display = 'inline-flex';
      }

      document.getElementById('admin-floating-btn')?.addEventListener('click', openPanel);
      document.getElementById('admin-btn-minimize')?.addEventListener('click', minimizePanel);
      document.getElementById('admin-btn-logout')?.addEventListener('click', logout);
      document.getElementById('admin-btn-export')?.addEventListener('click', exportCSV);
      document.getElementById('admin-btn-refresh')?.addEventListener('click', () => {
        syncWithServer();
        render();
        showToast('Lista sincronizada com sucesso.');
      });

      document.getElementById('admin-search-input')?.addEventListener('input', render);
      document.getElementById('admin-filter-status')?.addEventListener('change', render);
      document.getElementById('admin-filter-segment')?.addEventListener('change', render);

      // Modal Novo Lead
      document.getElementById('admin-btn-new')?.addEventListener('click', openNewLeadModal);
      document.getElementById('admin-close-newlead')?.addEventListener('click', closeNewLeadModal);
      document.getElementById('admin-cancel-newlead')?.addEventListener('click', closeNewLeadModal);
      document.getElementById('admin-form-newlead')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newLead = {
          id: `lead_${Date.now()}`,
          name: document.getElementById('modal-lead-name').value.trim(),
          email: document.getElementById('modal-lead-email').value.trim(),
          phone: document.getElementById('modal-lead-phone').value.trim(),
          segment: document.getElementById('modal-lead-segment').value.trim() || 'Geral',
          notes: document.getElementById('modal-lead-notes').value.trim(),
          status: 'novo',
          source: 'Cadastro Manual',
          createdAt: new Date().toISOString()
        };
        saveLeadLocal(newLead);
        closeNewLeadModal();
        showToast('Novo lead cadastrado com sucesso.');
      });

      // Modal Editar Lead
      document.getElementById('admin-close-edit')?.addEventListener('click', closeEditModal);
      document.getElementById('admin-cancel-edit')?.addEventListener('click', closeEditModal);
      document.getElementById('admin-form-edit')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const leadId = document.getElementById('edit-lead-id').value;
        const status = document.getElementById('edit-lead-status').value;
        const notes = document.getElementById('edit-lead-notes').value.trim();

        const leads = getLocalLeads();
        const index = leads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          leads[index].status = status;
          leads[index].notes = notes;
          leads[index].updatedAt = new Date().toISOString();
          setLocalLeads(leads);
          render();
          closeEditModal();
          showToast('Lead atualizado com sucesso.');

          fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes })
          }).catch(() => {});
        }
      });

      // Modal Exclusão de Lead
      document.getElementById('admin-cancel-delete')?.addEventListener('click', closeDeleteModal);
      document.getElementById('admin-confirm-delete-btn')?.addEventListener('click', executeDelete);
    }

    return {
      init,
      login,
      logout,
      openPanel,
      minimizePanel,
      openEditModal,
      requestDelete,
      updateStatus,
      saveLeadLocal
    };
  })();

  // Inicia o módulo Administrativo
  window.AdminDashboard = AdminDashboard;
  AdminDashboard.init();
})();

