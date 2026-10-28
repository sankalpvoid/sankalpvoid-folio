/* Horizontal story engine: one scroll system, one animation loop.
   Document scroll is the only input (wheel, trackpad, touch, keys, scrollbar are never intercepted). A tall wrapper (.hs) holds a sticky pin.
   Vertical scroll -> TARGET horizontal position:  target = (scroll offset into .hs) / K,  K = vertical pixels per horizontal pixel.
   The RENDERED position chases the target with frame-rate independent damping and a speed cap, so a wheel burst or trackpad flick
   glides in instead of skipping scenes, and reversing direction responds immediately. Scene indicators, hold callbacks, the rail's
   progress and the focus state all follow the rendered position, i.e. what is actually on screen.
   Horizontal distance = track width - pin width (the pin excludes the right-hand rail).
   Panels marked data-span="N" are N pin-widths wide and may contain a .hold element that stays on screen while the panel travels past.
   On narrow screens, with reduced motion, or without JavaScript the CSS shows the same panels as an ordinary vertical page. */
(() => {
  const hs = document.querySelector('[data-hs]');
  if (!hs) return;
  const pin = hs.querySelector('.hs__pin');
  const track = hs.querySelector('[data-track]');
  const panels = [...track.querySelectorAll('.hs__p')];
  const flat = matchMedia('(max-width: 860px), (prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const K = 1.7;                                         /* vertical px per horizontal px: each scene gets room to be read */
  const TAU = 0.17;                                      /* damping time constant (s) */
  const subs = [];                                       /* [panel, fn(localProgress, x)] */
  let travel = 0, vw = innerWidth, vh = innerHeight, raf = 0, active = false, curIdx = -1, ro = null;
  let x = 0, target = 0, last = 0, boost = 0;
  let nav = null, bar = null, count = null, railCount = null;

  const top = () => hs.getBoundingClientRect().top + scrollY;
  const yOf = (px) => top() + clamp(px, 0, travel) * K;
  const readTarget = () => clamp(-hs.getBoundingClientRect().top / K, 0, travel);
  const jump = (px, smoothly = true) => {                 /* move the document; the rendered position glides there */
    boost = smoothly ? performance.now() + 1400 : 0;
    scrollTo({ top: yOf(px), behavior: 'auto' });
    if (!smoothly) { target = x = clamp(px, 0, travel); render(); }
    else start();
  };
  const panelStart = (p) => Math.max(0, p.offsetLeft - Math.min(80, vw * 0.04));

  const buildNav = () => {
    nav = document.createElement('nav');
    nav.className = 'hs__nav';
    nav.setAttribute('aria-label', 'Scenes in this project');
    nav.innerHTML = '<ol>' + panels.map((p, i) => `<li><button type="button" data-go="${i}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><span class="hs__t">${p.dataset.title || 'Scene ' + (i + 1)}</span></button></li>`).join('') + '</ol><span class="hs__bar" aria-hidden="true"><i></i></span><span class="hs__count mono" aria-hidden="true"></span>';
    pin.appendChild(nav);
    bar = nav.querySelector('.hs__bar i');
    count = nav.querySelector('.hs__count');
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) jump(panelStart(panels[+b.dataset.go])); });
  };

  const measure = () => {
    if (!active) return;
    const frac = travel ? x / travel : 0;
    vw = pin.clientWidth; vh = innerHeight;
    hs.style.setProperty('--hsw', vw + 'px');
    track.style.transform = 'none';
    travel = Math.max(0, track.scrollWidth - vw);
    hs.style.height = (travel * K + vh) + 'px';
    hs.style.setProperty('--hs-travel', travel + 'px');
    panels.forEach((p) => { p.__start = p.offsetLeft; p.__w = p.offsetWidth; });
    /* keep the same place in the story through resizes and font/image loads */
    if (frac && !measure.first) scrollTo({ top: yOf(frac * travel), behavior: 'auto' });
    measure.first = false;
    target = readTarget(); x = clamp(x, 0, travel);
    render();
  };
  measure.first = true;

  const render = () => {
    if (!active) return;
    track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
    const p = travel ? x / travel : 0;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    document.documentElement.style.setProperty('--hsp', p.toFixed(4));
    let idx = 0;
    panels.forEach((pn, i) => { if (pn.__start <= x + vw * 0.42) idx = i; });
    if (idx !== curIdx) {
      curIdx = idx;
      nav.querySelectorAll('[data-go]').forEach((b, i) => (i === idx ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      const txt = `${String(idx + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
      count.textContent = txt;
      if (railCount) railCount.textContent = String(idx + 1).padStart(2, '0');
      hs.dataset.scene = String(idx + 1);
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

  const frame = (now) => {
    raf = 0;
    if (!active) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const d = target - x;
    if (Math.abs(d) < 0.25) { x = target; render(); return; }
    const k = 1 - Math.exp(-dt / TAU);                    /* frame-rate independent */
    const cap = (now < boost ? 5.5 : 1.45) * vw * dt;     /* one burst cannot cross several scenes; chapter jumps are allowed to travel */
    x += clamp(d * k, -cap, cap);
    render();
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && active) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const onScroll = () => { target = readTarget(); start(); };

  /* focus inside an off-screen scene brings that scene into view */
  const onFocusIn = (e) => {
    const pn = e.target.closest && e.target.closest('.hs__p');
    if (!pn || !active) return;
    const r = e.target.getBoundingClientRect(), pr = pin.getBoundingClientRect();
    if (r.left < pr.left || r.right > pr.right) jump(panelStart(pn));
  };
  const hash = () => {
    const id = location.hash.slice(1); if (!id) return;
    const pn = panels.find((p) => p.id === id);
    if (pn) { if (active) jump(panelStart(pn), false); else pn.scrollIntoView(); }
  };

  const attach = () => {
    if (active) return;
    active = true;
    hs.classList.add('is-hs');
    if (!nav) buildNav();
    railCount = document.querySelector('[data-rail-count]');
    nav.hidden = false;
    measure.first = true;
    measure();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', measure);
    hs.addEventListener('focusin', onFocusIn);
    track.addEventListener('load', measure, true);
    if ('ResizeObserver' in window) { ro = new ResizeObserver(() => measure()); ro.observe(track); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    hash();
  };
  const detach = () => {
    if (!active) return;
    active = false;
    cancelAnimationFrame(raf); raf = 0;
    removeEventListener('scroll', onScroll); removeEventListener('resize', measure);
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
    get x() { return x; },
    get target() { return target; },
    K,
    panels,
    scrollToX: jump,
    on(panel, fn) { subs.push([panel, fn]); if (active) render(); },
    yFor(panel, p) { return yOf(panel.__start + clamp(p) * Math.max(1, panel.__w - vw)); },
    scrollToPanelProgress(panel, p, smooth = false) { boost = smooth ? performance.now() + 1400 : 0; scrollTo({ top: this.yFor(panel, p), behavior: 'auto' }); }
  };
})();
