document.addEventListener('DOMContentLoaded', () => {
  let leads = [];
  let briefings = [];
  let currentTab = 'leads';
  let csrfToken = '';

  const authGate = document.getElementById('auth-gate');
  const adminApp = document.getElementById('admin-app');
  const tableBody = document.getElementById('admin-table-body');
  const emptyState = document.getElementById('admin-empty-state');
  const searchInput = document.getElementById('admin-search-input');
  const statusFilter = document.getElementById('admin-filter-status');
  const segmentFilter = document.getElementById('admin-filter-segment');

  // KPI elements
  const kpiTotal = document.getElementById('kpi-total-val');
  const kpiNew = document.getElementById('kpi-new-val');
  const kpiContact = document.getElementById('kpi-contact-val');
  const kpiWon = document.getElementById('kpi-won-val');
  const countLeadsTab = document.getElementById('count-leads-tab');
  const countBriefingsTab = document.getElementById('count-briefings-tab');

  // Toast
  const toast = document.getElementById('admin-toast');
  const toastText = document.getElementById('admin-toast-text');

  function showToast(msg) {
    if (!toast) return;
    toastText.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // Sanitização de Link de WhatsApp
  function formatWhatsAppLink(phoneStr) {
    if (!phoneStr) return '#';
    const digits = String(phoneStr).replace(/\D/g, '');
    if (!digits) return '#';
    const full = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${full}`;
  }

  // 1. Verificar Sessão e Obter CSRF Token
  async function initAuth() {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.authenticated) {
        authGate.style.display = 'flex';
        adminApp.classList.remove('active');
        return false;
      }

      authGate.style.display = 'none';
      adminApp.classList.add('active');

      const userInfo = document.getElementById('admin-user-info');
      if (userInfo && sessionData.user) {
        userInfo.textContent = `Autenticado como ${sessionData.user.login || 'Administrador'} (ID: ${sessionData.user.id})`;
      }

      const csrfRes = await fetch('/api/auth/csrf');
      if (csrfRes.ok) {
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrfToken || '';
      }

      await loadData();
      return true;
    } catch (err) {
      console.error('Erro na autenticação administrativa:', err);
      authGate.style.display = 'flex';
      adminApp.classList.remove('active');
      return false;
    }
  }

  // 2. Carregar Dados de Leads e Diagnósticos
  async function loadData() {
    try {
      const [leadsRes, diagsRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/diagnosticos')
      ]);

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        leads = Array.isArray(leadsData.leads) ? leadsData.leads : [];
      }

      if (diagsRes.ok) {
        const diagsData = await diagsRes.json();
        briefings = Array.isArray(diagsData.briefings) ? diagsData.briefings : [];
      }

      updateSegmentFilter();
      updateKPIs();
      renderTable();
    } catch (err) {
      console.error('Falha ao carregar dados do painel:', err);
      showToast('Falha ao sincronizar dados.');
    }
  }

  // 3. Atualizar KPIs e Contadores
  function updateKPIs() {
    if (countLeadsTab) countLeadsTab.textContent = String(leads.length);
    if (countBriefingsTab) countBriefingsTab.textContent = String(briefings.length);

    const items = currentTab === 'leads' ? leads : briefings;
    const total = items.length;
    const novos = items.filter(i => (i.status || 'novo') === 'novo').length;
    const emContato = items.filter(i => i.status === 'em_contato').length;
    const convertidos = items.filter(i => i.status === 'convertido').length;

    if (kpiTotal) kpiTotal.textContent = String(total);
    if (kpiNew) kpiNew.textContent = String(novos);
    if (kpiContact) kpiContact.textContent = String(emContato);
    if (kpiWon) kpiWon.textContent = String(convertidos);
  }

  // 4. Atualizar Opções do Filtro de Segmento
  function updateSegmentFilter() {
    if (!segmentFilter) return;
    const items = currentTab === 'leads' ? leads : briefings;
    const segments = new Set();

    items.forEach(i => {
      const seg = i.segment || i.segmento;
      if (seg && seg !== 'Não informado') segments.add(seg);
    });

    const currentVal = segmentFilter.value;
    while (segmentFilter.children.length > 1) {
      segmentFilter.removeChild(segmentFilter.lastChild);
    }

    segments.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      segmentFilter.appendChild(opt);
    });

    segmentFilter.value = currentVal || 'todos';
  }

  // 5. Renderizar Tabela com TextContent Seguro (Zero XSS)
  function renderTable() {
    if (!tableBody) return;
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }

    const items = currentTab === 'leads' ? leads : briefings;
    const query = (searchInput.value || '').toLowerCase().trim();
    const statusVal = statusFilter.value;
    const segVal = segmentFilter.value;

    const filtered = items.filter(item => {
      const status = item.status || 'novo';
      if (statusVal !== 'todos' && status !== statusVal) return false;

      const seg = item.segment || item.segmento || '';
      if (segVal !== 'todos' && seg !== segVal) return false;

      if (query) {
        const textContent = [
          item.name,
          item.contato_nome,
          item.email,
          item.contato_email,
          item.phone,
          item.contato_whatsapp,
          item.empresa,
          item.segment,
          item.segmento,
          item.gargalo_principal
        ].filter(Boolean).join(' ').toLowerCase();

        if (!textContent.includes(query)) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    filtered.forEach(item => {
      const tr = document.createElement('tr');

      // Coluna 1: Nome / Origem / Empresa
      const tdName = document.createElement('td');
      const nameBox = document.createElement('div');
      nameBox.className = 'lead-name-cell';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = item.contato_nome || item.name || item.empresa || 'Sem identificação';
      nameBox.appendChild(nameSpan);

      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'lead-source';
      sourceSpan.textContent = currentTab === 'leads'
        ? (item.source || 'Formulário do Site')
        : (item.empresa ? `Empresa: ${item.empresa}` : 'Diagnóstico');
      nameBox.appendChild(sourceSpan);
      tdName.appendChild(nameBox);
      tr.appendChild(tdName);

      // Coluna 2: Contato (E-mail e WhatsApp)
      const tdContact = document.createElement('td');
      const contactBox = document.createElement('div');
      contactBox.className = 'lead-contact-cell';

      const email = item.contato_email || item.email;
      if (email) {
        const emailLink = document.createElement('a');
        emailLink.href = `mailto:${encodeURIComponent(email)}`;
        emailLink.textContent = email;
        contactBox.appendChild(emailLink);
      }

      const phone = item.contato_whatsapp || item.phone;
      if (phone) {
        const phoneLink = document.createElement('a');
        phoneLink.href = formatWhatsAppLink(phone);
        phoneLink.target = '_blank';
        phoneLink.textContent = `📱 ${phone}`;
        contactBox.appendChild(phoneLink);
      }
      tdContact.appendChild(contactBox);
      tr.appendChild(tdContact);

      // Coluna 3: Segmento ou Linha Sugerida
      const tdSeg = document.createElement('td');
      const segBadge = document.createElement('span');
      segBadge.className = 'lead-segment-badge';
      segBadge.textContent = item.linha_sugerida || item.segmento || item.segment || 'Geral';
      tdSeg.appendChild(segBadge);
      tr.appendChild(tdSeg);

      // Coluna 4: Status com Quick Select
      const tdStatus = document.createElement('td');
      const selectStatus = document.createElement('select');
      const curStatus = item.status || 'novo';
      selectStatus.className = `status-quick-select status-${curStatus}`;

      [
        { value: 'novo', label: 'Novo' },
        { value: 'em_contato', label: 'Em Contato' },
        { value: 'convertido', label: 'Convertido' },
        { value: 'arquivado', label: 'Arquivado' }
      ].forEach(optInfo => {
        const opt = document.createElement('option');
        opt.value = optInfo.value;
        opt.textContent = optInfo.label;
        if (optInfo.value === curStatus) opt.selected = true;
        selectStatus.appendChild(opt);
      });

      selectStatus.addEventListener('change', async (e) => {
        const newSt = e.target.value;
        await updateItemStatus(item.id, newSt);
      });

      tdStatus.appendChild(selectStatus);
      tr.appendChild(tdStatus);

      // Coluna 5: Data
      const tdDate = document.createElement('td');
      const dateText = item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-';
      tdDate.textContent = dateText;
      tr.appendChild(tdDate);

      // Coluna 6: Ações
      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';
      const actionBox = document.createElement('div');
      actionBox.className = 'lead-actions-cell';

      if (phone) {
        const wppBtn = document.createElement('a');
        wppBtn.className = 'lead-action-btn action-wpp';
        wppBtn.href = formatWhatsAppLink(phone);
        wppBtn.target = '_blank';
        wppBtn.textContent = 'WhatsApp';
        actionBox.appendChild(wppBtn);
      }

      if (currentTab === 'briefings') {
        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'lead-action-btn action-icon-only';
        viewBtn.textContent = 'Ver';
        viewBtn.addEventListener('click', () => openBriefingModal(item));
        actionBox.appendChild(viewBtn);
      } else {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'lead-action-btn action-icon-only';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openEditModal(item));
        actionBox.appendChild(editBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'lead-action-btn action-icon-only action-icon-danger';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => deleteItem(item.id));
      actionBox.appendChild(delBtn);

      tdActions.appendChild(actionBox);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  }

  // 6. Atualizar Status no Backend
  async function updateItemStatus(id, newStatus) {
    try {
      const endpoint = currentTab === 'leads' ? '/api/admin/leads' : '/api/admin/diagnosticos';
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (res.ok) {
        showToast('Status atualizado.');
        const targetList = currentTab === 'leads' ? leads : briefings;
        const found = targetList.find(i => i.id === id);
        if (found) found.status = newStatus;
        updateKPIs();
        renderTable();
      } else {
        showToast('Falha ao atualizar status.');
      }
    } catch {
      showToast('Erro de conexão ao atualizar status.');
    }
  }

  // 7. Excluir Item
  async function deleteItem(id) {
    if (!confirm('Deseja realmente excluir este registro?')) return;

    try {
      const endpoint = currentTab === 'leads' ? '/api/admin/leads' : '/api/admin/diagnosticos';
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        showToast('Registro excluído com sucesso.');
        if (currentTab === 'leads') {
          leads = leads.filter(l => l.id !== id);
        } else {
          briefings = briefings.filter(b => b.id !== id);
        }
        updateKPIs();
        renderTable();
      } else {
        showToast('Falha ao excluir registro.');
      }
    } catch {
      showToast('Erro de conexão ao excluir.');
    }
  }

  // 8. Modais
  function openEditModal(lead) {
    const modal = document.getElementById('admin-modal-edit');
    if (!modal) return;
    document.getElementById('edit-lead-id').value = lead.id;
    document.getElementById('edit-lead-name').value = lead.name || '';
    document.getElementById('edit-lead-email').value = lead.email || '';
    document.getElementById('edit-lead-phone').value = lead.phone || '';
    document.getElementById('edit-lead-status').value = lead.status || 'novo';
    document.getElementById('edit-lead-notes').value = lead.notes || '';
    modal.classList.add('open');
  }

  function openBriefingModal(briefing) {
    const modal = document.getElementById('admin-modal-briefing');
    const content = document.getElementById('briefing-modal-content');
    const wppBtn = document.getElementById('briefing-wpp-btn');
    if (!modal || !content) return;

    while (content.firstChild) {
      content.removeChild(content.firstChild);
    }

    const fields = [
      ['Empresa', briefing.empresa],
      ['Decisor', `${briefing.contato_nome || ''} (${briefing.contato_cargo || ''})`],
      ['E-mail', briefing.contato_email],
      ['WhatsApp', briefing.contato_whatsapp],
      ['Linha Sugerida', briefing.linha_sugerida],
      ['Gargalo Principal', briefing.gargalo_principal],
      ['Como funciona hoje', briefing.descricao_livre],
      ['Ferramentas atuais', briefing.ferramentas_atuais],
      ['Frequência', briefing.frequencia],
      ['Impacto', briefing.impacto],
      ['Tentativas anteriores', briefing.tentativas_anteriores],
      ['Estrutura Decisória', briefing.estrutura_decisoria],
      ['Prazo Esperado', briefing.prazo_esperado],
      ['Canal de Origem', briefing.canal_origem]
    ];

    fields.forEach(([label, val]) => {
      if (!val) return;
      const p = document.createElement('p');
      p.style.marginBottom = '8px';
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      p.appendChild(strong);
      const span = document.createElement('span');
      span.textContent = val;
      p.appendChild(span);
      content.appendChild(p);
    });

    if (wppBtn) {
      wppBtn.href = formatWhatsAppLink(briefing.contato_whatsapp);
    }

    const copyBtn = document.getElementById('admin-copy-briefing-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const text = fields.filter(([, v]) => Boolean(v)).map(([l, v]) => `${l}: ${v}`).join('\n');
        navigator.clipboard.writeText(text).then(() => showToast('Briefing copiado para IA!'));
      };
    }

    modal.classList.add('open');
  }

  // Fechar modais
  document.querySelectorAll('.admin-submodal').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('open');
    });
  });
  document.querySelectorAll('.admin-btn-ghost, [id^="admin-cancel-"], [id^="admin-close-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-submodal').forEach(m => m.classList.remove('open'));
    });
  });

  // Formulário: Salvar Edição de Lead
  const editForm = document.getElementById('admin-form-edit');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-lead-id').value;
      const updates = {
        name: document.getElementById('edit-lead-name').value.trim(),
        email: document.getElementById('edit-lead-email').value.trim(),
        phone: document.getElementById('edit-lead-phone').value.trim(),
        status: document.getElementById('edit-lead-status').value,
        notes: document.getElementById('edit-lead-notes').value.trim()
      };

      try {
        const res = await fetch('/api/admin/leads', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ id, ...updates })
        });

        if (res.ok) {
          showToast('Lead atualizado.');
          const target = leads.find(l => l.id === id);
          if (target) Object.assign(target, updates);
          document.getElementById('admin-modal-edit').classList.remove('open');
          updateKPIs();
          renderTable();
        } else {
          showToast('Falha ao salvar alterações.');
        }
      } catch {
        showToast('Erro de conexão ao salvar.');
      }
    });
  }

  // Formulário: Novo Lead Manual
  const newLeadBtn = document.getElementById('admin-btn-new');
  if (newLeadBtn) {
    newLeadBtn.addEventListener('click', () => {
      document.getElementById('admin-modal-newlead').classList.add('open');
    });
  }

  const newLeadForm = document.getElementById('admin-form-newlead');
  if (newLeadForm) {
    newLeadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newLead = {
        name: document.getElementById('new-lead-name').value.trim(),
        email: document.getElementById('new-lead-email').value.trim(),
        phone: document.getElementById('new-lead-phone').value.trim(),
        segment: document.getElementById('new-lead-segment').value.trim() || 'Manual',
        source: 'Cadastro Manual Admin'
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead)
        });

        if (res.ok) {
          showToast('Novo lead cadastrado.');
          document.getElementById('admin-modal-newlead').classList.remove('open');
          newLeadForm.reset();
          await loadData();
        } else {
          showToast('Falha ao cadastrar lead.');
        }
      } catch {
        showToast('Erro ao cadastrar lead.');
      }
    });
  }

  // Abas
  const tabLeadsBtn = document.getElementById('tab-leads-btn');
  const tabBriefingsBtn = document.getElementById('tab-briefings-btn');

  if (tabLeadsBtn && tabBriefingsBtn) {
    tabLeadsBtn.addEventListener('click', () => {
      currentTab = 'leads';
      tabLeadsBtn.classList.add('active');
      tabBriefingsBtn.classList.remove('active');
      updateSegmentFilter();
      updateKPIs();
      renderTable();
    });

    tabBriefingsBtn.addEventListener('click', () => {
      currentTab = 'briefings';
      tabBriefingsBtn.classList.add('active');
      tabLeadsBtn.classList.remove('active');
      updateSegmentFilter();
      updateKPIs();
      renderTable();
    });
  }

  // Filtros & Busca
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (statusFilter) statusFilter.addEventListener('change', renderTable);
  if (segmentFilter) segmentFilter.addEventListener('change', renderTable);

  // Botão Sincronizar
  const refreshBtn = document.getElementById('admin-btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      showToast('Sincronizando...');
      await loadData();
      showToast('Dados sincronizados.');
    });
  }

  // Exportar CSV Seguro
  const exportBtn = document.getElementById('admin-btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const items = currentTab === 'leads' ? leads : briefings;
      if (items.length === 0) {
        showToast('Nenhum dado para exportar.');
        return;
      }

      const headers = ['ID', 'Nome/Empresa', 'E-mail', 'Telefone', 'Segmento', 'Status', 'Data'];
      const rows = items.map(i => [
        i.id || '',
        i.name || i.contato_nome || i.empresa || '',
        i.email || i.contato_email || '',
        i.phone || i.contato_whatsapp || '',
        i.segment || i.segmento || i.linha_sugerida || '',
        i.status || 'novo',
        i.createdAt || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `dreven_${currentTab}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV exportado com sucesso.');
    });
  }

  // Logout
  const logoutBtn = document.getElementById('admin-btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
      } catch {
        window.location.reload();
      }
    });
  }

  // Inicializar
  initAuth();
});
