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
    
    // Estado do Dashboard
    let currentTab = 'briefings'; // 'briefings' ou 'leads'
    let currentBriefingData = null;

    // Métodos de Armazenamento Local
    function getLocalLeads() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (err) {
        return [];
      }
    }

    function setLocalLeads(leads) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads || []));
      } catch (err) {}
    }

    function getLocalBriefings() {
      try {
        const stored = localStorage.getItem(BRIEFINGS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (err) {
        return [];
      }
    }

    function setLocalBriefings(briefings) {
      try {
        localStorage.setItem(BRIEFINGS_STORAGE_KEY, JSON.stringify(briefings || []));
      } catch (err) {}
    }

    function saveLeadLocal(lead) {
      const leads = getLocalLeads();
      leads.unshift(lead);
      setLocalLeads(leads);
      render();
    }

    function saveBriefingLocal(briefing) {
      const briefings = getLocalBriefings();
      briefings.unshift(briefing);
      setLocalBriefings(briefings);
      render();
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
      
      // Reseta filtros ao abrir para não filtrar dados sem querer
      const searchInput = document.getElementById('admin-search-input');
      const filterStatus = document.getElementById('admin-filter-status');
      const filterSegment = document.getElementById('admin-filter-segment');
      if (searchInput) searchInput.value = '';
      if (filterStatus) filterStatus.value = 'todos';
      if (filterSegment) filterSegment.value = 'todos';

      render();
      syncWithServer();
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
      showToast('Acesso Autorizado. Bem-vindo, Daniel.');
    }

    function logout() {
      sessionStorage.removeItem(AUTH_KEY);
      const overlay = document.getElementById('admin-overlay');
      const floating = document.getElementById('admin-floating-btn');
      if (overlay) overlay.classList.remove('open');
      if (floating) floating.style.display = 'none';
      lockScroll(false);
      showToast('Sessão encerrada.', 'ℹ');
    }

    // Sincronização Bidirecional com a Nuvem
    async function syncWithServer() {
      try {
        // Busca Diagnósticos e Leads em paralelo
        const [resB, resL] = await Promise.all([
          fetch('/api/diagnostico').catch(() => null),
          fetch('/api/leads').catch(() => null)
        ]);

        if (resB && resB.ok) {
          const dataB = await resB.json();
          if (dataB.success && Array.isArray(dataB.briefings)) {
            setLocalBriefings(dataB.briefings);
          }
        }

        if (resL && resL.ok) {
          const dataL = await resL.json();
          if (dataL.success && Array.isArray(dataL.leads)) {
            setLocalLeads(dataL.leads);
          }
        }
      } catch (err) {
        console.error('Erro na sincronização:', err);
      } finally {
        render();
      }
    }

    function renderKPIs(leads, briefings) {
      const totalEl = document.getElementById('kpi-total-val');
      const newEl = document.getElementById('kpi-new-val');
      const contactEl = document.getElementById('kpi-contact-val');
      const wonEl = document.getElementById('kpi-won-val');
      const tabLeadsCount = document.getElementById('count-leads-tab');
      const tabBriefingsCount = document.getElementById('count-briefings-tab');

      // Atualiza contadores nas abas
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

      // Atualiza rótulos dos KPIs conforme a aba
      const totalLbl = document.querySelector('.kpi-total .kpi-label');
      const newLbl = document.querySelector('.kpi-new .kpi-label');
      if (totalLbl && newLbl) {
        if (currentTab === 'leads') {
          totalLbl.textContent = 'Total de Leads';
          newLbl.textContent = 'Novos / Pendentes';
        } else {
          totalLbl.textContent = 'Total de Diagnósticos';
          newLbl.textContent = 'Aguardando Leitura';
        }
      }
    }

    function renderTable() {
      const tbody = document.getElementById('admin-table-body') || document.getElementById('admin-leads-tbody') || document.querySelector('.admin-table tbody');
      const thead = document.querySelector('.admin-table thead tr');
      const emptyState = document.getElementById('admin-empty-state');
      const searchInput = document.getElementById('admin-search-input');
      const filterStatus = document.getElementById('admin-filter-status');
      const filterSegment = document.getElementById('admin-filter-segment');

      if (!tbody) return;

      const leads = getLocalLeads();
      const briefings = getLocalBriefings();
      renderKPIs(leads, briefings);

      // Sincroniza classes dos botões das abas
      const tabLeads = document.getElementById('tab-leads-btn');
      const tabBriefings = document.getElementById('tab-briefings-btn');
      if (tabLeads && tabBriefings) {
        if (currentTab === 'leads') {
          tabLeads.classList.add('active');
          tabBriefings.classList.remove('active');
        } else {
          tabBriefings.classList.add('active');
          tabLeads.classList.remove('active');
        }
      }

      const items = currentTab === 'leads' ? leads : briefings;
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const statusFilter = filterStatus ? filterStatus.value : 'todos';
      const segmentFilter = filterSegment ? filterSegment.value : 'todos';

      // Atualiza Cabeçalho da Tabela
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
            <th>Linha Sugerida &amp; Gargalo</th>
            <th>Origem &amp; Indicação</th>
            <th>Prazo</th>
            <th>Status</th>
            <th style="text-align: right;">Ações</th>
          `;
        }
      }

      // Filtragem
      const filtered = items.filter(item => {
        const name = (item.contato_nome || item.name || '').toLowerCase();
        const email = (item.contato_email || item.email || '').toLowerCase();
        const phone = (item.contato_whatsapp || item.phone || '').toLowerCase();
        const segment = (item.segmento || item.segment || '').toLowerCase();
        const company = (item.empresa || item.company || '').toLowerCase();
        const referrer = (item.indicado_por || item.referrer || '').toLowerCase();

        const matchQuery = !query || name.includes(query) || email.includes(query) || phone.includes(query) || segment.includes(query) || company.includes(query) || referrer.includes(query);
        const matchStatus = statusFilter === 'todos' || (item.status || 'novo') === statusFilter;
        const matchSegment = segmentFilter === 'todos' || segment.includes(segmentFilter.toLowerCase());

        return matchQuery && matchStatus && matchSegment;
      });

      tbody.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyState) {
          emptyState.style.display = 'block';
          emptyState.innerHTML = `
            <p style="font-size:14.5px; color:rgba(244,242,243,0.7); margin-bottom:12px;">Nenhum registro encontrado nesta aba.</p>
            <button type="button" id="empty-sync-btn" class="admin-btn admin-btn-secondary" style="font-size:11.5px;">↻ Sincronizar com a Nuvem</button>
          `;
          const emptySync = document.getElementById('empty-sync-btn');
          if (emptySync) emptySync.onclick = () => syncWithServer();
        }
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

        const rawPhone = (item.contato_whatsapp || item.phone || '').replace(/\D/g, '');
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
          const companyName = item.empresa || item.company || 'Empresa';
          const decisorName = item.contato_nome || item.name || 'Decisor';
          const decisorRole = item.contato_cargo || item.role || 'Responsável';
          const decisorEmail = item.contato_email || item.email || '';
          const segmento = item.segmento || item.segment || 'Geral';
          const linha = item.linha_sugerida || 'Linha 1 · Presença Digital';
          const gargalo = item.gargalo_principal || item.bottleneck || 'Mapeamento Geral';
          const prazo = item.prazo_esperado || item.timeline || 'Não especificado';

          let referralInfo = item.canal_origem || item.channel || 'Direto';
          if ((item.canal_origem === 'Indicação' || item.channel === 'Indicação') && (item.indicado_por || item.referrer)) {
            referralInfo = `<span style="background:rgba(244,242,243,0.12); padding:3px 8px; border-radius:4px; font-weight:700; color:#F4F2F3; border:1px solid rgba(244,242,243,0.2);">👤 ${item.indicado_por || item.referrer}</span>`;
          }

          tr.innerHTML = `
            <td>
              <div class="lead-cell-name" style="font-size: 14.5px; color:#F4F2F3;"><b>${companyName}</b></div>
              <div class="lead-cell-email" style="color:rgba(244,242,243,0.7);">${decisorName} (${decisorRole}) · <a href="mailto:${decisorEmail}" class="lead-email-link" style="color:#F4F2F3;">${decisorEmail}</a></div>
            </td>
            <td><span class="lead-cell-segment">${segmento}</span></td>
            <td>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #F4F2F3; margin-bottom: 2px;">${linha}</div>
              <div style="font-size: 12.5px; color: rgba(244,242,243,0.6);">${gargalo}</div>
            </td>
            <td><span class="lead-cell-source">${referralInfo}</span></td>
            <td style="font-size: 12px; color: #F4F2F3; font-weight: 600;">${prazo}</td>
            <td><span class="lead-status-pill status-${item.status || 'novo'}">${getStatusLabel(item.status || 'novo')}</span></td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="action-icon-btn view-briefing-btn" data-id="${item.id}" title="Ver Briefing Completo" style="font-size:11.5px; font-weight:700; background:#F4F2F3; color:#090809; border-radius:4px; padding:6px 12px; border:none; cursor:pointer; text-transform:uppercase; letter-spacing:0.06em;">Ver Briefing</button>
              <button class="action-icon-btn delete-briefing-btn" data-id="${item.id}" title="Excluir" style="color:#d9534f; margin-left:6px; background:transparent; border:none; cursor:pointer; font-size:14px;">🗑️</button>
            </td>
          `;
        }

        tbody.appendChild(tr);
      });

      attachTableEvents();
    }

    function getStatusLabel(s) {
      const map = {
        novo: 'Novo',
        em_contato: 'Em Análise',
        agendado: 'Alinhamento Agendado',
        proposta: 'Proposta Enviada',
        convertido: 'Fechado',
        arquivado: 'Arquivado'
      };
      return map[s] || 'Novo';
    }

    function attachTableEvents() {
      // Editar Lead
      document.querySelectorAll('.edit-lead-btn').forEach(btn => {
        btn.onclick = () => openEditModal(btn.dataset.id);
      });

      // Ver Briefing
      document.querySelectorAll('.view-briefing-btn').forEach(btn => {
        btn.onclick = () => openBriefingModal(btn.dataset.id);
      });

      // Excluir Lead / Briefing
      document.querySelectorAll('.delete-lead-btn, .delete-briefing-btn').forEach(btn => {
        btn.onclick = () => {
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
            showToast('Registro excluído com sucesso.');
          }
        };
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

      const company = b.empresa || b.company || 'Empresa';
      const name = b.contato_nome || b.name || 'Decisor';
      const role = b.contato_cargo || b.role || 'Responsável';
      const segment = b.segmento || b.segment || 'Geral';
      const phone = b.contato_whatsapp || b.phone || '';
      const email = b.contato_email || b.email || '';
      const linha = b.linha_sugerida || 'Linha 1 · Presença Digital';
      const momento = b.momento || b.moment || 'Não informado';
      const gargalo = b.gargalo_principal || b.bottleneck || 'Não informado';
      const processo = b.descricao_livre || b.process_desc || 'Não detalhado';
      const ferramentas = b.ferramentas_atuais || b.data_location || 'Não informado';
      const freq = b.frequencia || b.frequency || 'Não informado';
      const impacto = b.impacto || b.impact || 'Não informado';
      const tentativas = b.tentativas_anteriores || b.previous_attempts || 'Não informado';
      const decisores = b.estrutura_decisoria || b.decision_makers || 'Não informado';
      const prazo = b.prazo_esperado || b.timeline || 'Não informado';
      const canal = b.canal_origem || b.channel || 'Direto';
      const indicadoPor = b.indicado_por || b.referrer || '';

      if (title) title.textContent = company;
      if (sub) sub.textContent = `${name} (${role}) · ${segment} · ${linha}`;

      const rawPhone = phone.replace(/\D/g, '');
      const wppUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone}` : '#';
      if (wppBtn) wppBtn.href = wppUrl;

      if (content) {
        content.innerHTML = `
          <!-- Decisor & Contato -->
          <div class="briefing-section">
            <div class="briefing-section-title">1. Decisor &amp; Procedência</div>
            <div class="briefing-row"><strong>Nome do Decisor:</strong> ${name} (${role})</div>
            <div class="briefing-row"><strong>Empresa / Operação:</strong> ${company}</div>
            <div class="briefing-row"><strong>WhatsApp:</strong> <a href="${wppUrl}" target="_blank" style="color:var(--ink); font-weight:700;">📱 ${phone}</a></div>
            <div class="briefing-row"><strong>E-mail:</strong> <a href="mailto:${email}" style="color:var(--ink);">${email}</a></div>
            <div class="briefing-row"><strong>Origem do Contato:</strong> ${canal}</div>
            ${indicadoPor ? `
              <div class="briefing-referrer-highlight">👤 <strong>Indicado por:</strong> ${indicadoPor}</div>
            ` : ''}
          </div>

          <!-- Diagnóstico Técnico -->
          <div class="briefing-section">
            <div class="briefing-section-title">2. Diagnóstico &amp; Gargalos (Schema v2)</div>
            <div class="briefing-row"><strong>Linha Sugerida:</strong> <span style="background:var(--ink); color:var(--bone); padding:3px 8px; border-radius:3px; font-weight:700; font-size:11.5px;">${linha}</span></div>
            <div class="briefing-row"><strong>Segmento:</strong> ${segment}</div>
            <div class="briefing-row"><strong>Momento Atual:</strong> ${momento}</div>
            <div class="briefing-row"><strong>Gargalo Principal:</strong> ${gargalo}</div>
            <div style="margin-top:12px;">
              <strong style="display:block; margin-bottom:4px;">Como funciona hoje na prática:</strong>
              <div class="briefing-quote">"${processo}"</div>
            </div>
            <div class="briefing-row"><strong>Onde as informações ficam:</strong> ${ferramentas}</div>
            <div class="briefing-row"><strong>Frequência do Problema:</strong> ${freq}</div>
            <div class="briefing-row"><strong>Impacto / Custo de Falha:</strong> ${impacto}</div>
          </div>

          <!-- Decisão & Prazos -->
          <div class="briefing-section">
            <div class="briefing-section-title">3. Decisão &amp; Prazos</div>
            <div class="briefing-row"><strong>Tentativas Anteriores:</strong> ${tentativas}</div>
            <div class="briefing-row"><strong>Estrutura Decisória:</strong> ${decisores}</div>
            <div class="briefing-row"><strong>Prazo Esperado:</strong> ${prazo}</div>
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
      const tabLeads = document.getElementById('tab-leads-btn');
      const tabBriefings = document.getElementById('tab-briefings-btn');

      function selectTab(tab) {
        currentTab = tab;
        renderTable();
      }

      if (tabLeads) {
        tabLeads.onclick = (e) => { e.preventDefault(); selectTab('leads'); };
        tabLeads.ontouchend = (e) => { e.preventDefault(); selectTab('leads'); };
      }

      if (tabBriefings) {
        tabBriefings.onclick = (e) => { e.preventDefault(); selectTab('briefings'); };
        tabBriefings.ontouchend = (e) => { e.preventDefault(); selectTab('briefings'); };
      }

      // Fechar modal de briefing
      const closeBriefingBtn = document.getElementById('admin-close-briefing');
      const closeBriefingBtn2 = document.getElementById('admin-close-briefing-btn2');
      const briefingModal = document.getElementById('admin-modal-briefing');
      [closeBriefingBtn, closeBriefingBtn2].forEach(b => {
        if (b) {
          b.onclick = () => { if (briefingModal) briefingModal.classList.remove('open'); };
          b.ontouchend = () => { if (briefingModal) briefingModal.classList.remove('open'); };
        }
      });

      // Copiar Briefing Formatado
      const copyBriefingBtn = document.getElementById('admin-copy-briefing-btn');
      if (copyBriefingBtn) {
        copyBriefingBtn.onclick = () => {
          if (!currentBriefingData) return;
          const b = currentBriefingData;
          const company = b.empresa || b.company || 'Empresa';
          const name = b.contato_nome || b.name || 'Decisor';
          const role = b.contato_cargo || b.role || 'Responsável';
          const segment = b.segmento || b.segment || 'Geral';
          const phone = b.contato_whatsapp || b.phone || '';
          const email = b.contato_email || b.email || '';
          const linha = b.linha_sugerida || 'Linha 1 · Presença Digital';
          const momento = b.momento || b.moment || 'Não informado';
          const gargalo = b.gargalo_principal || b.bottleneck || 'Não informado';
          const processo = b.descricao_livre || b.process_desc || 'Não detalhado';
          const ferramentas = b.ferramentas_atuais || b.data_location || 'Não informado';
          const freq = b.frequencia || b.frequency || 'Não informado';
          const impacto = b.impacto || b.impact || 'Não informado';
          const tentativas = b.tentativas_anteriores || b.previous_attempts || 'Não informado';
          const decisores = b.estrutura_decisoria || b.decision_makers || 'Não informado';
          const prazo = b.prazo_esperado || b.timeline || 'Não informado';
          const canal = b.canal_origem || b.channel || 'Direto';
          const indicadoPor = b.indicado_por || b.referrer || '';

          const formattedText = `Novo diagnóstico — ${company} (${linha})

Empresa: ${company}
Segmento: ${segment}
Momento atual: ${momento}
Gargalo principal: ${gargalo} → Linha sugerida: ${linha}

Como funciona hoje:
${processo}

Ferramentas atuais: ${ferramentas}
Frequência do problema: ${freq}
Impacto quando falha: ${impacto}
Tentativas anteriores: ${tentativas}

Estrutura decisória: ${decisores}
Prazo esperado: ${prazo}
Canal de origem: ${canal}${indicadoPor ? ` (Indicado por: ${indicadoPor})` : ''}

Contato: ${name} (${role}) · ${phone} · ${email}`;

          navigator.clipboard.writeText(formattedText).then(() => {
            showToast('Briefing formatado copiado com sucesso!');
          });
        };
      }

      // Busca e Filtros
      const searchInput = document.getElementById('admin-search-input');
      const filterStatus = document.getElementById('admin-filter-status');
      const filterSegment = document.getElementById('admin-filter-segment');

      if (searchInput) searchInput.oninput = renderTable;
      if (filterStatus) filterStatus.onchange = renderTable;
      if (filterSegment) filterSegment.onchange = renderTable;

      // Botões do Header do Admin
      const btnRefresh = document.getElementById('admin-btn-refresh');
      const btnMinimize = document.getElementById('admin-btn-minimize');
      const btnLogout = document.getElementById('admin-btn-logout');
      const floatingBtn = document.getElementById('admin-floating-btn');

      if (btnRefresh) {
        btnRefresh.onclick = () => {
          showToast('Sincronizando com a nuvem...', '↻');
          syncWithServer();
        };
      }

      if (btnMinimize) btnMinimize.onclick = minimizePanel;
      if (floatingBtn) floatingBtn.onclick = openPanel;
      if (btnLogout) btnLogout.onclick = logout;
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
      // Executa sincronização em segundo plano imediatamente
      syncWithServer();
    }

    return {
      init,
      login,
      logout,
      saveLeadLocal,
      saveBriefingLocal,
      isLoggedIn,
      openPanel,
      render,
      syncWithServer
    };
  })();

  // Inicia o módulo Administrativo
  window.AdminDashboard = AdminDashboard;
  AdminDashboard.init();
})();
