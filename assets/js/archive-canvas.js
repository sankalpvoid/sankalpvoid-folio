/* Archive: a bounded field of real fragments on three depth layers behind a fixed title and fixed controls.
   - Only the field moves. The title, header and controls are siblings of the field, never inside its transform.
   - One rAF loop. The rendered pan chases the target pan with frame-rate independent damping (a slightly floating feel), release continues
     with decaying inertia, and the three layers move at 0.86 / 1 / 1.14 of the pan so the field has depth.
   - Rendered velocity drives a restrained perspective tilt and shear per layer (max ~5 degrees / 2 degrees). When motion stops the tilt
     eases to exactly zero and the transforms are removed, so the composition rests flat and sharp.
   - Reduced motion: direct 1:1 panning, no damping, no inertia, no tilt, no depth rates.
   - A drag never opens a project (6 px threshold; the click that follows a drag is swallowed). Keyboard: arrows pan, Home recentres, Tab brings
     a fragment to the middle. A list view replaces the field. */
(() => {
  const host = document.querySelector('[data-ar]');
  if (!host) return;
  const view = host.querySelector('[data-view]');
  const rots = [...host.querySelectorAll('[data-rot]')];
  const layers = rots.map((r) => r.querySelector('.ar__layer'));
  const RATE = { far: 0.86, mid: 1, near: 1.14 }, TILT = { far: 0.6, mid: 1, near: 1.5 };
  const kinds = rots.map((r) => r.dataset.rot);
  const cue = host.querySelector('[data-cue]');
  const listBtn = host.querySelector('[data-listbtn]');
  const resetBtn = host.querySelector('[data-reset]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const CW = 3600, CH = 2500, PAD = 120;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let s = 1, vw = 0, vh = 0;
  const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
  const tilt = { rx: 0, ry: 0, sk: 0 };
  let raf = 0, last = 0, dragging = false, coasting = false, prev = { x: 0, y: 0 };

  const scaleFor = () => clamp(innerWidth / 1300, 0.62, 1);
  const limits = () => ({ x: Math.max(0, (CW * s - vw) / 2 + PAD), y: Math.max(0, (CH * s - vh) / 2 + PAD) });
  const clampT = () => { const l = limits(); tgt.x = clamp(tgt.x, -l.x, l.x); tgt.y = clamp(tgt.y, -l.y, l.y); };

  const paint = () => {
    const x0 = vw / 2 - (CW / 2) * s, y0 = vh / 2 - (CH / 2) * s, flat = reduce.matches;
    layers.forEach((l, i) => {
      const k = flat ? 1 : RATE[kinds[i]];
      l.style.setProperty('--lx', (x0 + cur.x * k).toFixed(2) + 'px');
      l.style.setProperty('--ly', (y0 + cur.y * k).toFixed(2) + 'px');
      l.style.setProperty('--s', s.toFixed(4));
    });
    const live = !flat && (Math.abs(tilt.rx) > 0.015 || Math.abs(tilt.ry) > 0.015 || Math.abs(tilt.sk) > 0.015);
    rots.forEach((r, i) => {
      const m = TILT[kinds[i]];
      r.style.transform = live ? `perspective(1500px) rotateX(${(tilt.rx * m).toFixed(3)}deg) rotateY(${(tilt.ry * m).toFixed(3)}deg) skewX(${(tilt.sk * m).toFixed(3)}deg)` : '';
    });
  };

  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (reduce.matches) { cur.x = tgt.x; cur.y = tgt.y; vel.x = vel.y = 0; coasting = false; tilt.rx = tilt.ry = tilt.sk = 0; paint(); return; }
    if (coasting) {
      tgt.x += vel.x * dt; tgt.y += vel.y * dt;
      const f = Math.exp(-dt / 0.55); vel.x *= f; vel.y *= f;
      const l = limits();
      if (Math.abs(tgt.x) > l.x) { tgt.x = clamp(tgt.x, -l.x, l.x); vel.x = 0; }
      if (Math.abs(tgt.y) > l.y) { tgt.y = clamp(tgt.y, -l.y, l.y); vel.y = 0; }
      if (Math.hypot(vel.x, vel.y) < 10) { coasting = false; vel.x = vel.y = 0; }
    }
    const k = 1 - Math.exp(-dt / (dragging ? 0.065 : 0.13));
    cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k;
    const rvx = (cur.x - prev.x) / dt, rvy = (cur.y - prev.y) / dt; prev = { x: cur.x, y: cur.y };
    const kt = 1 - Math.exp(-dt / 0.16);
    tilt.ry += (clamp(rvx * 0.0022, -5, 5) - tilt.ry) * kt;
    tilt.rx += (clamp(-rvy * 0.0018, -4, 4) - tilt.rx) * kt;
    tilt.sk += (clamp(rvx * 0.0010, -2, 2) - tilt.sk) * kt;
    /* Stop once the remaining movement is subpixel and rendered speed is
       imperceptible. Do not wait for a tilt accumulator driven by that same
       residual velocity to independently converge (frame cadence varies). */
    const still = !dragging && !coasting && Math.hypot(tgt.x - cur.x, tgt.y - cur.y) < 0.15 && Math.hypot(rvx, rvy) < 2;
    if (still) { cur.x = tgt.x; cur.y = tgt.y; prev = { x: cur.x, y: cur.y }; vel.x = vel.y = 0; tilt.rx = tilt.ry = tilt.sk = 0; paint(); return; }
    paint();
    raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const setPan = (x, y) => { tgt.x = x; tgt.y = y; clampT(); coasting = false; go(); };
  const nudge = (dx, dy) => setPan(tgt.x + dx, tgt.y + dy);
  const centreOn = (cx, cy, k = 1) => setPan(((CW / 2) - cx) * s / k, ((CH / 2) - cy) * s / k);

  /* ---- pointer drag ---- */
  let down = null, swallow = false, samples = [];
  view.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !e.isPrimary) return;
    coasting = false; vel.x = vel.y = 0; tgt.x = cur.x; tgt.y = cur.y;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, px: tgt.x, py: tgt.y };
    samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    dragging = false;
  });
  view.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { release(e, false); return; }   /* the release happened outside the window */
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      dragging = true; view.classList.add('is-drag');
      document.documentElement.classList.add('is-gesturing');
      try { getSelection().removeAllRanges(); } catch {}
      try { view.setPointerCapture(down.id); } catch {}
      if (cue) cue.classList.add('is-gone');
    }
    const now = performance.now(); samples.push({ x: e.clientX, y: e.clientY, t: now });
    while (samples.length > 2 && now - samples[0].t > 90) samples.shift();
    tgt.x = down.px + dx; tgt.y = down.py + dy; clampT(); go();
    e.preventDefault();
  });
  const release = (e, cancelled) => {
    if (!down || (e && e.pointerId !== down.id)) return;
    const pointerId = down.id;
    const was = dragging; down = null; dragging = false;
    // A release outside the window may be inferred from buttons===0 instead of
    // pointerup. Explicitly relinquish capture before the next control press.
    try { if (view.hasPointerCapture(pointerId)) view.releasePointerCapture(pointerId); } catch {}
    view.classList.remove('is-drag');
    document.documentElement.classList.remove('is-gesturing');
    if (!was) return;
    swallow = true; setTimeout(() => { swallow = false; }, 60);
    if (cancelled || reduce.matches || samples.length < 2) { go(); return; }
    const a = samples[0], b = samples[samples.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
    vel.x = clamp((b.x - a.x) / dt, -3200, 3200); vel.y = clamp((b.y - a.y) / dt, -3200, 3200);
    coasting = Math.hypot(vel.x, vel.y) > 60; go();
  };
  addEventListener('blur', () => release(null, true));
  addEventListener('pointerdown', (e) => {
    if (down && !view.contains(e.target)) release(null, true);
  }, true);
  view.addEventListener('pointerup', (e) => release(e, false));
  view.addEventListener('pointercancel', (e) => release(e, true));
  view.addEventListener('lostpointercapture', (e) => release(e, true));
  view.addEventListener('click', (e) => { if (swallow) { e.preventDefault(); e.stopPropagation(); swallow = false; } }, true);
  view.addEventListener('dragstart', (e) => e.preventDefault());
  view.addEventListener('selectstart', (e) => e.preventDefault());

  /* ---- wheel and keyboard ---- */
  view.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    nudge(-(e.shiftKey ? e.deltaY : e.deltaX), e.shiftKey ? 0 : -e.deltaY);
    if (cue) cue.classList.add('is-gone');
  }, { passive: false });
  view.addEventListener('keydown', (e) => {
    if (e.target !== view) return;
    const k = { ArrowLeft: [200, 0], ArrowRight: [-200, 0], ArrowUp: [0, 200], ArrowDown: [0, -200] }[e.key];
    if (k) { e.preventDefault(); nudge(k[0], k[1]); if (cue) cue.classList.add('is-gone'); }
    else if (e.key === 'Home') { e.preventDefault(); setPan(0, 0); }
  });
  /* tabbing to a fragment brings it to the middle of the screen */
  host.querySelectorAll('.ar__t').forEach((a) => {
    a.addEventListener('focus', () => {
      const x = parseFloat(a.style.getPropertyValue('--x')), y = parseFloat(a.style.getPropertyValue('--y')), w = parseFloat(a.style.getPropertyValue('--w'));
      const h = a.querySelector('img').getBoundingClientRect().height / s;
      centreOn(x + w / 2, y + h / 2, reduce.matches ? 1 : RATE[a.dataset.d || 'mid']);
      if (cue) cue.classList.add('is-gone');
    });
  });

  /* ---- controls ---- */
  resetBtn.addEventListener('click', () => setPan(0, 0));
  const setList = (on) => {
    host.classList.toggle('is-list', on);
    listBtn.setAttribute('aria-pressed', String(on));
    listBtn.textContent = on ? 'Canvas view' : 'List view';
    view.toggleAttribute('inert', on);
    if (on) host.querySelector('.ar__list').scrollTop = 0;
  };
  listBtn.addEventListener('click', () => setList(!host.classList.contains('is-list')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && host.classList.contains('is-list') && !document.querySelector('dialog[open]')) { setList(false); listBtn.focus(); } });

  const measure = () => { vw = view.clientWidth; vh = view.clientHeight; s = scaleFor(); clampT(); cur.x = clamp(cur.x, -limits().x, limits().x); cur.y = clamp(cur.y, -limits().y, limits().y); paint(); };
  addEventListener('resize', measure);
  addEventListener('pagehide', () => { cancelAnimationFrame(raf); raf = 0; });
  measure();
  window.__arState = () => ({ tx: cur.x, ty: cur.y, px: cur.x, py: cur.y, s, dragging, rx: tilt.rx, ry: tilt.ry, sk: tilt.sk, list: host.classList.contains('is-list'), titleRect: (() => { const r = document.querySelector('.ar__title').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })() });
})();
