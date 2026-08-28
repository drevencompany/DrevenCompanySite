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
    const BRIEFINGS_STORAGE_KEY = 'dreven_admin_briefings';
    const AUTH_KEY = 'dreven_admin_logged';
    let currentTab = 'leads'; // 'leads' ou 'briefings'
    let currentBriefingData = null;

    function getLocalLeads() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let leads = stored ? JSON.parse(stored) : [];
        if (Array.isArray(leads)) {
          const mockIds = new Set(['lead_1714102001', 'lead_1714102002', 'lead_1714102003']);
          return leads.filter(l => !mockIds.has(l.id));
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

    function getLocalBriefings() {
      try {
        const stored = localStorage.getItem(BRIEFINGS_STORAGE_KEY);
        let briefings = stored ? JSON.parse(stored) : [];
        return Array.isArray(briefings) ? briefings : [];
      } catch (err) {
        return [];
      }
    }

    function setLocalBriefings(briefings) {
      try {
        localStorage.setItem(BRIEFINGS_STORAGE_KEY, JSON.stringify(briefings));
      } catch (err) {
        console.error('Erro ao salvar briefings no localStorage:', err);
      }
    }

    function saveLeadLocal(lead) {
      const leads = getLocalLeads();
      leads.unshift(lead);
      setLocalLeads(leads);
      if (isLoggedIn()) render();
    }

    function saveBriefingLocal(briefing) {
      const briefings = getLocalBriefings();
      briefings.unshift(briefing);
      setLocalBriefings(briefings);
      if (isLoggedIn()) render();
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
      showToast('Sessão encerrada com sucesso.', 'ℹ');
    }

    async function syncWithServer() {
      try {
        const res = await fetch('/api/leads');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.leads)) {
            setLocalLeads(data.leads);
            render();
          }
        }
      } catch (err) {}
    }

    function renderKPIs(leads, briefings) {
      const totalEl = document.getElementById('kpi-total-val');
      const newEl = document.getElementById('kpi-new-val');
      const contactEl = document.getElementById('kpi-contact-val');
      const wonEl = document.getElementById('kpi-won-val');
      const tabLeadsCount = document.getElementById('count-leads-tab');
      const tabBriefingsCount = document.getElementById('count-briefings-tab');

      if (tabLeadsCount) tabLeadsCount.textContent = leads.length;
      if (tabBriefingsCount) tabBriefingsCount.textContent = briefings.length;

      const activeItems = currentTab === 'leads' ? leads : briefings;
      if (!totalEl) return;

      const total = activeItems.length;
      const novos = activeItems.filter(l => (l.status || 'novo') === 'novo').length;
      const emContato = activeItems.filter(l => ['em_contato', 'agendado', 'proposta'].includes(l.status)).length;
      const convertidos = activeItems.filter(l => l.status === 'convertido').length;

      totalEl.textContent = total;
      if (newEl) newEl.textContent = novos;
      if (contactEl) contactEl.textContent = emContato;
      if (wonEl) wonEl.textContent = convertidos;
    }

    function renderTable() {
      const tbody = document.getElementById('admin-table-body');
      const thead = document.querySelector('.admin-table thead tr');
      const emptyState = document.getElementById('admin-empty-state');
      const searchInput = document.getElementById('admin-search-input');
      const filterStatus = document.getElementById('admin-filter-status');
      const filterSegment = document.getElementById('admin-filter-segment');

      if (!tbody) return;

      const leads = getLocalLeads();
      const briefings = getLocalBriefings();
      renderKPIs(leads, briefings);

      const items = currentTab === 'leads' ? leads : briefings;
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const statusFilter = filterStatus ? filterStatus.value : 'todos';
      const segmentFilter = filterSegment ? filterSegment.value : 'todos';

      // Atualizar Cabeçalho da Tabela baseado na aba ativa
      if (thead) {
        if (currentTab === 'leads') {
          thead.innerHTML = `
            <th>Lead / Contato</th>
            <th>Segmento</th>
            <th>WhatsApp</th>
            <th>Origem</th>
            <th>Status</th>
            <th>Data</th>
            <th style="text-align: right;">Ações</th>
          `;
        } else {
          thead.innerHTML = `
            <th>Empresa / Decisor</th>
            <th>Segmento</th>
            <th>Gargalo Principal</th>
            <th>Origem &amp; Indicação</th>
            <th>Status</th>
            <th>Data</th>
            <th style="text-align: right;">Ações</th>
          `;
        }
      }

      // Filtragem
      const filtered = items.filter(item => {
        const name = (item.name || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        const phone = (item.phone || '').toLowerCase();
        const segment = (item.segment || '').toLowerCase();
        const company = (item.company || '').toLowerCase();
        const referrer = (item.referrer || '').toLowerCase();

        const matchQuery = !query || name.includes(query) || email.includes(query) || phone.includes(query) || segment.includes(query) || company.includes(query) || referrer.includes(query);
        const matchStatus = statusFilter === 'todos' || (item.status || 'novo') === statusFilter;
        const matchSegment = segmentFilter === 'todos' || segment.includes(segmentFilter.toLowerCase());

        return matchQuery && matchStatus && matchSegment;
      });

      tbody.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';

      filtered.forEach(item => {
        const tr = document.createElement('tr');
        const formattedDate = new Date(item.createdAt || Date.now()).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const rawPhone = (item.phone || '').replace(/\D/g, '');
        const wppUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone}` : '#';

        if (currentTab === 'leads') {
          tr.innerHTML = `
            <td>
              <div class="lead-cell-name"><b>${item.name || 'Sem nome'}</b></div>
              <div class="lead-cell-email"><a href="mailto:${item.email}" class="lead-email-link">${item.email || '—'}</a></div>
            </td>
            <td><span class="lead-cell-segment">${item.segment || 'Geral'}</span></td>
            <td><a href="${wppUrl}" target="_blank" rel="noopener noreferrer" class="lead-phone-link">📱 ${item.phone || '—'}</a></td>
            <td><span class="lead-cell-source">Site</span></td>
            <td><span class="lead-status-pill status-${item.status || 'novo'}">${getStatusLabel(item.status || 'novo')}</span></td>
            <td style="font-size: 12px; color: var(--mid);">${formattedDate}</td>
            <td style="text-align: right;">
              <button class="action-icon-btn edit-lead-btn" data-id="${item.id}" title="Ver e Editar">✏️</button>
              <button class="action-icon-btn delete-lead-btn" data-id="${item.id}" title="Excluir" style="color:#d9534f;">🗑️</button>
            </td>
          `;
        } else {
          // Linha de Briefing Completo
          const referralInfo = item.channel === 'Indicação / Recomendação' && item.referrer ? `👤 Indicação: <b>${item.referrer}</b>` : (item.channel || 'Direto');
          tr.innerHTML = `
            <td>
              <div class="lead-cell-name"><b>${item.company || 'Empresa'}</b></div>
              <div class="lead-cell-email">${item.name || 'Decisor'} (${item.role || 'Responsável'}) · <a href="mailto:${item.email}" class="lead-email-link">${item.email}</a></div>
            </td>
            <td><span class="lead-cell-segment">${item.segment || 'Geral'}</span></td>
            <td><span class="lead-cell-bottleneck" style="font-size:12.5px; color:var(--ink); font-weight:500;">${item.bottleneck || 'Mapeamento Geral'}</span></td>
            <td><span class="lead-cell-source">${referralInfo}</span></td>
            <td><span class="lead-status-pill status-${item.status || 'novo'}">${getStatusLabel(item.status || 'novo')}</span></td>
            <td style="font-size: 12px; color: var(--mid);">${formattedDate}</td>
            <td style="text-align: right;">
              <button class="action-icon-btn view-briefing-btn" data-id="${item.id}" title="Ver Briefing Completo" style="font-size:14px; font-weight:700; background:var(--ink); color:var(--bone); border-radius:3px; padding:4px 8px;">📋 Ver Briefing</button>
              <button class="action-icon-btn delete-briefing-btn" data-id="${item.id}" title="Excluir" style="color:#d9534f; margin-left:6px;">🗑️</button>
            </td>
          `;
        }

        tbody.appendChild(tr);
      });

      // Listeners da tabela
      attachTableEvents();
    }

    function getStatusLabel(s) {
      const map = {
        novo: 'Novo',
        em_contato: 'Em Contato',
        agendado: 'Agendado',
        proposta: 'Proposta Enviada',
        convertido: 'Fechado',
        arquivado: 'Arquivado'
      };
      return map[s] || 'Novo';
    }

    function attachTableEvents() {
      // Editar Lead
      document.querySelectorAll('.edit-lead-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
      });

      // Ver Briefing
      document.querySelectorAll('.view-briefing-btn').forEach(btn => {
        btn.addEventListener('click', () => openBriefingModal(btn.dataset.id));
      });

      // Excluir Lead / Briefing
      document.querySelectorAll('.delete-lead-btn, .delete-briefing-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const isBriefing = btn.classList.contains('delete-briefing-btn');
          if (confirm('Deseja realmente remover este registro do painel?')) {
            if (isBriefing) {
              const briefings = getLocalBriefings().filter(b => b.id !== id);
              setLocalBriefings(briefings);
            } else {
              const leads = getLocalLeads().filter(l => l.id !== id);
              setLocalLeads(leads);
            }
            renderTable();
            showToast('Registro excluído do painel.');
          }
        });
      });
    }

    function openBriefingModal(id) {
      const briefings = getLocalBriefings();
      const b = briefings.find(item => item.id === id);
      if (!b) return;

      currentBriefingData = b;
      const modal = document.getElementById('admin-modal-briefing');
      const title = document.getElementById('briefing-modal-title');
      const sub = document.getElementById('briefing-modal-sub');
      const content = document.getElementById('briefing-modal-content');
      const wppBtn = document.getElementById('briefing-wpp-btn');

      if (title) title.textContent = b.company || 'Diagnóstico Estratégico';
      if (sub) sub.textContent = `${b.name} (${b.role || 'Decisor'}) · ${b.segment}`;

      const rawPhone = (b.phone || '').replace(/\D/g, '');
      const wppUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone}` : '#';
      if (wppBtn) wppBtn.href = wppUrl;

      const locations = Array.isArray(b.data_location) ? b.data_location.join(', ') : (b.data_location || 'Não informado');

      if (content) {
        content.innerHTML = `
          <!-- Decisor & Contato -->
          <div class="briefing-section">
            <div class="briefing-section-title">1. Contato &amp; Procedência</div>
            <div class="briefing-row"><strong>Nome do Decisor:</strong> ${b.name} (${b.role || 'Não especificado'})</div>
            <div class="briefing-row"><strong>Empresa / Operação:</strong> ${b.company || '—'}</div>
            <div class="briefing-row"><strong>WhatsApp:</strong> <a href="${wppUrl}" target="_blank" style="color:var(--ink); font-weight:600;">${b.phone}</a></div>
            <div class="briefing-row"><strong>E-mail:</strong> <a href="mailto:${b.email}" style="color:var(--ink);">${b.email}</a></div>
            <div class="briefing-row"><strong>Origem do Contato:</strong> ${b.channel || 'Direto'}</div>
            ${b.channel === 'Indicação / Recomendação' && b.referrer ? `
              <div class="briefing-referrer-highlight">👤 Indicado por: ${b.referrer}</div>
            ` : ''}
          </div>

          <!-- Mapeamento de Gargalos -->
          <div class="briefing-section">
            <div class="briefing-section-title">2. Diagnóstico Operacional</div>
            <div class="briefing-row"><strong>Segmento:</strong> ${b.segment}</div>
            <div class="briefing-row"><strong>Momento Atual:</strong> ${b.moment}</div>
            <div class="briefing-row"><strong>Gargalo Principal:</strong> ${b.bottleneck}</div>
            <div style="margin-top:10px;">
              <strong style="display:block; margin-bottom:4px;">Como funciona hoje na prática:</strong>
              <div class="briefing-quote">"${b.process_desc || 'Não detalhado'}"</div>
            </div>
            <div class="briefing-row"><strong>Onde os dados ficam:</strong> ${locations}</div>
            <div class="briefing-row"><strong>Frequência do Gargalo:</strong> ${b.frequency}</div>
            <div class="briefing-row"><strong>Consequência / Impacto:</strong> ${b.impact}</div>
          </div>

          <!-- Decisão & Prazos -->
          <div class="briefing-section">
            <div class="briefing-section-title">3. Decisão &amp; Prazos</div>
            <div class="briefing-row"><strong>Tentativas Anteriores:</strong> ${b.previous_attempts}</div>
            <div class="briefing-row"><strong>Quem Decide:</strong> ${b.decision_makers}</div>
            <div class="briefing-row"><strong>Prazo de Implementação:</strong> ${b.timeline}</div>
          </div>
        `;
      }

      if (modal) modal.classList.add('open');
    }

    function openEditModal(id) {
      const leads = getLocalLeads();
      const lead = leads.find(l => l.id === id);
      if (!lead) return;

      const modal = document.getElementById('admin-modal-edit');
      const nameInput = document.getElementById('edit-lead-name');
      const emailInput = document.getElementById('edit-lead-email');
      const phoneInput = document.getElementById('edit-lead-phone');
      const segmentInput = document.getElementById('edit-lead-segment');
      const statusSelect = document.getElementById('edit-lead-status');
      const notesInput = document.getElementById('edit-lead-notes');

      if (nameInput) nameInput.value = lead.name || '';
      if (emailInput) emailInput.value = lead.email || '';
      if (phoneInput) phoneInput.value = lead.phone || '';
      if (segmentInput) segmentInput.value = lead.segment || '';
      if (statusSelect) statusSelect.value = lead.status || 'novo';
      if (notesInput) notesInput.value = lead.notes || '';

      const form = document.getElementById('admin-form-edit');
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          lead.name = nameInput.value.trim();
          lead.email = emailInput.value.trim();
          lead.phone = phoneInput.value.trim();
          lead.segment = segmentInput.value.trim();
          lead.status = statusSelect.value;
          lead.notes = notesInput.value.trim();
          setLocalLeads(leads);
          if (modal) modal.classList.remove('open');
          renderTable();
          showToast('Lead atualizado com sucesso.');
        };
      }

      if (modal) modal.classList.add('open');
    }

    function initEvents() {
      // Alternância de Abas
      const tabLeads = document.getElementById('tab-leads-btn');
      const tabBriefings = document.getElementById('tab-briefings-btn');

      if (tabLeads && tabBriefings) {
        tabLeads.addEventListener('click', () => {
          currentTab = 'leads';
          tabLeads.classList.add('active');
          tabBriefings.classList.remove('active');
          renderTable();
        });

        tabBriefings.addEventListener('click', () => {
          currentTab = 'briefings';
          tabBriefings.classList.add('active');
          tabLeads.classList.remove('active');
          renderTable();
        });
      }

      // Fechar modal de briefing
      const closeBriefingBtn = document.getElementById('admin-close-briefing');
      const closeBriefingBtn2 = document.getElementById('admin-close-briefing-btn2');
      const briefingModal = document.getElementById('admin-modal-briefing');
      [closeBriefingBtn, closeBriefingBtn2].forEach(b => {
        if (b) b.addEventListener('click', () => {
          if (briefingModal) briefingModal.classList.remove('open');
        });
      });

      // Copiar Briefing Formatado
      const copyBriefingBtn = document.getElementById('admin-copy-briefing-btn');
      if (copyBriefingBtn) {
        copyBriefingBtn.addEventListener('click', () => {
          if (!currentBriefingData) return;
          const b = currentBriefingData;
          const text = `====================================================
DREVEN COMPANY — BRIEFING DE ENGENHARIA & DIAGNÓSTICO
====================================================
Empresa: ${b.company}
Decisor: ${b.name} (${b.role || 'Responsável'})
WhatsApp: ${b.phone}
E-mail: ${b.email}
Origem: ${b.channel} ${b.referrer ? `(Indicado por: ${b.referrer})` : ''}

1. Segmento: ${b.segment}
2. Momento Atual: ${b.moment}
3. Gargalo Principal: ${b.bottleneck}
4. Como funciona hoje: "${b.process_desc}"
5. Onde os dados ficam: ${Array.isArray(b.data_location) ? b.data_location.join(', ') : b.data_location}
6. Frequência do Gargalo: ${b.frequency}
7. Consequência / Impacto: ${b.impact}
8. Tentativas Anteriores: ${b.previous_attempts}
9. Quem Decide: ${b.decision_makers}
10. Prazo: ${b.timeline}
====================================================`;

          navigator.clipboard.writeText(text).then(() => {
            showToast('Briefing copiado para a área de transferência!');
          });
        });
      }

      // Busca e Filtros
      const searchInput = document.getElementById('admin-search-input');
      const filterStatus = document.getElementById('admin-filter-status');
      const filterSegment = document.getElementById('admin-filter-segment');

      if (searchInput) searchInput.addEventListener('input', renderTable);
      if (filterStatus) filterStatus.addEventListener('change', renderTable);
      if (filterSegment) filterSegment.addEventListener('change', renderTable);

      // Botões do Header do Admin
      const btnRefresh = document.getElementById('admin-btn-refresh');
      const btnMinimize = document.getElementById('admin-btn-minimize');
      const btnLogout = document.getElementById('admin-btn-logout');
      const floatingBtn = document.getElementById('admin-floating-btn');

      if (btnRefresh) btnRefresh.addEventListener('click', () => {
        syncWithServer();
        renderTable();
        showToast('Painel sincronizado.');
      });

      if (btnMinimize) btnMinimize.addEventListener('click', minimizePanel);
      if (floatingBtn) floatingBtn.addEventListener('click', openPanel);
      if (btnLogout) btnLogout.addEventListener('click', logout);
    }

    function render() {
      renderTable();
    }

    function init() {
      initEvents();
      if (isLoggedIn()) {
        const floating = document.getElementById('admin-floating-btn');
        if (floating) floating.style.display = 'inline-flex';
      }
    }

    return {
      init,
      login,
      logout,
      saveLeadLocal,
      saveBriefingLocal,
      isLoggedIn,
      openPanel,
      render
    };
  })();

  AdminDashboard.init();

  // Inicia o módulo Administrativo
  window.AdminDashboard = AdminDashboard;
  AdminDashboard.init();
})();

