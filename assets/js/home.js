/* Homepage behaviour, ported from the Hiking Trails template:
   hero photo slider, 3D gallery, events carousel, tips toggle, route map. */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const motionOff = () => (window.IHTA && IHTA.motionOff) ? IHTA.motionOff() : false;

  /* ---------- hero: photographs, Ken Burns, mountain-bar selector, pause (WCAG 2.2.2) */
  (function hero() {
    const slides = $$('.hero-slide'), bars = $$('.hero-bars button');
    const pause = $('#heroPause'), live = $('#heroLive'), cap = $('#heroCaption'), heroEl = $('.hero');
    if (slides.length < 2) return;
    let i = 0, timer = null, paused = motionOff();
    function go(n, announce) {
      slides[i].classList.remove('is-active'); bars[i].setAttribute('aria-current', 'false');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active'); bars[i].setAttribute('aria-current', 'true');
      if (cap) cap.textContent = slides[i].dataset.credit || '';
      if (announce && live) live.textContent = `Photo ${i + 1} of ${slides.length}: ${slides[i].querySelector('img').alt}`;
      arm();
    }
    function arm() { clearTimeout(timer); if (!paused) timer = setTimeout(() => go(i + 1), 7000); }
    function setPaused(p) {
      paused = p; pause.setAttribute('aria-pressed', String(p));
      pause.querySelector('span').textContent = p ? 'Play' : 'Pause';
      $('.ico-pause', pause).style.display = p ? 'none' : '';
      $('.ico-play', pause).style.display = p ? '' : 'none';
      heroEl.classList.toggle('is-paused', p);
      arm();
    }
    bars.forEach((b, n) => b.addEventListener('click', () => go(n, true)));
    pause.addEventListener('click', () => setPaused(!paused));
    document.addEventListener('a11y:change', ev => { if (ev.detail['a11y-motion']) setPaused(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else arm(); });
    setPaused(paused);
  })();

  /* ---------- 3D perspective gallery (template) */
  (function gallery3d() {
    const stage = $('#stage'), inner = $('#stageInner'), live = $('#galLive');
    if (!stage) return;
    const figs = $$('.slide3d', inner), N = figs.length, SRC = N / 2;
    let active = 0, busy = false;
    function metrics() {
      const w = window.innerWidth;
      if (w < 768) return { step: 236, depth: 120, angle: 22, drop: 10 };
      if (w < 1024) return { step: 302, depth: 150, angle: 22, drop: 14 };
      if (w < 1240) return { step: 376, depth: 170, angle: 22, drop: 16 };
      return { step: 448, depth: 190, angle: 22, drop: 20 };
    }
    function layout() {
      const m = metrics();
      figs.forEach((fig, i) => {
        let o = ((i - active) % N + N) % N; if (o > N / 2) o -= N;
        const abs = Math.abs(o), visible = abs <= 3;
        const scale = abs === 0 ? 1 : 1.06 - (abs - 1) * 0.04;
        fig.style.transform = `translate3d(${o * m.step}px, ${abs * m.drop}px, ${-abs * m.depth}px) rotateY(${-o * m.angle}deg) rotateZ(${-o * 1.4}deg) scale(${scale})`;
        fig.style.opacity = visible ? (abs === 0 ? 1 : abs === 1 ? .98 : abs === 2 ? .92 : .8) : 0;
        fig.style.zIndex = String(20 - abs);
        fig.style.pointerEvents = visible ? 'auto' : 'none';
        fig.classList.toggle('is-center', abs === 0);
        fig.setAttribute('aria-hidden', abs === 0 ? 'false' : 'true');
      });
    }
    function goTo(i) {
      if (busy) return; busy = true;
      active = ((i % N) + N) % N; layout();
      const n = active % SRC;
      live.textContent = `${figs[active].querySelector('figcaption').textContent}. Image ${n + 1} of ${SRC}.`;
      setTimeout(() => { busy = false; }, motionOff() ? 0 : 380);
    }
    figs.forEach((f, i) => f.addEventListener('click', () => { if (i !== active) goTo(i); }));
    $('#galNext').addEventListener('click', () => goTo(active + 1));
    $('#galPrev').addEventListener('click', () => goTo(active - 1));
    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
    });
    let downX = null, moved = false;
    stage.addEventListener('pointerdown', e => { downX = e.clientX; moved = false; });
    stage.addEventListener('pointermove', e => {
      if (downX === null || moved) return;
      const d = e.clientX - downX;
      if (Math.abs(d) > 60) { moved = true; d < 0 ? goTo(active + 1) : goTo(active - 1); }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => stage.addEventListener(t, () => { downX = null; }));
    window.addEventListener('resize', layout);
    layout();
  })();

  /* ---------- events carousel (template) — moments in trail history */
  (function events() {
    const view = $('#eventsViewport'), track = $('#eventsTrack');
    if (!view) return;
    const prevBtn = $('#evPrev'), nextBtn = $('#evNext');
    let x = 0, maxX = 0, dragging = false, startX = 0, startPos = 0, moved = 0;
    function measure() {
      const pad = parseFloat(getComputedStyle(view).paddingLeft) || 0;
      maxX = Math.max(0, track.scrollWidth - (view.clientWidth - pad) + 24);
      setX(clamp(x, -maxX, 0), false);
    }
    function setX(v, animate = true) {
      x = clamp(v, -maxX, 0);
      track.style.transition = (animate && !motionOff()) ? 'transform var(--t-slow) var(--ease-cine)' : 'none';
      track.style.transform = `translate3d(${x}px,0,0)`;
      prevBtn.disabled = x >= -1; nextBtn.disabled = x <= -maxX + 1;
    }
    const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth : 320) + 22;
    nextBtn.addEventListener('click', () => setX(x - step()));
    prevBtn.addEventListener('click', () => setX(x + step()));
    view.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); setX(x - step()); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setX(x + step()); }
    });
    /* keep keyboard focus visible: a focused link inside a hidden card scrolls it in */
    track.addEventListener('focusin', e => {
      const card = e.target.closest('.event-card'); if (!card) return;
      const idx = [...track.children].indexOf(card);
      setX(-idx * step());
    });
    view.addEventListener('pointerdown', e => {
      if (e.target.closest('a')) return;
      dragging = true; moved = 0; startX = e.clientX; startPos = x;
      view.classList.add('is-dragging'); view.setPointerCapture(e.pointerId);
    });
    view.addEventListener('pointermove', e => { if (!dragging) return; const d = e.clientX - startX; moved = Math.abs(d); setX(startPos + d, false); });
    function end() { if (!dragging) return; dragging = false; view.classList.remove('is-dragging'); const s = step(); setX(Math.round(x / s) * s); }
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
    view.addEventListener('click', e => { if (moved > 8) { e.preventDefault(); moved = 0; } }, true);
    view.addEventListener('wheel', e => { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault(); setX(x - e.deltaX, false); }, { passive: false });
    window.addEventListener('resize', measure); window.addEventListener('load', measure); measure();
  })();

  /* ---------- tips toggle (template) */
  (function tips() {
    const btn = $('#tipsToggle'), cols = $('#tipsCols');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = cols.classList.toggle('show-all');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = open ? 'Show fewer tips' : 'Read all tips';
      if (open && window.IHTA) IHTA.revealAll(cols);
    });
  })();

  /* ---------- route map */
  (function miniMap() {
    const el = $('#homeMap');
    if (!el || !window.maplibregl || !window.InhtMap) return;
    const io = new IntersectionObserver(async ents => {
      if (!ents.some(e => e.isIntersecting)) return;
      io.disconnect();
      const map = InhtMap.create(el, { padding: 26, dragPan: true, cooperative: true });
      const { coords } = await InhtMap.route();
      InhtMap.whenReady(map, () => {
        InhtMap.addRoute(map, coords);
        window.TRAIL_STOPS.forEach(s => {
          /* overview pins are decorative; the "Travel it stop by stop" button is
             the control, so close-together pins never become tiny tap targets */
          const a = document.createElement('span');
          a.className = 'mini-pin'; a.title = s.name; a.setAttribute('aria-hidden', 'true');
          new maplibregl.Marker({ element: a }).setLngLat([s.lng, s.lat]).addTo(map);
        });
      });
    }, { rootMargin: '200px' });
    io.observe(el);
  })();
})();
