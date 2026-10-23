/* Scene builders shared by the gallery and the project pages.
   - SV.chart: an illustrative chart that moves between noise (0) and structure (1). Generated data only.
   - SV.bed:   the Furnishers bed drawn from traced geometry (bed-trace.json, one 1500x1200 space shared with the render).
   Both take a progress value p in [0,1] and are pure functions of it, so they reverse exactly. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs || {}) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- chart */
  function chart(root, opts = {}) {
    const svg = root.querySelector('svg');
    let draw = () => {};
    let p = opts.start ?? 1;
    let size = '';
    const build = () => {
      const w = Math.round(root.clientWidth), h = Math.round(root.clientHeight);
      if (!w || !h) return;
      size = w + 'x' + h;
      svg.replaceChildren();
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const n = clamp(Math.round(w / (w < 700 ? 20 : 24)), 22, 66);
      const r = rng(11);
      const padX = w * 0.02, x = (i) => padX + (i / (n - 1)) * (w - padX * 2);
      /* the trend starts low on the left, where the title sits, and climbs across the frame */
      const trend = (t) => h * (opts.base ?? 0.76) - h * (opts.rise ?? 0.5) * Math.pow(t, 1.3);
      const vol = h * 0.05;
      const bars = [];
      let prev = trend(0);
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const c = trend(t) + (r() - 0.5) * vol * 2.2;
        const o = prev;
        bars.push({ o, c, h: Math.min(o, c) - r() * vol * 0.7, l: Math.max(o, c) + r() * vol * 0.7 });
        prev = c;
      }
      const gN = el('g', {}, svg);
      const lines = [];
      for (let j = 0; j < 9; j++) {
        const rr = rng(200 + j);
        let d = '';
        const m = 64;
        for (let i = 0; i <= m; i++) {
          const t = i / m;
          const y = trend(t) + (rr() - 0.5) * h * 0.46 * (0.35 + 0.8 * Math.sin(t * Math.PI));
          d += (i ? 'L' : 'M') + (padX + t * (w - padX * 2)).toFixed(1) + ' ' + y.toFixed(1);
        }
        lines.push(el('path', { d, class: 'nz' }, gN));
      }
      const gC = el('g', {}, svg);
      const cs = bars.map((b, i) => {
        const g = el('g', { class: 'cd ' + (b.c <= b.o ? 'up' : 'down') }, gC);
        const cx = x(i), bw = Math.max(4, ((w - padX * 2) / n) * 0.5);
        el('line', { x1: cx, x2: cx, y1: b.h, y2: b.l }, g);
        el('rect', { x: cx - bw / 2, y: Math.min(b.o, b.c), width: bw, height: Math.max(3, Math.abs(b.o - b.c)) }, g);
        g.style.transformOrigin = `${cx}px ${(b.h + b.l) / 2}px`;
        return g;
      });
      const sm = bars.map((_, i) => { const s = bars.slice(Math.max(0, i - 7), i + 1); return s.reduce((a, b) => a + b.c, 0) / s.length; });
      const ma = el('path', { d: sm.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + v.toFixed(1)).join(''), class: 'ma', pathLength: 1 }, svg);
      const cl = el('path', { d: bars.map((b, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + b.c.toFixed(1)).join(''), class: 'cl', pathLength: 1 }, svg);
      ma.style.strokeDasharray = cl.style.strokeDasharray = '1';
      draw = (t) => {
        const nz = 1 - ease(clamp(t / 0.62));
        const line = ease(clamp((t - 0.1) / 0.4)) * (1 - ease(clamp((t - 0.62) / 0.3)) * 0.6);
        const st = ease(clamp((t - 0.36) / 0.64));
        lines.forEach((l, j) => { l.style.opacity = (nz * (0.3 + 0.1 * (j % 3))).toFixed(3); });
        cl.style.strokeDashoffset = (1 - ease(clamp((t - 0.1) / 0.45))).toFixed(3);
        cl.style.opacity = line.toFixed(3);
        cs.forEach((g, i) => {
          const d = clamp(st * 1.4 - (i / cs.length) * 0.4);
          g.style.opacity = d.toFixed(3);
          g.style.transform = `scaleY(${(0.06 + 0.94 * ease(d)).toFixed(3)})`;
        });
        ma.style.strokeDashoffset = (1 - ease(clamp((t - 0.52) / 0.48))).toFixed(3);
        ma.style.opacity = clamp((t - 0.46) * 3).toFixed(3);
      };
      draw(p);
    };
    build();
    let timer = 0;
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (Math.round(root.clientWidth) + 'x' + Math.round(root.clientHeight) !== size) build(); }, 160);
    }) : null;
    ro && ro.observe(root);
    let raf = 0;
    const api = {
      get p() { return p; },
      set(v) { p = clamp(v); draw(p); },
      /* animate from the current value to `to`; resolves when done */
      play(to = 1, ms = 2600, from = null) {
        cancelAnimationFrame(raf);
        if (from !== null) { p = from; draw(p); }
        if (reduce() || !ms) { p = to; draw(p); return Promise.resolve(); }
        const a = p, t0 = performance.now();
        return new Promise((res) => {
          const tick = (now) => { const k = clamp((now - t0) / ms); p = a + (to - a) * (to > a ? easeOut(k) * 0.4 + k * 0.6 : k); draw(p); if (k < 1) raf = requestAnimationFrame(tick); else res(); };
          raf = requestAnimationFrame(tick);
        });
      },
      stop() { cancelAnimationFrame(raf); },
      destroy() { cancelAnimationFrame(raf); ro && ro.disconnect(); }
    };
    return api;
  }

  /* ------------------------------------------------------------------ bed */
  let traceCache = null;
  const loadTrace = (url) => (traceCache = traceCache || fetch(url).then((r) => { if (!r.ok) throw new Error('trace'); return r.json(); }));
  let uid = 0;

  async function bed(root, opts = {}) {
    const svg = root.querySelector('svg');
    const id = 'b' + (uid++);
    const data = await loadTrace(opts.data || '/assets/data/bed-trace.json');
    const g = data.groups;
    svg.setAttribute('viewBox', opts.viewBox || `0 0 ${data.w} ${data.h}`);
    svg.replaceChildren();
    const defs = el('defs', {}, svg);
    const clip = el('clipPath', { id: id + 'c' }, defs);
    el('path', { d: g.outline[0].d }, clip);
    const rv = el('mask', { id: id + 'r', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: data.w, height: data.h }, defs);
    const rvRect = el('rect', { x: 0, y: 0, width: data.w, height: 0, fill: '#fff' }, rv);
    const grad = el('radialGradient', { id: id + 'g' }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff' }, grad);
    el('stop', { offset: '0.32', 'stop-color': '#fff' }, grad);
    el('stop', { offset: '0.74', 'stop-color': '#fff', 'stop-opacity': '0' }, grad);
    const rm = el('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: data.w, height: data.h }, defs);
    const roomCircle = el('circle', { cx: 880, cy: 610, r: 0, fill: `url(#${id}g)` }, rm);
    const href = opts.image || '/assets/img/ssf/bed.webp';
    const room = el('image', { href, width: data.w, height: data.h, mask: `url(#${id}m)`, preserveAspectRatio: 'xMidYMid slice' }, svg);
    const inside = el('g', { 'clip-path': `url(#${id}c)` }, svg);
    el('image', { href, width: data.w, height: data.h, mask: `url(#${id}r)`, preserveAspectRatio: 'xMidYMid slice' }, inside);

    /* long architectural hairlines, then the traced parts */
    const hair = [];
    const hr = rng(5);
    const gH = el('g', { class: 'bd-hair' }, svg);
    for (let i = 0; i < 16; i++) {
      const hx = 40 + hr() * (data.w - 80);
      const y0 = hr() * 160, y1 = data.h - hr() * 200;
      hair.push(el('line', { x1: hx, x2: hx, y1: y0, y2: y1, pathLength: 1 }, gH));
    }
    const gL = el('g', { class: 'bd-lines' }, svg);
    const mk = (d, cls) => el('path', { d, class: cls, pathLength: 1 }, gL);
    const slats = g.slat.map((s) => mk(s.d, 'bd-slat'));
    const parts = [
      [g.head, 'bd-part'], [g.outline, 'bd-main'], [g.frame, 'bd-part'], [g.bedding, 'bd-part'], [g.throw, 'bd-part'], [g.pillow, 'bd-part']
    ].map(([arr, cls]) => mk(arr[0].d, cls));
    [...hair, ...slats, ...parts].forEach((n) => { n.style.strokeDasharray = '1'; });

    let p = opts.start ?? 1;
    const draw = (t) => {
      hair.forEach((l, i) => {
        const d = easeOut(clamp((t + 0.08 - i * 0.004) / 0.22));
        l.style.strokeDashoffset = (1 - d).toFixed(3);
        l.style.opacity = (0.5 * (1 - ease(clamp((t - 0.22) / 0.3)))).toFixed(3);
      });
      slats.forEach((s, i) => {
        const d = easeOut(clamp((t - 0.04 - i * 0.006) / 0.22));
        s.style.strokeDashoffset = (1 - d).toFixed(3);
        s.style.opacity = (0.95 - 0.6 * ease(clamp((t - 0.72) / 0.28))).toFixed(3);
      });
      parts.forEach((s, i) => {
        const d = ease(clamp((t - 0.16 - i * 0.05) / 0.3));
        s.style.strokeDashoffset = (1 - d).toFixed(3);
        s.style.opacity = (0.95 - 0.62 * ease(clamp((t - 0.72) / 0.28))).toFixed(3);
      });
      rvRect.setAttribute('height', (data.h * ease(clamp((t - 0.5) / 0.28))).toFixed(1));
      const rr = 1180 * ease(clamp((t - 0.72) / 0.28));
      roomCircle.setAttribute('r', rr.toFixed(1));
    };
    draw(p);
    let raf = 0;
    return {
      get p() { return p; },
      set(v) { p = clamp(v); draw(p); },
      play(to = 1, ms = 2800, from = null) {
        cancelAnimationFrame(raf);
        if (from !== null) { p = from; draw(p); }
        if (reduce() || !ms) { p = to; draw(p); return Promise.resolve(); }
        const a = p, t0 = performance.now();
        return new Promise((res) => {
          const tick = (now) => { const k = clamp((now - t0) / ms); p = a + (to - a) * k; draw(p); if (k < 1) raf = requestAnimationFrame(tick); else res(); };
          raf = requestAnimationFrame(tick);
        });
      },
      stop() { cancelAnimationFrame(raf); }
    };
  }

  window.SV = Object.assign(window.SV || {}, { chart, bed, ease, easeOut, clamp });
})();
