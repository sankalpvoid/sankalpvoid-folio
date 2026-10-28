/* Direct-manipulation page transition ("unroll").
   Press and drag a handle leftwards: the destination's image is revealed from the right edge behind a travelling fold, following the
   pointer continuously. Release past the threshold and it completes (then navigates); release before it and it returns.
   Click, tap and keyboard Enter on the same link do the same thing as a short automatic unroll. Vertical scrolling is never captured
   (the handle uses touch-action: pan-y and a drag only begins on a clearly horizontal move). */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let layer = null, sheet = null, busy = false, u = 0, raf = 0;

  const build = () => {
    if (layer) return;
    layer = document.createElement('div');
    layer.className = 'unroll';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="unroll__sheet"><div class="unroll__img"></div><p class="unroll__label"><span class="mono">Opening</span><b></b></p></div><div class="unroll__fold"></div>';
    document.body.appendChild(layer);
    sheet = layer;
  };
  const paint = (v) => { u = clamp(v); layer.style.setProperty('--u', u.toFixed(4)); };
  const animate = (to, ms) => new Promise((res) => {
    cancelAnimationFrame(raf);
    if (reduce() || !ms) { paint(to); res(); return; }
    const a = u, t0 = performance.now();
    const tick = (now) => { const k = clamp((now - t0) / ms); paint(a + (to - a) * ease(k)); if (k < 1) raf = requestAnimationFrame(tick); else res(); };
    raf = requestAnimationFrame(tick);
  });
  const show = (bg, name) => {
    build();
    layer.querySelector('.unroll__img').style.backgroundImage = bg ? `url(${bg})` : 'none';
    layer.querySelector('.unroll__label b').textContent = name || '';
    layer.classList.add('is-on');
  };
  const hide = () => { if (layer) { layer.classList.remove('is-on'); paint(0); } };

  const attach = (handle, opts = {}) => {
    if (handle.dataset.unroll) return;
    handle.dataset.unroll = '1';
    const info = () => ({ bg: typeof opts.bg === 'function' ? opts.bg() : opts.bg, name: typeof opts.name === 'function' ? opts.name() : opts.name });
    let sx = 0, sy = 0, id = null, dragging = false, moved = false, last = { x: 0, t: 0 }, vel = 0;
    const dist = () => Math.min(innerWidth * 0.72, 980);

    const finish = async () => {
      busy = true;
      await animate(1, 380);
      const go = () => { location.href = handle.href; };
      go();
      setTimeout(() => { busy = false; }, 2500);        /* if navigation is interrupted the handle is usable again */
    };
    const cancel = async () => { busy = true; await animate(0, 320); hide(); busy = false; };

    handle.addEventListener('pointerdown', (e) => {
      if (busy || e.button > 0 || !e.isPrimary) return;
      sx = e.clientX; sy = e.clientY; id = e.pointerId; dragging = false; moved = false; vel = 0; last = { x: e.clientX, t: performance.now() };
    });
    handle.addEventListener('pointermove', (e) => {
      if (id === null || e.pointerId !== id || busy) return;
      const dx = sx - e.clientX, dy = e.clientY - sy;
      if (!dragging) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (dx > 8 && Math.abs(dx) > Math.abs(dy) * 1.3) {      /* clearly horizontal, leftwards: this is the gesture */
          dragging = true; moved = true;
          try { handle.setPointerCapture(id); } catch {}
          const i = info(); show(i.bg, i.name); paint(0);
        } else if (Math.abs(dy) > 8) { id = null; return; }       /* vertical: leave it to scrolling */
        else return;
      }
      const now = performance.now();
      vel = (last.x - e.clientX) / Math.max(1, now - last.t); last = { x: e.clientX, t: now };
      paint(dx / dist());
      e.preventDefault();
    });
    const end = (e) => {
      if (id === null || (e && e.pointerId !== id)) return;
      const was = dragging; id = null; dragging = false;
      if (!was) return;
      if (e && e.type === 'pointercancel') cancel();
      else if (u >= 0.45 || vel > 0.9) finish(); else cancel();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('lostpointercapture', () => { if (dragging) end(); });
    /* a drag must never also count as a click */
    handle.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); moved = false; return; }
      if (busy) { e.preventDefault(); return; }
      if (reduce()) return;                                        /* ordinary navigation */
      e.preventDefault();
      const i = info(); show(i.bg, i.name); paint(0); finish();
    });
    handle.addEventListener('dragstart', (e) => e.preventDefault());
  };
  addEventListener('pageshow', () => { busy = false; if (layer) hide(); });
  window.SVUnroll = { attach };
})();
