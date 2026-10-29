/* ==========================================================================
   INTERACTIVE TRAIL MAP — scroll from Seward to Nome.
   The map is fixed; each stop is a chapter. A narrow band across the middle
   of the viewport decides which chapter is being read, so scrolling back up
   re-activates the previous stop for free. Deep links: trail-map.html#nome.
   ========================================================================== */
(async function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const motionOff = () => (window.IHTA && IHTA.motionOff) ? IHTA.motionOff() : false;
  const stops = window.TRAIL_STOPS;
  const stepsEl = $('#journeySteps'), railEl = $('#progressRail'), introEl = $('#journeyIntro'), noteEl = $('#mapNote');
  const ICON = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
  };
  const region = r => (window.TRAIL_REGIONS || {})[r] || '';

  /* ---- chapters ---- */
  stepsEl.insertAdjacentHTML('beforeend', '<div class="step step--intro" aria-hidden="true"></div>');
  stops.forEach((s, i) => {
    stepsEl.insertAdjacentHTML('beforeend', `
      <section class="step" id="${s.id}" data-stop="${i}" aria-labelledby="h-${s.id}">
        <div class="container"><article class="stop-card">
          <div class="stop-shot"><img src="assets/img/${s.img}.jpg" alt="${s.alt}" loading="lazy"></div>
          <div class="stop-body">
            <div class="stop-head"><span class="stop-num" aria-hidden="true">${i + 1}</span>
              <div><h2 class="stop-name" id="h-${s.id}">${s.name}</h2><span class="stop-kind">${s.kind} · ${region(s.region)}</span></div></div>
            <p class="stop-desc">${s.blurb}</p>
            <ul class="stop-meta">
              <li>${ICON.pin}<span>Distance from Seward: <b data-mile>measuring…</b></span></li>
              ${s.see ? `<li>${ICON.eye}<span>${s.see}</span></li>` : ''}
            </ul>
          </div></article></div>
      </section>`);
    railEl.insertAdjacentHTML('beforeend', `<button type="button" data-go="${i}" aria-label="Go to stop ${i + 1}, ${s.name}">${i + 1}</button>`);
  });
  $('#jumpList').innerHTML = ['seward', 'girdwood', 'rainy-pass', 'kaltag', 'nome']
    .map(id => stops.find(s => s.id === id)).filter(Boolean).map(s => `<a href="#${s.id}">${s.name.split(' ')[0]}</a>`).join('');
  stepsEl.insertAdjacentHTML('beforeend', `
    <section class="step step--outro" aria-labelledby="outroTitle"><div class="container"><div class="journey-outro">
      <h2 id="outroTitle">About this map</h2>
      <p>The yellow line is an approximate trace of the 1,000-mile primary route, drawn through known waypoints — close at state scale,
        not survey data. The full trail system includes another 1,400 miles of side and connecting trails. For official maps and the
        current Comprehensive Plan, see the <a class="text-link" href="https://www.blm.gov/programs/national-conservation-lands/national-scenic-and-historic-trails/iditarod" target="_blank" rel="noopener">Bureau of Land Management</a>.</p>
      <p style="margin-top:18px"><a class="btn btn--brand" href="index.html">Back to the homepage ${ICON.arrow}</a></p>
    </div></div></section>`);

  const stepEls = $$('.step[data-stop]', stepsEl), railBtns = $$('button', railEl);

  /* ---- map ---- */
  let engineReady = false, map;
  const { coords, source } = await InhtMap.route();
  const cum = InhtMap.cumulative(coords), total = cum[cum.length - 1];
  /* the trace is simplified, so scale it to the published 1,000-mile main trail */
  const scale = source === 'geojson' ? 1 : 1000 / (total / 1609.34);
  stops.forEach(s => { const sn = InhtMap.snap([s.lng, s.lat], coords, cum); s.mile = sn.along / 1609.34 * scale; });
  stepEls.forEach((el, i) => {
    const m = el.querySelector('[data-mile]');
    m.textContent = i === 0 ? 'Mile 0' : `roughly ${Math.round(stops[i].mile / 10) * 10} miles along the main trail (estimate)`;
  });
  noteEl.innerHTML = source === 'geojson'
    ? '<b>Route:</b> BLM GIS data. Imagery © Esri.'
    : '<b>Route is approximate</b> — traced through known waypoints; distances are estimates. Imagery © Esri.';

  try {
    map = InhtMap.create('map', { padding: { top: 60, bottom: 60, right: 60, left: window.innerWidth > 860 ? 560 : 40 } });
    InhtMap.whenReady(map, () => {
      InhtMap.addRoute(map, coords);
      stops.forEach((s, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'mk'; b.textContent = String(i + 1);
        b.setAttribute('aria-label', `Stop ${i + 1}: ${s.name}`);
        b.addEventListener('click', () => goTo(i));
        new maplibregl.Marker({ element: b }).setLngLat([s.lng, s.lat]).addTo(map);
        s.el = b;
      });
      engineReady = true;
      if (active >= 0) setActive(active, true);
    });
  } catch (err) {
    noteEl.innerHTML = '<b>The map could not load in this browser.</b> Every stop is still listed below.';
  }

  /* ---- scroll story ---- */
  let active = -1;
  const narrow = () => window.innerWidth <= 860;
  function setActive(i, force) {
    if (i === active && !force) return;
    active = i;
    stepEls.forEach((el, n) => el.classList.toggle('is-active', n === i));
    railBtns.forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
    introEl.classList.toggle('is-past', i >= 0);
    railEl.classList.toggle('is-hidden', i < 0);
    if (!engineReady) return;
    stops.forEach((s, n) => s.el && s.el.classList.toggle('is-active', n === i));
    if (i < 0) {
      map.fitBounds(window.MAP_CONFIG.alaska, { padding: { top: 60, bottom: 60, right: 60, left: narrow() ? 40 : 560 }, duration: motionOff() ? 0 : 1600 });
      return;
    }
    const s = stops[i];
    const offset = narrow() ? [0, -window.innerHeight * 0.22] : [-window.innerWidth * 0.18, 0];
    const opts = { center: [s.lng, s.lat], zoom: narrow() ? 6.6 : 7.4, offset };
    motionOff() ? map.jumpTo(opts) : map.flyTo(Object.assign(opts, { speed: 0.6, curve: 1.4, essential: true }));
    if (location.hash !== '#' + s.id && !hashLock) history.replaceState(null, '', '#' + s.id);
  }
  const band = new Set();
  const io = new IntersectionObserver(ents => {
    ents.forEach(en => en.isIntersecting ? band.add(en.target) : band.delete(en.target));
    if (!band.size) return;
    const mid = innerHeight / 2; let best = null, bd = Infinity;
    band.forEach(el => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = el; } });
    setActive(Number(best.dataset.stop));
  }, { rootMargin: '-45% 0px -45% 0px' });
  stepEls.forEach(el => io.observe(el));
  new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) setActive(-1); }), { rootMargin: '-45% 0px -45% 0px' })
    .observe($('.step--intro', stepsEl));

  let hashLock = false;
  function goTo(i) {
    const el = stepEls[i];
    const y = el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2;
    hashLock = true; setTimeout(() => { hashLock = false; }, 900);
    scrollTo({ top: y, behavior: motionOff() ? 'auto' : 'smooth' });
    setTimeout(() => { const h = el.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }, motionOff() ? 0 : 700);
  }
  railBtns.forEach(b => b.addEventListener('click', () => goTo(Number(b.dataset.go))));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const i = stops.findIndex(s => '#' + s.id === a.getAttribute('href'));
    if (i >= 0) { e.preventDefault(); goTo(i); }
  });
  if (location.hash) { const i = stops.findIndex(s => '#' + s.id === location.hash); if (i >= 0) setTimeout(() => goTo(i), 400); }
})();
