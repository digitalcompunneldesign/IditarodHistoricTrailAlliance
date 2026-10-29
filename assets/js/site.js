/* ==========================================================================
   Iditarod Historic Trail Alliance — shared behaviour
   --------------------------------------------------------------------------
   The header, footer and navigation are rendered into every page at build
   time (build_site.py), so they are in the served HTML for search engines and
   for visitors without JavaScript. This file only adds behaviour:

     · mega-menu + mobile navigation          · site search
     · forms (contact, newsletter, grants…)   · cart, donations, membership
     · payment hand-off                       · accessibility preferences
     · scroll reveal

   Everything an administrator might need to change is in CONFIG below.
   ========================================================================== */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* ------------------------------------------------------------------------
     CONFIG — the only place endpoints and keys are set
     ------------------------------------------------------------------------ */
  const CONFIG = {
    /* Form delivery. A static site cannot send mail by itself; submissions go
       to FormSubmit, which forwards to `formsTo`. The first submission sends
       a one-time activation email to that address. Swap `formsEndpoint` for
       the CMS / CRM form handler at build-out. */
    formsTo: 'sanjay.pal@compunnel.com',
    formsEndpoint: 'https://formsubmit.co/ajax/sanjay.pal@compunnel.com',
    subjectPrefix: 'IHTA website',

    /* Email list. When the platform is chosen (Mailchimp, Constant Contact,
       or the CMS's own CRM) set `newsletterEndpoint` to its signup URL. Until
       then sign-ups are delivered through the form endpoint above. */
    newsletterEndpoint: '',

    /* Payments. The store, donations and membership all hand off to a hosted,
       PCI-compliant checkout — card details never touch this site.
       provider: 'square' (the Alliance's current processor) | 'stripe'
       checkoutEndpoint: a server route that receives the order JSON and
       returns { url } for the hosted checkout page. Left empty, the site runs
       in DEMO mode and explains the hand-off instead of taking payment. */
    payments: { provider: 'square', checkoutEndpoint: '' }
  };
  window.IHTA = Object.assign(window.IHTA || {}, { CONFIG });

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const money = n => '$' + Number(n).toFixed(2).replace(/\.00$/, '');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  /* ------------------------------------------------------------------------
     TOAST
     ------------------------------------------------------------------------ */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  /* ------------------------------------------------------------------------
     HEADER + NAVIGATION
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = $('#header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const items = $$('.nav-item');
    const closeAll = except => items.forEach(it => {
      if (it === except) return;
      it.classList.remove('is-open');
      const b = $('.nav-toggle', it); if (b) b.setAttribute('aria-expanded', 'false');
    });
    items.forEach(it => {
      const btn = $('.nav-toggle', it);
      if (!btn) return;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = !it.classList.contains('is-open');
        closeAll(it);
        it.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
      it.addEventListener('keydown', e => {
        if (e.key === 'Escape' && it.classList.contains('is-open')) {
          it.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus();
        }
      });
      it.addEventListener('focusout', e => {
        if (window.innerWidth > 1100 && !it.contains(e.relatedTarget)) {
          it.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
    document.addEventListener('click', e => { if (!e.target.closest('.nav-item')) closeAll(); });

    const burger = $('#burger');
    if (burger) burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open'); document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false'); burger.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     SEARCH — runs in the browser against window.SEARCH_INDEX, which
     build_site.py generates from the pages themselves.
     ------------------------------------------------------------------------ */
  function initSearch() {
    const panel = $('#searchPanel'), input = $('#searchInput'), results = $('#searchResults'), opener = $('#searchOpen');
    if (!panel || !input) return;
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    function score(r, terms) {
      const t = norm(r.title), x = norm(r.text), k = norm(r.kind);
      let total = 0;
      for (const term of terms) {
        let s = 0;
        if (t === term) s = 120; else if (t.startsWith(term)) s = 80;
        else if (new RegExp('\\b' + reEsc(term)).test(t)) s = 60; else if (t.includes(term)) s = 40;
        if (k.includes(term)) s = Math.max(s, 40);
        if (x.includes(term)) s = Math.max(s, new RegExp('\\b' + reEsc(term)).test(x) ? 22 : 10);
        if (!s) return 0;
        total += s;
      }
      return total + (r.kind === 'Page' ? 8 : 0);
    }
    function mark(str, terms, limit) {
      let out = str;
      if (limit && out.length > limit) {
        const first = terms.map(t => norm(out).indexOf(t)).filter(i => i >= 0).sort((a, b) => a - b)[0] || 0;
        const from = Math.max(0, first - 40);
        out = (from ? '…' : '') + out.slice(from, from + limit) + (out.length > from + limit ? '…' : '');
      }
      out = esc(out);
      terms.forEach(t => { out = out.replace(new RegExp('(' + reEsc(t) + ')', 'ig'), '<mark>$1</mark>'); });
      return out;
    }
    let cursor = -1;
    function render(q) {
      const terms = norm(q).split(/\s+/).filter(t => t.length > 1);
      cursor = -1; input.removeAttribute('aria-activedescendant');
      if (!terms.length) { results.innerHTML = ''; results.classList.remove('is-open'); return; }
      const hits = (window.SEARCH_INDEX || []).map(r => ({ r, s: score(r, terms) }))
        .filter(h => h.s > 0).sort((a, b) => b.s - a.s).slice(0, 8).map(h => h.r);
      results.classList.add('is-open');
      if (!hits.length) {
        results.innerHTML = `<p class="search-empty" role="status">Nothing matches <b>${esc(q)}</b>.<span>Try a place or a topic — Seward, roadhouse, passport, membership, serum run.</span></p>`;
        return;
      }
      results.innerHTML = hits.map((r, i) =>
        `<a class="search-hit" role="option" id="hit-${i}" aria-selected="false" href="${r.url}">
           <span class="hit-kind">${esc(r.kind)}</span>
           <span class="hit-main"><b>${mark(r.title, terms)}</b><em>${mark(r.text, terms, 130)}</em></span></a>`).join('') +
        `<p class="search-count" role="status">${hits.length} result${hits.length === 1 ? '' : 's'} · Enter opens the first</p>`;
    }
    function move(step) {
      const items = $$('.search-hit', results); if (!items.length) return;
      if (cursor >= 0) items[cursor].setAttribute('aria-selected', 'false');
      cursor = (cursor + step + items.length) % items.length;
      items[cursor].setAttribute('aria-selected', 'true');
      items[cursor].scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', items[cursor].id);
    }
    let timer;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => render(input.value.trim()), 110); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { const items = $$('.search-hit', results); if (items.length) { e.preventDefault(); items[Math.max(cursor, 0)].click(); } }
    });
    let lastFocus = null;
    const show = () => { lastFocus = document.activeElement; panel.hidden = false; requestAnimationFrame(() => panel.classList.add('is-open')); document.body.style.overflow = 'hidden'; setTimeout(() => input.focus(), 60); };
    const hide = () => { panel.classList.remove('is-open'); document.body.style.overflow = ''; input.value = ''; render(''); setTimeout(() => { panel.hidden = true; }, 300); (lastFocus || opener).focus(); };
    if (opener) opener.addEventListener('click', show);
    $('#searchClose').addEventListener('click', hide);
    panel.addEventListener('click', e => { if (e.target === panel) hide(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) hide();
      if (e.key === '/' && !panel.classList.contains('is-open') && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); show(); }
      if (e.key === 'Tab' && panel.classList.contains('is-open')) trap(e, panel);
    });
  }

  function trap(e, root) {
    const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', root).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ------------------------------------------------------------------------
     MODAL (one shared dialog for confirmations and the payment hand-off)
     ------------------------------------------------------------------------ */
  let modal, modalBody, modalLast;
  function ensureModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modalTitle'); modal.hidden = true;
    modal.innerHTML = `<div class="modal-card"><button type="button" class="modal-x" data-close><span class="close-label">Close</span>${ICON_X}</button><div class="modal-body"></div></div>`;
    document.body.appendChild(modal);
    modalBody = $('.modal-body', modal);
    modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') trap(e, modal);
    });
  }
  function openModal(html) {
    ensureModal();
    modalLast = document.activeElement;
    modalBody.innerHTML = html;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const h = $('h2', modal); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }, 60);
  }
  function closeModal() {
    modal.classList.remove('is-open'); document.body.style.overflow = '';
    setTimeout(() => { modal.hidden = true; }, 320);
    if (modalLast) modalLast.focus();
  }

  /* ------------------------------------------------------------------------
     FORMS — any <form data-form="name"> gets validation + delivery
     ------------------------------------------------------------------------ */
  async function sendForm(payload, subject) {
    const body = Object.assign({ _subject: CONFIG.subjectPrefix + ' — ' + subject, _template: 'table', _captcha: 'false' }, payload);
    const res = await fetch(CONFIG.formsEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Delivery failed (' + res.status + ')');
    return res.json().catch(() => ({}));
  }
  function mailto(payload, subject) {
    const lines = Object.entries(payload).map(([k, v]) => k + ': ' + v).join('\n');
    return 'mailto:' + CONFIG.formsTo + '?subject=' + encodeURIComponent(CONFIG.subjectPrefix + ' — ' + subject) + '&body=' + encodeURIComponent(lines);
  }
  function validate(form) {
    let firstBad = null;
    $$('input, select, textarea', form).forEach(el => {
      if (el.type === 'hidden' || el.disabled) return;
      const slot = form.querySelector(`.err[data-for="${el.id}"]`);
      let msg = '';
      const v = (el.value || '').trim();
      if (el.required && el.type === 'checkbox' && !el.checked) msg = 'Please confirm to continue.';
      else if (el.required && !v) msg = (el.dataset.label || 'This field') + ' is required.';
      else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Enter an email address like name@example.com.';
      else if (v && el.type === 'number' && el.min && +v < +el.min) msg = 'Enter at least ' + el.min + '.';
      if (slot) slot.textContent = msg;
      if (msg) { el.setAttribute('aria-invalid', 'true'); if (slot) el.setAttribute('aria-describedby', slot.id || (slot.id = el.id + '-err')); firstBad = firstBad || el; }
      else el.removeAttribute('aria-invalid');
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function initForms() {
    $$('form[data-form]').forEach(form => {
      form.setAttribute('novalidate', '');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validate(form)) return;
        const kind = form.dataset.form;
        const data = Object.fromEntries(new FormData(form).entries());
        const btn = form.querySelector('[type="submit"]');
        const label = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        const subject = form.dataset.subject || kind;
        const done = (title, msg, extra = '') => {
          const target = form.closest('[data-form-host]') || form;
          target.innerHTML = `<div class="form-done" role="status" tabindex="-1">${ICON_CHECK}<h3>${title}</h3><p>${msg}</p>${extra}</div>`;
          $('.form-done', target).focus();
        };
        try {
          if (kind === 'newsletter' && CONFIG.newsletterEndpoint) {
            await fetch(CONFIG.newsletterEndpoint, { method: 'POST', body: new FormData(form) });
          } else {
            await sendForm(data, subject);
          }
          if (kind === 'newsletter') {
            const msg = form.querySelector('.newsletter-msg');
            form.reset();
            if (msg) msg.textContent = 'Thank you — you are on the list. Watch your inbox for The Tripod.';
            if (btn) { btn.disabled = false; btn.innerHTML = label; }
            return;
          }
          done(form.dataset.doneTitle || 'Thank you', form.dataset.doneMsg || 'Your message has reached the Alliance. We reply within a few working days.');
        } catch (err) {
          if (kind === 'newsletter') {
            const msg = form.querySelector('.newsletter-msg');
            if (msg) msg.innerHTML = `We could not reach the list just now. <a class="text-link" href="${mailto(data, subject)}">Email us to join</a>.`;
            if (btn) { btn.disabled = false; btn.innerHTML = label; }
            return;
          }
          done('Almost there', 'We could not send that from your browser. Send it as an email instead and nothing you typed will be lost.',
            `<p style="margin-top:18px"><a class="btn btn--brand" href="${mailto(data, subject)}">Send as email</a></p>`);
          console.warn('Form delivery failed:', err.message);
        }
      });
      $$('input, select, textarea', form).forEach(el => el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') {
          el.removeAttribute('aria-invalid');
          const slot = form.querySelector(`.err[data-for="${el.id}"]`); if (slot) slot.textContent = '';
        }
      }));
    });
  }

  /* ------------------------------------------------------------------------
     CART — merchandise + memberships. Kept in this visitor's browser only;
     the order is sent to the payment provider at checkout.
     ------------------------------------------------------------------------ */
  const CART_KEY = 'ihta-cart';
  const catalog = () => window.IHTA_PRODUCTS || {};
  const cart = {
    items() { return store.get(CART_KEY, []).filter(l => catalog()[l.id]); },
    save(items) { store.set(CART_KEY, items); renderCart(); },
    add(id, qty = 1) {
      const items = this.items(); const line = items.find(l => l.id === id);
      if (line) line.qty = Math.min(line.qty + qty, 20); else items.push({ id, qty });
      this.save(items);
    },
    setQty(id, qty) {
      let items = this.items();
      items = qty <= 0 ? items.filter(l => l.id !== id) : items.map(l => l.id === id ? { id, qty: Math.min(qty, 20) } : l);
      this.save(items);
    },
    total() { return this.items().reduce((s, l) => s + catalog()[l.id].price * l.qty, 0); },
    count() { return this.items().reduce((s, l) => s + l.qty, 0); },
    clear() { this.save([]); }
  };
  window.IHTA.cart = cart;

  let drawer;
  function ensureDrawer() {
    if (drawer) return;
    drawer = document.createElement('div');
    drawer.className = 'drawer'; drawer.id = 'cartDrawer';
    drawer.innerHTML = `<div class="drawer-scrim" data-close-cart></div>
      <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
        <div class="drawer-head"><h2 id="cartTitle">Your cart</h2>
          <button type="button" class="modal-x" style="position:static" data-close-cart><span class="close-label">Close</span>${ICON_X}</button></div>
        <div class="drawer-body" id="cartBody"></div>
        <div class="drawer-foot" id="cartFoot"></div>
      </aside>`;
    drawer.hidden = true;
    document.body.appendChild(drawer);
    drawer.addEventListener('click', e => {
      if (e.target.closest('[data-close-cart]')) closeCart();
      const q = e.target.closest('[data-qty]');
      if (q) { const l = cart.items().find(x => x.id === q.dataset.id); cart.setQty(q.dataset.id, (l ? l.qty : 0) + Number(q.dataset.qty)); }
      const r = e.target.closest('[data-remove]');
      if (r) cart.setQty(r.dataset.remove, 0);
    });
    drawer.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); if (e.key === 'Tab') trap(e, drawer); });
    renderCart();
  }
  let cartLast;
  function openCart() {
    ensureDrawer(); cartLast = document.activeElement;
    drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#cartTitle').setAttribute('tabindex', '-1') || $('#cartTitle').focus(), 80);
  }
  function closeCart() {
    drawer.classList.remove('is-open'); document.body.style.overflow = '';
    setTimeout(() => { drawer.hidden = true; }, 360);
    if (cartLast) cartLast.focus();
  }
  function lineHTML(l) {
    const p = catalog()[l.id];
    return `<div class="cart-line">
      <img src="${p.img}" alt="">
      <div><b>${esc(p.name)}</b>
        <span class="qty" role="group" aria-label="Quantity for ${esc(p.name)}">
          <button type="button" data-qty="-1" data-id="${l.id}" aria-label="One fewer">−</button>
          <output aria-live="polite">${l.qty}</output>
          <button type="button" data-qty="1" data-id="${l.id}" aria-label="One more">+</button>
        </span><button type="button" class="line-remove" data-remove="${l.id}">Remove</button></div>
      <span class="price">${money(p.price * l.qty)}</span></div>`;
  }
  function renderCart() {
    const n = cart.count();
    $$('.cart-count').forEach(b => { b.textContent = n; b.hidden = !n; });
    $$('[data-cart-label]').forEach(b => b.setAttribute('aria-label', `Cart, ${n} item${n === 1 ? '' : 's'}`));
    if (drawer) {
      const items = cart.items();
      $('#cartBody').innerHTML = items.length ? items.map(lineHTML).join('') :
        '<p class="cart-empty">Your cart is empty.<br><a class="text-link" href="store.html">Browse the store</a></p>';
      $('#cartFoot').innerHTML = items.length ? `<p class="cart-total"><span>Subtotal</span><span>${money(cart.total())}</span></p>
        <p style="font-size:13.5px;color:var(--c-muted);margin-bottom:14px">Publication prices include U.S. Postal Service shipping.</p>
        <a class="btn btn--brand" style="width:100%" href="checkout.html">Checkout</a>` : '';
    }
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  function initCart() {
    $$('[data-open-cart]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openCart(); }));
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (!add) return;
      e.preventDefault();
      const p = catalog()[add.dataset.add];
      if (!p) return;
      cart.add(add.dataset.add, Number(add.dataset.qty || 1));
      toast(`Added to cart: ${p.name}`);
      if (add.hasAttribute('data-go-cart')) openCart();
    });
    renderCart();
  }

  /* ------------------------------------------------------------------------
     PAYMENT HAND-OFF — store checkout, donations and membership all end here
     ------------------------------------------------------------------------ */
  async function handOff(order) {
    if (CONFIG.payments.checkoutEndpoint) {
      const res = await fetch(CONFIG.payments.checkoutEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error('Checkout unavailable (' + res.status + ')');
      const { url } = await res.json();
      window.location.href = url;
      return;
    }
    const prov = CONFIG.payments.provider === 'stripe' ? 'Stripe Checkout' : 'Square Online Checkout';
    const rows = order.lines.map(l => `<tr><td>${esc(l.name)}${l.qty > 1 ? ' × ' + l.qty : ''}</td><td style="text-align:right">${money(l.amount * l.qty)}</td></tr>`).join('');
    openModal(`<h2 id="modalTitle">Secure payment step</h2>
      <p style="margin-top:12px">This is a design preview, so no payment is taken. On the live site this button sends the
      order below to <b>${prov}</b>, the Alliance's payment processor, and the visitor pays on its secure, hosted page.
      Card details never touch this website.</p>
      <table class="data-table" style="margin-top:18px">${rows}
        <tr><td><b>Total</b></td><td style="text-align:right"><b>${money(order.total)}</b></td></tr></table>
      <p style="margin-top:16px;font-size:14px;color:var(--c-muted)">After payment the processor returns the visitor to a
      thank-you page and records the ${order.kind === 'donation' ? 'donor' : 'customer'} in the Alliance's contact list${order.optIn ? ', including their newsletter opt-in' : ''}.</p>
      <p style="margin-top:20px"><button type="button" class="btn btn--brand" data-close>Got it</button></p>`);
  }
  window.IHTA.handOff = handOff;

  function initDonate() {
    $$('form[data-donate]').forEach(form => {
      form.setAttribute('novalidate', '');
      const other = $('[name="other"]', form);
      const sum = $('[data-donate-sum]', form);
      const amount = () => {
        const sel = $('[name="amount"]:checked', form);
        if (sel && sel.value === 'other') return Math.max(0, Number(other.value) || 0);
        return sel ? Number(sel.value) : 0;
      };
      const freq = () => ($('[name="frequency"]:checked', form) || {}).value || 'once';
      const paint = () => {
        if (other) other.closest('.field').hidden = (($('[name="amount"]:checked', form) || {}).value !== 'other');
        if (sum) sum.textContent = amount() ? `${money(amount())}${freq() === 'monthly' ? ' every month' : ''}` : '—';
      };
      form.addEventListener('change', paint); form.addEventListener('input', paint); paint();
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!amount()) { const err = $('.err[data-for="donAmount"]', form); if (err) err.textContent = 'Choose or enter an amount.'; return; }
        if (!validate(form)) return;
        const d = Object.fromEntries(new FormData(form).entries());
        await handOff({
          kind: 'donation', frequency: freq(), total: amount(), optIn: !!d.optin,
          donor: { name: d.name, email: d.email, dedication: d.dedication || '' },
          lines: [{ name: (freq() === 'monthly' ? 'Monthly' : 'One-time') + ' donation' + (d.fund ? ' — ' + d.fund : ''), amount: amount(), qty: 1 }]
        });
      });
    });
  }

  function initCheckout() {
    const form = $('form[data-checkout]');
    if (!form) return;
    form.setAttribute('novalidate', '');
    const list = $('#checkoutLines'), totalEl = $('#checkoutTotal');
    const paint = () => {
      const items = cart.items();
      list.innerHTML = items.length ? items.map(lineHTML).join('') : '<p class="cart-empty">Your cart is empty. <a class="text-link" href="store.html">Visit the store</a>.</p>';
      totalEl.textContent = money(cart.total());
      $('[type="submit"]', form).disabled = !items.length;
      const ship = $('#shipFields');
      if (ship) {
        const needsShip = items.some(l => catalog()[l.id].ship);
        ship.hidden = !needsShip;
        $$('input', ship).forEach(i => { i.required = needsShip && i.dataset.req === '1'; });
      }
    };
    list.addEventListener('click', e => {
      const q = e.target.closest('[data-qty]');
      if (q) { const l = cart.items().find(x => x.id === q.dataset.id); cart.setQty(q.dataset.id, (l ? l.qty : 0) + Number(q.dataset.qty)); }
      const r = e.target.closest('[data-remove]'); if (r) cart.setQty(r.dataset.remove, 0);
    });
    document.addEventListener('cart:change', paint); paint();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate(form)) return;
      const d = Object.fromEntries(new FormData(form).entries());
      await handOff({
        kind: 'order', total: cart.total(), optIn: !!d.optin, customer: d,
        lines: cart.items().map(l => ({ id: l.id, name: catalog()[l.id].name, amount: catalog()[l.id].price, qty: l.qty }))
      });
    });
  }

  /* ------------------------------------------------------------------------
     FILTER CHIPS — any [data-filter-group] toggles [data-tags] cards
     ------------------------------------------------------------------------ */
  function initFilters() {
    $$('[data-filter-group]').forEach(group => {
      const target = $(group.dataset.filterGroup);
      const live = $(group.dataset.live || '#nope');
      group.addEventListener('click', e => {
        const chip = e.target.closest('.chip'); if (!chip) return;
        $$('.chip', group).forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
        const tag = chip.dataset.tag;
        let n = 0;
        $$('[data-tags]', target).forEach(card => {
          const show = tag === 'all' || card.dataset.tags.split(' ').includes(tag);
          card.hidden = !show; if (show) n++;
        });
        if (live) live.textContent = `Showing ${n} ${n === 1 ? 'item' : 'items'}`;
      });
    });
  }

  /* ------------------------------------------------------------------------
     ACCESSIBILITY PREFERENCES — supplements, never replaces, OS settings
     ------------------------------------------------------------------------ */
  const A11Y_OPTS = [
    ['bigger', 'a11y-bigger', 'Larger text', 'Scales the whole page to 115%'],
    ['contrast', 'a11y-contrast', 'Higher contrast', 'Darkens body text and borders'],
    ['links', 'a11y-links', 'Underline links', 'Never relies on colour alone'],
    ['motion', 'a11y-motion', 'Reduce motion', 'Stops animation and slideshows'],
    ['spacing', 'a11y-spacing', 'More text spacing', 'Increases line and letter spacing']
  ];
  function initA11y() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<button class="a11y-fab" id="a11yFab" aria-expanded="false" aria-controls="a11yPanel" aria-label="Accessibility options">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="6.4" r="1.7" fill="currentColor"/><path d="M4.9 9.1c2.3.8 4.6 1.2 7.1 1.2s4.8-.4 7.1-1.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12 10.3v4.1m0 0-2.6 5.2m2.6-5.2 2.6 5.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button>
      <div class="a11y-panel" id="a11yPanel" role="dialog" aria-modal="false" aria-labelledby="a11yTitle" hidden>
        <div class="a11y-head"><h2 id="a11yTitle">Accessibility</h2><button type="button" class="a11y-close" id="a11yClose"><span class="close-label">Close</span>${ICON_X.replace('<svg', '<svg width="18" height="18"')}</button></div>
        <ul class="a11y-list">${A11Y_OPTS.map(([id, cls, label, hint]) => `<li><label class="a11y-row" for="a11y-${id}"><span class="a11y-text"><b>${label}</b><em>${hint}</em></span><input type="checkbox" id="a11y-${id}" data-a11y="${cls}"><span class="a11y-switch" aria-hidden="true"></span></label></li>`).join('')}</ul>
        <button type="button" class="a11y-reset" id="a11yReset">Reset all</button>
        <p class="a11y-note">Your browser and system settings are respected as well.</p>
      </div>`;
    document.body.append(...wrap.children);
    const fab = $('#a11yFab'), panel = $('#a11yPanel'), root = document.documentElement;
    let state = store.get('ihta-a11y', {});
    const apply = () => {
      A11Y_OPTS.forEach(([id, cls]) => { root.classList.toggle(cls, !!state[cls]); $('#a11y-' + id).checked = !!state[cls]; });
      store.set('ihta-a11y', state);
      document.dispatchEvent(new CustomEvent('a11y:change', { detail: state }));
    };
    apply();
    $$('input[data-a11y]', panel).forEach(b => b.addEventListener('change', () => { state[b.dataset.a11y] = b.checked; apply(); }));
    $('#a11yReset').addEventListener('click', () => { state = {}; apply(); });
    const open = () => { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => panel.classList.add('is-open')); $('input', panel).focus(); };
    const close = (back = true) => { panel.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false'); setTimeout(() => { panel.hidden = true; }, 200); if (back) fab.focus(); };
    fab.addEventListener('click', () => fab.getAttribute('aria-expanded') === 'true' ? close() : open());
    $('#a11yClose').addEventListener('click', () => close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
    document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) close(false); });
  }
  window.IHTA.motionOff = () => REDUCED || document.documentElement.classList.contains('a11y-motion');

  /* ------------------------------------------------------------------------
     FOOTER RIDGE — the Chugach skyline, drifting slowly
     ------------------------------------------------------------------------ */
  function mountRidge() {
    const host = $('#mtnFront'); if (!host) return;
    const d = 'M0,43.0 L21,48.0 L42,56.9 L63,63.9 L84,66.4 L105,75.1 L126,85.4 L147,89.4 L168,99.1 L189,117.9 L210,122.3 L231,120.3 L252,122.1 L273,127.0 L294,126.6 L315,123.3 L336,118.3 L357,112.4 L378,105.2 L399,98.9 L420,93.6 L441,88.3 L462,81.9 L483,74.4 L504,64.7 L525,53.7 L546,45.4 L567,39.4 L588,44.4 L609,53.0 L630,58.4 L651,63.1 L672,69.6 L693,64.9 L714,41.4 L735,26.6 L756,20.6 L777,19.4 L798,31.1 L819,48.6 L840,56.4 L861,54.1 L882,62.6 L903,64.4 L924,49.4 L945,42.6 L966,47.4 L987,52.6 L1008,51.4 L1029,48.1 L1050,38.9 L1071,32.4 L1092,41.1 L1113,45.6 L1134,42.6 L1155,44.9 L1176,58.6 L1197,72.1 L1218,68.4 L1239,66.1 L1260,68.9 L1281,77.4 L1302,86.1 L1323,86.1 L1344,89.4 L1365,95.9 L1386,101.4 L1407,107.4 L1428,112.4 L1449,114.9 L1470,114.1 L1491,109.4 L1511,105.0 L1511,105.0 L1531,109.4 L1552,114.1 L1573,114.9 L1594,112.4 L1615,107.4 L1636,101.4 L1657,95.9 L1678,89.4 L1699,86.1 L1720,86.1 L1741,77.4 L1762,68.9 L1783,66.1 L1804,68.4 L1825,72.1 L1846,58.6 L1867,44.9 L1888,42.6 L1909,45.6 L1930,41.1 L1951,32.4 L1972,38.9 L1993,48.1 L2014,51.4 L2035,52.6 L2056,47.4 L2077,42.6 L2098,49.4 L2119,64.4 L2140,62.6 L2161,54.1 L2182,56.4 L2203,48.6 L2224,31.1 L2245,19.4 L2266,20.6 L2287,26.6 L2308,41.4 L2329,64.9 L2350,69.6 L2371,63.1 L2392,58.4 L2413,53.0 L2434,44.4 L2455,39.4 L2476,45.4 L2497,53.7 L2518,64.7 L2539,74.4 L2560,81.9 L2581,88.3 L2602,93.6 L2623,98.9 L2644,105.2 L2665,112.4 L2686,118.3 L2707,123.3 L2728,126.6 L2749,127.0 L2770,122.1 L2791,120.3 L2812,122.3 L2833,117.9 L2854,99.1 L2875,89.4 L2896,85.4 L2917,75.1 L2938,66.4 L2959,63.9 L2980,56.9 L3001,48.0 L3022,43.0 L3022,140 L0,140 Z';
    const tile = `<svg viewBox="0 0 3022 140" preserveAspectRatio="none" aria-hidden="true"><path fill="var(--c-beige)" d="${d}"/></svg>`;
    host.innerHTML = tile + tile;
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL
     ------------------------------------------------------------------------ */
  let io;
  function revealAll(root) {
    const els = $$('.reveal:not(.is-in)', root || document);
    if (!els.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    io = io || new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    els.forEach(el => io.observe(el));
  }
  window.IHTA.revealAll = revealAll;
  window.IHTA.toast = toast;
  window.IHTA.openModal = openModal;

  function init() {
    initHeader(); initSearch(); initForms(); initCart(); initDonate(); initCheckout(); initFilters(); initA11y(); mountRidge();
    revealAll(); setTimeout(revealAll, 400);
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
