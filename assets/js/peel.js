/* Diagonal page peel: "pull the next project into view".
   A handle in the lower-right corner is pressed and dragged up and to the left. A fold line (x/W + y/H = t) is kept under the pointer:
   everything on the corner side of it shows the NEXT project's opening; the peeled-back flap is the reflection of that region across
   the fold, drawn with shading. Progress follows the pointer continuously. Released early, a spring returns the page; past the
   threshold (or with a decisive flick) it completes and navigates. Click, tap and keyboard on the same handle run the same peel
   automatically; with reduced motion they navigate immediately.
   The handle chooses the destination, never the current project: callers pass target() = { name, art, href } for the NEXT project
   (from SVProjects) and a commit() that moves there. A cancelled gesture changes no state and adds no history entry. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let layer, under, lab, labName, shade, flapW, flap, built = false;
  let p = 0, raf = 0, state = 'idle', page = null, t0 = 1.85, W = 1, H = 1;
  const cache = new Map();
  const resets = new Set();

  const preload = (src) => {
    if (!src) return Promise.resolve();
    if (!cache.has(src)) cache.set(src, new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = i.onerror = () => res(); i.src = src; }));
    return cache.get(src);
  };
  const build = () => {
    if (built) return; built = true;
    layer = document.createElement('div');
    layer.className = 'peel'; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="peel__under"><p class="peel__lab"><span class="mono">Next project</span><b></b></p></div><div class="peel__shade"></div><div class="peel__flapw"><div class="peel__flap"></div></div>';
    document.body.appendChild(layer);
    under = layer.querySelector('.peel__under'); lab = layer.querySelector('.peel__lab'); labName = lab.querySelector('b');
    shade = layer.querySelector('.peel__shade'); flapW = layer.querySelector('.peel__flapw'); flap = layer.querySelector('.peel__flap');
    flapW.style.cssText = 'position:absolute;inset:0;filter:drop-shadow(-8px -8px 20px rgba(0,0,0,.5))';
  };

  const pts = (a) => 'polygon(' + a.map((q) => q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px').join(',') + ')';
  const paint = (v) => {
    p = clamp(v);
    const t = t0 - (t0 + 0.02) * p;                        /* fold: x/W + y/H = t */
    let R;
    if (t >= 1) R = [[W * (t - 1), H], [W, H], [W, H * (t - 1)]];
    else if (t > 0) R = [[W * t, 0], [W, 0], [W, H], [0, H], [0, H * t]];
    else R = [[0, 0], [W, 0], [W, H], [0, H]];
    under.style.clipPath = pts(R);
    const nx = 1 / W, ny = 1 / H, nn = nx * nx + ny * ny, nl = Math.sqrt(nn);
    const refl = R.map(([x, y]) => { const k = 2 * (nx * x + ny * y - t) / nn; return [x - k * nx, y - k * ny]; });
    flap.style.clipPath = t > 0 ? pts(refl) : 'polygon(0 0,0 0,0 0)';
    const ang = (Math.atan2(nx / nl, -ny / nl) * 180 / Math.PI).toFixed(2);
    const P = t / nl, depth = (2 - t) / nl;
    flap.style.background = `linear-gradient(${ang}deg,#0e0e11 ${(P - depth).toFixed(0)}px,#2a2a30 ${(P - 8).toFixed(0)}px,#a8a79f ${P.toFixed(0)}px)`;
    shade.style.background = `linear-gradient(${ang}deg,transparent ${(P - 0.5).toFixed(0)}px,rgba(0,0,0,.5) ${P.toFixed(0)}px,transparent ${(P + 90).toFixed(0)}px),linear-gradient(${ang}deg,rgba(0,0,0,${(0.42 * p).toFixed(3)}) ${P.toFixed(0)}px,transparent ${P.toFixed(0)}px)`;
    under.style.backgroundPosition = `${50 + (1 - p) * 4}% 50%`;
    under.style.transform = `scale(${(1.05 - 0.05 * p).toFixed(4)})`;
    lab.style.opacity = clamp((p - 0.12) / 0.3).toFixed(3);
    if (page) page.style.transform = `translate3d(${(-p * 14).toFixed(1)}px,${(-p * 10).toFixed(1)}px,0) scale(${(1 - 0.035 * p).toFixed(4)})`;
  };
  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };
  /* spring toward a goal; resolves when settled */
  const spring = (goal, { k = 190, c = 21, v0 = 0 } = {}) => new Promise((res) => {
    stopLoop();
    if (reduce()) { paint(goal); res(); return; }
    let v = v0, last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      v += (-k * (p - goal) - c * v) * dt; paint(p + v * dt);
      if (Math.abs(p - goal) < 0.002 && Math.abs(v) < 0.03) { paint(goal); raf = 0; res(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
  const ease = (to, ms) => new Promise((res) => {
    stopLoop();
    if (reduce() || !ms) { paint(to); res(); return; }
    const a = p, s = performance.now();
    const step = (now) => { const k = clamp((now - s) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; paint(a + (to - a) * e); if (k < 1) raf = requestAnimationFrame(step); else { raf = 0; res(); } };
    raf = requestAnimationFrame(step);
  });

  const open = (target, pageEl, handle) => {
    build();
    W = innerWidth; H = innerHeight;
    const r = handle.getBoundingClientRect();
    t0 = clamp((r.left + r.width / 2) / W + (r.top + r.height / 2) / H, 1.2, 1.98);
    under.style.backgroundImage = target.art ? `url(${target.art})` : 'none';
    labName.textContent = target.name || '';
    page = pageEl || null;
    if (page) { page.style.transformOrigin = `100% ${scrollY + H}px`; page.style.willChange = 'transform'; }
    layer.classList.add('is-on');
    paint(0.0001);
  };
  const close = () => {
    if (!built) return;
    layer.classList.remove('is-on'); paint(0); stopLoop();
    if (page) { page.style.transform = ''; page.style.transformOrigin = ''; page.style.willChange = ''; page = null; }
    document.documentElement.classList.remove('is-gesturing');
  };

  const attach = (handle, opts) => {
    if (handle.__peel) return; handle.__peel = true;
    handle.setAttribute('draggable', 'false');
    let id = null, drag = false, moved = false, busy = false, last = { t: 0, v: 0, p: 0 }, vel = 0, shown = false, tgt = null;
    const target = () => (tgt = opts.target());
    const ensureOpen = () => { if (!shown) { shown = true; open(target(), opts.page && opts.page(), handle); } };
    const warm = () => { const t = target(); if (t) preload(t.art); };
    resets.add(() => { busy = false; shown = false; id = null; drag = false; });
    handle.addEventListener('pointerenter', warm); handle.addEventListener('focus', warm);

    const complete = async () => {
      busy = true;
      const t = tgt || target();
      await Promise.race([preload(t.art), new Promise((r) => setTimeout(r, 1500))]);
      await ease(1, 380);
      try { await opts.commit(t); } finally { if (!opts.keep) setTimeout(() => { busy = false; close(); shown = false; }, 60); else setTimeout(() => { busy = false; }, 2500); }
    };
    const cancel = async (v0 = 0) => {
      busy = true;
      await spring(0, { v0: -Math.abs(v0) * 0.4 });
      close(); shown = false; busy = false;
    };
    const finishDrag = (cancelled) => {
      if (id === null) return;
      const was = drag; id = null; drag = false;
      document.documentElement.classList.remove('is-gesturing');
      if (!was) { return; }
      if (cancelled) { cancel(); return; }
      if (p >= 0.38 || vel > 1.6) complete(); else cancel(vel);
    };

    if (opts.drag !== false) handle.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || !e.isPrimary) return;
      if (busy && state !== 'cancelling') { if (p > 0.5) return; }
      e.preventDefault();
      try { getSelection().removeAllRanges(); } catch {}
      stopLoop(); busy = false;
      id = e.pointerId; drag = false; moved = false; vel = 0;
      const r = handle.getBoundingClientRect();
      last = { t: performance.now(), v: 0, p: p };
      handle.__start = { x: e.clientX, y: e.clientY, p0: shown ? p : 0 };
      try { handle.setPointerCapture(id); } catch {}
      warm();
    });
    if (opts.drag !== false) handle.addEventListener('pointermove', (e) => {
      if (id === null || e.pointerId !== id) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { finishDrag(false); return; }
      const s = handle.__start;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (!drag) {
        if (Math.hypot(dx, dy) < 8) return;
        if (!(dx < 0 || dy < 0) || dx + dy > 0) { return; }      /* only up-and-left starts the peel */
        drag = true; moved = true;
        document.documentElement.classList.add('is-gesturing');
        try { getSelection().removeAllRanges(); } catch {}
        ensureOpen();
        handle.__start = { x: e.clientX, y: e.clientY, p0: p };
      }
      const s2 = handle.__start;
      const t = (e.clientX - handle.__start.x) / W + (e.clientY - handle.__start.y) / H;   /* progress along the diagonal */
      const np = clamp(s2.p0 - t / (t0 + 0.02));
      const now = performance.now();
      const dt = Math.max(1, now - last.t); vel = 0.7 * vel + 0.3 * ((np - last.p) / dt * 1000); last = { t: now, v: vel, p: np };
      paint(np);
      e.preventDefault();
    });
    if (opts.drag !== false) { handle.addEventListener('pointerup', () => finishDrag(false)); handle.addEventListener('pointercancel', () => finishDrag(true)); handle.addEventListener('lostpointercapture', () => { if (id !== null) finishDrag(true); }); }
    addEventListener('blur', () => { if (id !== null) finishDrag(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && id !== null) finishDrag(true); });

    /* click, tap and Enter run the same peel by themselves. A drag never counts as a click. */
    handle.addEventListener('click', async (e) => {
      if (moved) { e.preventDefault(); moved = false; return; }
      e.preventDefault();
      if (busy) return;
      if (reduce()) { const t = target(); busy = true; await opts.commit(t); setTimeout(() => { busy = false; }, 300); return; }
      ensureOpen(); paint(0.0001);
      busy = true;
      const t = tgt;
      await Promise.race([preload(t.art), new Promise((r) => setTimeout(r, 1500))]);
      await ease(1, 820);
      try { await opts.commit(t); } finally { if (!opts.keep) setTimeout(() => { busy = false; close(); shown = false; }, 60); else setTimeout(() => { busy = false; }, 2500); }
    });
    handle.addEventListener('keydown', (e) => { if (e.key === ' ' && handle.tagName === 'A') { e.preventDefault(); handle.click(); } });
    handle.addEventListener('dragstart', (e) => e.preventDefault());
    handle.addEventListener('selectstart', (e) => e.preventDefault());
  };
  addEventListener('pageshow', () => { if (built) close(); resets.forEach((f) => f()); });
  window.SVPeel = { attach, preload };
})();
