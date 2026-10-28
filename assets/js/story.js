/* Horizontal story engine.
   Document scroll is the only input. A tall wrapper (.hs) holds a sticky pin; scrolling vertically moves the track sideways:
     horizontal distance = track width − viewport width, and the wrapper is exactly that tall (+1 viewport), so scroll maps 1:1.
   Wheel events are never intercepted. Reverse scrolling works naturally. Chapter buttons and the slider scroll the document.
   Panels marked data-span="N" are N viewports wide and may contain a .hold element that stays put on screen while the panel
   travels past (used for scrubbed stages); progress callbacks receive 0..1 across that panel.
   On narrow screens, with reduced motion, or without JavaScript, the CSS shows the same panels as an ordinary vertical page. */
(() => {
  const hs = document.querySelector('[data-hs]');
  if (!hs) return;
  const pin = hs.querySelector('.hs__pin');
  const track = hs.querySelector('[data-track]');
  const panels = [...track.querySelectorAll('.hs__p')];
  const flat = matchMedia('(max-width: 860px), (prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const subs = [];                                       /* [panel, fn(localProgress, x)] */
  let travel = 0, vw = innerWidth, vh = innerHeight, raf = 0, active = false, curIdx = -1, ro = null;
  let nav = null, bar = null, count = null;

  const top = () => hs.getBoundingClientRect().top + scrollY;
  const xToY = (x) => top() + clamp(x, 0, travel);
  const scrollToX = (x, smooth = true) => scrollTo({ top: xToY(x), behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  const panelStart = (p) => Math.max(0, p.offsetLeft - Math.min(80, vw * 0.04));

  const buildNav = () => {
    nav = document.createElement('nav');
    nav.className = 'hs__nav';
    nav.setAttribute('aria-label', 'Chapters');
    nav.innerHTML = '<ol>' + panels.map((p, i) => `<li><button type="button" data-go="${i}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><span class="hs__t">${p.dataset.title || 'Chapter ' + (i + 1)}</span></button></li>`).join('') + '</ol><span class="hs__bar" aria-hidden="true"><i></i></span><span class="hs__count mono" aria-hidden="true"></span>';
    pin.appendChild(nav);
    bar = nav.querySelector('.hs__bar i');
    count = nav.querySelector('.hs__count');
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-go]');
      if (b) scrollToX(panelStart(panels[+b.dataset.go]));
    });
  };

  const measure = () => {
    if (!active) return;
    vw = innerWidth; vh = innerHeight;
    track.style.transform = 'none';
    travel = Math.max(0, track.scrollWidth - vw);
    hs.style.height = (travel + vh) + 'px';
    hs.style.setProperty('--hs-travel', travel + 'px');
    panels.forEach((p) => { p.__start = p.offsetLeft; p.__w = p.offsetWidth; });
    update();
  };

  const update = () => {
    raf = 0;
    if (!active) return;
    const x = clamp(-hs.getBoundingClientRect().top, 0, travel);
    track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
    const p = travel ? x / travel : 0;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    let idx = 0;
    panels.forEach((pn, i) => { if (pn.__start <= x + vw * 0.42) idx = i; });
    if (idx !== curIdx) {
      curIdx = idx;
      nav.querySelectorAll('[data-go]').forEach((b, i) => (i === idx ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    }
    panels.forEach((pn) => {
      const holdEl = pn.querySelector('.hold');
      if (!holdEl) return;
      const span = Math.max(1, pn.__w - vw);
      const local = clamp((x - pn.__start) / span);
      holdEl.style.transform = `translate3d(${(local * span).toFixed(1)}px,0,0)`;
      subs.forEach(([el, fn]) => { if (el === pn) fn(local, x); });
    });
  };
  const tick = () => { if (!raf && active) raf = requestAnimationFrame(update); };

  /* focus inside an off-screen chapter brings that chapter into view */
  const onFocusIn = (e) => {
    const pn = e.target.closest && e.target.closest('.hs__p');
    if (!pn || !active) return;
    const r = e.target.getBoundingClientRect();
    if (r.left < 0 || r.right > innerWidth) scrollToX(panelStart(pn), false);
  };

  const hash = () => {
    const id = location.hash.slice(1); if (!id) return;
    const pn = panels.find((p) => p.id === id);
    if (pn) { if (active) scrollToX(panelStart(pn), false); else pn.scrollIntoView(); }
  };

  const attach = () => {
    if (active) return;
    active = true;
    hs.classList.add('is-hs');
    if (!nav) buildNav();
    nav.hidden = false;
    measure();
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', measure);
    hs.addEventListener('focusin', onFocusIn);
    track.addEventListener('load', measure, true);        /* images changing the track width */
    if ('ResizeObserver' in window) { ro = new ResizeObserver(() => measure()); ro.observe(track); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    hash();
  };
  const detach = () => {
    if (!active) return;
    active = false;
    cancelAnimationFrame(raf); raf = 0;
    removeEventListener('scroll', tick); removeEventListener('resize', measure);
    hs.removeEventListener('focusin', onFocusIn); track.removeEventListener('load', measure, true);
    if (ro) { ro.disconnect(); ro = null; }
    hs.classList.remove('is-hs');
    hs.style.height = ''; track.style.transform = '';
    panels.forEach((p) => { const h = p.querySelector('.hold'); if (h) h.style.transform = ''; });
    if (nav) nav.hidden = true;
    curIdx = -1;
  };
  const sync = () => (flat.matches ? detach() : attach());
  flat.addEventListener('change', sync);
  addEventListener('hashchange', hash);
  addEventListener('pagehide', detach);
  sync();

  window.HS = {
    get active() { return active; },
    get travel() { return travel; },
    panels,
    scrollToX,
    /* register a progress callback for a data-span panel; returns the current local progress */
    on(panel, fn) { subs.push([panel, fn]); if (active) update(); },
    /* y position in the document for a local progress inside a panel (used by sliders) */
    yFor(panel, p) { return xToY(panel.__start + clamp(p) * Math.max(1, panel.__w - vw)); },
    scrollToPanelProgress(panel, p, smooth = false) { scrollTo({ top: this.yFor(panel, p), behavior: smooth ? 'smooth' : 'auto' }); }
  };
})();
