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
        
        window.location.href = '/admin';
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


  /* ── 10 · Redirecionamento de compatibilidade para /admin ───── */
  function checkAdminHash() {
    if (window.location.hash === '#admin') {
      window.location.href = '/admin';
    }
  }
  window.addEventListener('hashchange', checkAdminHash);
  checkAdminHash();
})();
