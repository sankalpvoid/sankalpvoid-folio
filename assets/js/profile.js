/* Profile: one pinned stage; document scroll is the only input (damped, so the choreography has weight).
   Scenes (scroll positions in viewport heights): identity -> the portrait opens from a zero-width line -> engineering and building ->
   the thread -> music. Type, portrait and copy sit on different planes and move at different rates. Only one scene's copy is ever
   visible, so nothing collides. The portrait is a full image behind an animated clip mask: before it opens its mask has zero width and
   the element is not rendered (visibility hidden), so the first frame shows no portrait at all.
   The line in the music scene is a drawing driven by scroll position; it is not connected to audio and nothing here plays sound.
   Reduced motion and no-JS get a flat page with the portrait shown and the same content in reading order. */
(() => {
  const pf = document.querySelector('[data-pf]');
  if (!pf) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  if (reduce.matches) { root.classList.add('rm'); return; }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const win = (t, a, b) => clamp((t - a) / (b - a));

  const pin = pf.querySelector('[data-pin]');
  const portrait = pf.querySelector('[data-portrait]');
  const hint = pf.querySelector('[data-hint]');
  const sb = pf.querySelector('[data-sb]'), sc = pf.querySelector('[data-sc]'), sd = pf.querySelector('[data-sd]');
  const stringEl = pf.querySelector('.pf__string'), path = pf.querySelector('[data-string]');
  const words = [...pf.querySelectorAll('[data-w]')];
  const T = 11;                                            /* scroll length of the stage in viewport heights */
  const PLUCKS = [9.95, 10.4, 10.8];
  let vh = innerHeight, vw = innerWidth, top = 0, stringH = 0, wordX = [];
  let target = 0, rendered = -1, raf = 0, last = 0, lastPath = '';

  /* portrait key states; between keys the values ease in and out */
  const K = (t, cx, ml, mr, is, ix, iy, op) => ({ t, cx, ml, mr, is, ix, iy, op });
  const keys = () => (vw < 820
    ? [K(0, .5, 50, 50, 1, 0, 0, 1), K(.5, .5, 50, 50, 1, 0, 0, 1), K(1.9, .5, 0, 0, 1, 0, 0, 1), K(2.7, .5, 0, 0, 1, 0, 0, 1), K(4, .5, 0, 0, 1.3, 3, 4, .9), K(6, .5, 0, 0, 1.3, 3, 4, .9), K(7.2, .5, 16, 16, 1.05, 0, 0, .9), K(8.6, .5, 16, 16, 1.05, 0, 0, .9), K(9.8, .5, 0, 0, 1.1, 0, 0, .22), K(T, .5, 0, 0, 1.1, 0, 0, .22)]
    : [K(0, .66, 50, 50, 1, 0, 0, 1), K(.5, .66, 50, 50, 1, 0, 0, 1), K(1.9, .66, 0, 0, 1, 0, 0, 1), K(2.7, .66, 0, 0, 1, 0, 0, 1), K(4, .30, 0, 0, 1.3, 6, 4, 1), K(6, .30, 0, 0, 1.3, 6, 4, 1), K(7.2, .80, 24, 0, 1, 0, 0, 1), K(8.6, .80, 24, 0, 1, 0, 0, 1), K(9.8, .52, 0, 0, 1.12, 0, 0, .26), K(T, .52, 0, 0, 1.12, 0, 0, .26)]);
  let ks = keys();
  const state = (t) => {
    let i = 0; while (i < ks.length - 2 && t > ks[i + 1].t) i++;
    const a = ks[i], b = ks[i + 1], k = eio(win(t, a.t, b.t));
    const m = (p) => a[p] + (b[p] - a[p]) * k;
    return { cx: m('cx'), ml: m('ml'), mr: m('mr'), is: m('is'), ix: m('ix'), iy: m('iy'), op: m('op') };
  };

  const measure = () => {
    vh = innerHeight; vw = innerWidth; ks = keys();
    pf.style.height = ((T + 1) * vh) + 'px';
    top = pf.getBoundingClientRect().top + scrollY;
    stringH = stringEl.getBoundingClientRect().height;
    wordX = words.map((w) => { const r = w.getBoundingClientRect(); return clamp((r.left + r.width / 2) / vw); });
    readTarget();
  };
  const readTarget = () => { target = clamp((scrollY - top) / vh, 0, T); };

  const disp = (fx, A, phase) => A * (Math.sin(2 * Math.PI * 2.5 * fx + phase) + 0.35 * Math.sin(2 * Math.PI * 5 * fx + 1.7 * phase)) * Math.sin(Math.PI * fx);
  const drawString = (A, phase) => {
    let d = '';
    for (let i = 0; i <= 80; i++) { const fx = i / 80; d += (i ? 'L' : 'M') + (fx * 1000).toFixed(1) + ' ' + (100 + disp(fx, A, phase)).toFixed(2); }
    if (d !== lastPath) { path.setAttribute('d', d); lastPath = d; }
  };

  const scene = (el, t, inA, inB, outA, outB, rise = 34) => {
    const o = win(t, inA, inB) * (1 - win(t, outA, outB));
    el.style.opacity = o.toFixed(3);
    el.style.setProperty('--sy', ((1 - eo(win(t, inA, inB))) * rise - eio(win(t, outA, outB)) * rise).toFixed(1) + 'px');
    const on = o > 0.01;
    if (on !== el.classList.contains('is-on')) el.classList.toggle('is-on', on);
  };

  const render = (t) => {
    const st = state(t), st2 = pin.style;
    const open = 100 - st.ml - st.mr > 0.4;
    if (open !== portrait.classList.contains('is-open')) portrait.classList.toggle('is-open', open);
    st2.setProperty('--pcx', (st.cx * vw).toFixed(1) + 'px');
    st2.setProperty('--pml', st.ml.toFixed(3) + '%'); st2.setProperty('--pmr', st.mr.toFixed(3) + '%');
    st2.setProperty('--pis', st.is.toFixed(4)); st2.setProperty('--pix', st.ix.toFixed(3) + '%'); st2.setProperty('--piy', st.iy.toFixed(3) + '%');
    st2.setProperty('--pop', st.op.toFixed(3));
    st2.setProperty('--pty', (t > 9.8 ? win(t, 9.8, T) * 0.05 * vh : 0).toFixed(1) + 'px');

    /* identity: two lines on opposite planes, they pass behind the portrait as it opens, then leave */
    const out = eio(win(t, 2.1, 2.9)), drift = win(t, 0, 2.9);
    st2.setProperty('--l1x', (-drift * 0.09 * vw).toFixed(1) + 'px');
    st2.setProperty('--l1y', (-out * 0.2 * vh).toFixed(1) + 'px');
    st2.setProperty('--l1o', (1 - out).toFixed(3));
    st2.setProperty('--l2x', (drift * 0.09 * vw).toFixed(1) + 'px');
    st2.setProperty('--l2y', (out * 0.18 * vh).toFixed(1) + 'px');
    st2.setProperty('--l2o', (1 - out).toFixed(3));
    st2.setProperty('--hio', (1 - win(t, 0, 0.35)).toFixed(3));

    scene(sb, t, 3.4, 3.95, 5.7, 6.2);
    scene(sc, t, 6.9, 7.45, 8.8, 9.3);
    scene(sd, t, 9.55, 10.05, 99, 100);

    /* music: the line appears, then is plucked three times; the three words ride it */
    stringEl.style.setProperty('--so', win(t, 9.3, 9.9).toFixed(3));
    let A = 4 * win(t, 9.5, 10), phase = t * 5;
    let k = -1; PLUCKS.forEach((p, j) => { if (t >= p) k = j; });
    if (k >= 0) { A = Math.max(A, 4 + 58 * Math.exp(-3.4 * ((t - PLUCKS[k]) / 0.32))); phase = t * 40; }
    drawString(A, phase);
    words.forEach((w, i) => { const pk = PLUCKS[i]; const pulse = pk !== undefined && t >= pk ? Math.exp(-4.2 * ((t - pk) / 0.32)) : 0; w.style.setProperty('--ws', (1 + 0.045 * pulse).toFixed(4)); });
    words.forEach((w, i) => w.style.setProperty('--wy', (disp(wordX[i] || 0.5, A, phase) / 200 * stringH * 0.7 * win(t, 9.9, 10.1)).toFixed(1) + 'px'));
  };

  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const d = target - rendered;
    if (Math.abs(d) < 0.0008) rendered = target;
    else {
      const k = 1 - Math.exp(-dt / 0.14), cap = 4.2 * dt;           /* damped; at most ~4 viewport heights of story per second */
      rendered += clamp(d * k, -cap, cap);
    }
    render(rendered);
    if (rendered !== target) raf = requestAnimationFrame(frame);
  };
  const tick = () => { readTarget(); if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  /* keyboard focus inside a scene, and #music, bring that scene's scroll position with them */
  const jumpTo = (units) => { scrollTo({ top: top + units * vh, behavior: 'auto' }); tick(); };
  sb.addEventListener('focusin', () => jumpTo(4.8));
  sc.addEventListener('focusin', () => jumpTo(8));
  sd.addEventListener('focusin', () => jumpTo(10.4));
  const hash = () => { if (location.hash === '#music') jumpTo(10.4); };

  measure(); rendered = target; render(rendered);
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', () => { measure(); rendered = target; render(rendered); });
  addEventListener('hashchange', hash);
  addEventListener('pageshow', () => { measure(); rendered = target; render(rendered); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); rendered = target; render(rendered); hash(); }); else hash();
  reduce.addEventListener('change', () => { if (reduce.matches) { cancelAnimationFrame(raf); root.classList.add('rm'); pf.style.height = ''; } });
})();
