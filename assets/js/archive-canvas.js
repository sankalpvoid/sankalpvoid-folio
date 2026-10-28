/* Archive canvas: pointer drag with inertia inside finite bounds; wheel and arrow keys pan; focus pans the focused fragment into view.
   A drag never opens a project (6 px threshold, and the click that follows a drag is swallowed). */
(() => {
  const host = document.querySelector('[data-ar]');
  if (!host) return;
  const view = host.querySelector('[data-view]');
  const canvas = host.querySelector('[data-canvas]');
  const cue = host.querySelector('[data-cue]');
  const listBtn = host.querySelector('[data-listbtn]');
  const resetBtn = host.querySelector('[data-reset]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const CW = 3600, CH = 2500, PAD = 90;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let s = 1, tx = 0, ty = 0, vx = 0, vy = 0, raf = 0, glide = null;

  const scaleFor = () => clamp(innerWidth / 1300, 0.62, 1);
  const bounds = () => {
    const w = CW * s, h = CH * s, vw = view.clientWidth, vh = view.clientHeight;
    return { x0: Math.min(PAD, vw - w - PAD), x1: PAD, y0: Math.min(PAD, vh - h - PAD), y1: PAD };
  };
  const apply = () => { canvas.style.setProperty('--tx', tx.toFixed(1) + 'px'); canvas.style.setProperty('--ty', ty.toFixed(1) + 'px'); canvas.style.setProperty('--s', s.toFixed(4)); };
  const clampPos = () => { const b = bounds(); const ox = tx, oy = ty; tx = clamp(tx, b.x0, b.x1); ty = clamp(ty, b.y0, b.y1); if (tx !== ox) vx = 0; if (ty !== oy) vy = 0; };
  const centre = (cx = CW / 2, cy = CH / 2) => { tx = view.clientWidth / 2 - cx * s; ty = view.clientHeight / 2 - cy * s; clampPos(); apply(); };
  const stopMotion = () => { cancelAnimationFrame(raf); raf = 0; glide = null; vx = vy = 0; };

  /* smooth glide to a target position (keyboard, focus, recentre); instant under reduced motion */
  const glideTo = (nx, ny, ms = 520) => {
    stopMotion();
    const b = bounds(); nx = clamp(nx, b.x0, b.x1); ny = clamp(ny, b.y0, b.y1);
    if (reduce.matches) { tx = nx; ty = ny; apply(); return; }
    const ax = tx, ay = ty, t0 = performance.now();
    glide = true;
    const step = (now) => {
      if (!glide) return;
      const k = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
      tx = ax + (nx - ax) * e; ty = ay + (ny - ay) * e; apply();
      if (k < 1) raf = requestAnimationFrame(step); else glide = null;
    };
    raf = requestAnimationFrame(step);
  };

  /* ---- pointer drag ---- */
  let down = null, dragging = false, swallow = false, last = null;
  view.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !e.isPrimary) return;
    stopMotion();
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, tx, ty };
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
    dragging = false;
  });
  view.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 6) return;                   /* below the threshold it is still a click */
      dragging = true; view.classList.add('is-drag');
      try { view.setPointerCapture(down.id); } catch {}
      if (cue) cue.classList.add('is-gone');
    }
    const now = performance.now(), dt = Math.max(1, now - last.t);
    vx = 0.8 * vx + 0.2 * ((e.clientX - last.x) / dt * 16); vy = 0.8 * vy + 0.2 * ((e.clientY - last.y) / dt * 16);
    last = { x: e.clientX, y: e.clientY, t: now };
    tx = down.tx + dx; ty = down.ty + dy; clampPos(); apply();
  });
  const release = (e) => {
    if (!down || (e && e.pointerId !== down.id)) return;
    const was = dragging; down = null; dragging = false; view.classList.remove('is-drag');
    if (!was) return;
    swallow = true; setTimeout(() => { swallow = false; }, 60);
    if (reduce.matches) { vx = vy = 0; return; }
    const coast = () => {
      vx *= 0.94; vy *= 0.94;
      if (Math.abs(vx) < 0.15 && Math.abs(vy) < 0.15) { raf = 0; return; }
      tx += vx; ty += vy; clampPos(); apply(); raf = requestAnimationFrame(coast);
    };
    raf = requestAnimationFrame(coast);
  };
  view.addEventListener('pointerup', release);
  view.addEventListener('pointercancel', release);
  view.addEventListener('click', (e) => { if (swallow) { e.preventDefault(); e.stopPropagation(); swallow = false; } }, true);
  view.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---- wheel and keyboard ---- */
  view.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault(); stopMotion();
    tx -= e.deltaX * (e.shiftKey ? 0 : 1) + (e.shiftKey ? e.deltaY : 0); ty -= e.shiftKey ? 0 : e.deltaY; clampPos(); apply();
    if (cue) cue.classList.add('is-gone');
  }, { passive: false });
  view.addEventListener('keydown', (e) => {
    if (e.target !== view) return;
    const k = { ArrowLeft: [160, 0], ArrowRight: [-160, 0], ArrowUp: [0, 160], ArrowDown: [0, -160] }[e.key];
    if (k) { e.preventDefault(); glideTo(tx + k[0], ty + k[1], 260); if (cue) cue.classList.add('is-gone'); }
    else if (e.key === 'Home') { e.preventDefault(); glideTo(view.clientWidth / 2 - (CW / 2) * s, view.clientHeight / 2 - (CH / 2) * s); }
  });
  /* tabbing to a fragment brings it into the middle of the screen */
  host.querySelectorAll('.ar__t').forEach((a) => {
    a.addEventListener('focus', () => {
      const x = parseFloat(a.style.getPropertyValue('--x')), y = parseFloat(a.style.getPropertyValue('--y')), w = parseFloat(a.style.getPropertyValue('--w'));
      const h = a.querySelector('img').getBoundingClientRect().height / s;
      glideTo(view.clientWidth / 2 - (x + w / 2) * s, view.clientHeight / 2 - (y + h / 2) * s, 420);
      if (cue) cue.classList.add('is-gone');
    });
  });

  /* ---- controls ---- */
  resetBtn.addEventListener('click', () => glideTo(view.clientWidth / 2 - (CW / 2) * s, view.clientHeight / 2 - (CH / 2) * s));
  const setList = (on) => {
    host.classList.toggle('is-list', on);
    listBtn.setAttribute('aria-pressed', String(on));
    listBtn.textContent = on ? 'Canvas view' : 'List view';
    view.toggleAttribute('inert', on);
    if (on) host.querySelector('.ar__list').scrollTop = 0;
  };
  listBtn.addEventListener('click', () => setList(!host.classList.contains('is-list')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && host.classList.contains('is-list') && !document.querySelector('dialog[open]')) { setList(false); listBtn.focus(); } });

  const onResize = () => { const old = s; s = scaleFor(); if (old !== s) { stopMotion(); } clampPos(); apply(); };
  addEventListener('resize', onResize);
  addEventListener('pagehide', () => { stopMotion(); removeEventListener('resize', onResize); });
  s = scaleFor(); centre();
  window.__arState = () => ({ tx, ty, s, dragging, list: host.classList.contains('is-list') });
})();
