/* Profile: one pinned stage; document scroll is the only input.
   - the portrait begins as a narrow slit and widens, then slides right and recedes while the text takes the stage
   - the anchor statement moves on its own planes (two lines, opposite directions) across and past the portrait
   - seven phrases advance one at a time (previous dims and lifts), each tied to real work
   - a straight line becomes a string: it is plucked three times as you scroll, and the words of "Vocals. Guitar. Noise." ride it
   The string is a drawing driven by scroll position. It is not connected to audio and nothing here plays sound.
   Reduced motion and no-JS get a flat page with the same content in reading order. */
(() => {
  const pf = document.querySelector('[data-pf]');
  if (!pf) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eo = (t) => 1 - Math.pow(1 - t, 3);

  /* a photograph supplied through data-photo replaces the sketch inside the same frame and inherits all movement */
  const portrait = pf.querySelector('[data-portrait]');
  if (portrait && portrait.dataset.photo) {
    const img = portrait.querySelector('.pf__photo');
    img.addEventListener('load', () => portrait.classList.add('has-photo'), { once: true });
    img.src = portrait.dataset.photo;
  }

  if (reduce.matches) { root.classList.add('rm'); return; }

  const pin = pf.querySelector('.pf__pin');
  const l1 = pf.querySelector('[data-l1]'), l2 = pf.querySelector('[data-l2]');
  const hint = pf.querySelector('[data-scrollhint]');
  const phrases = [...pf.querySelectorAll('.pf__ph')];
  const music = pf.querySelector('.pf__music');
  const words = [...pf.querySelectorAll('[data-w]')];
  const stringEl = pf.querySelector('.pf__string');
  const path = pf.querySelector('[data-string]');
  const N = phrases.length;
  const S1 = 2.2, S2 = N * 0.62, S3 = 2.7;            /* segment lengths, in viewport heights */
  const PLUCKS = [0.07, 0.4, 0.74];
  let vh = innerHeight, vw = innerWidth, top = 0, stringH = 0;
  let wordX = [];
  let lastPath = '', raf = 0, off = false;

  const measure = () => {
    vh = innerHeight; vw = innerWidth;
    pf.style.height = ((S1 + S2 + S3 + 1) * vh) + 'px';
    top = pf.getBoundingClientRect().top + scrollY;
    stringH = stringEl.getBoundingClientRect().height;
    const m = music.getBoundingClientRect();
    wordX = words.map((w) => { const r = w.getBoundingClientRect(); return clamp((r.left + r.width / 2 - 0) / vw); });
    void m;
  };

  const disp = (fx, A, phase) => A * (Math.sin(2 * Math.PI * 2.5 * fx + phase) + 0.35 * Math.sin(2 * Math.PI * 5 * fx + 1.7 * phase)) * Math.sin(Math.PI * fx);
  const drawString = (A, phase) => {
    let d = '';
    for (let i = 0; i <= 80; i++) { const fx = i / 80; d += (i ? 'L' : 'M') + (fx * 1000).toFixed(1) + ' ' + (100 + disp(fx, A, phase)).toFixed(2); }
    if (d !== lastPath) { path.setAttribute('d', d); lastPath = d; }
  };

  const update = () => {
    raf = 0;
    const total = (S1 + S2 + S3) * vh;
    const y = clamp(-pf.getBoundingClientRect().top, 0, total);
    const o = clamp(y / (S1 * vh)), pp = clamp((y - S1 * vh) / (S2 * vh)), mp = clamp((y - (S1 + S2) * vh) / (S3 * vh));
    const narrow = vw < 820;
    const st = pin.style;

    /* portrait */
    const reveal = 0.14 + 0.86 * eio(clamp(o / 0.85));
    const s1 = 1.16 - 0.16 * eo(o), pq = eio(clamp(pp / 0.4)), s2 = 1 - (narrow ? 0.28 : 0.4) * pq;
    st.setProperty('--prv', reveal.toFixed(3));
    st.setProperty('--psc', (s1 * s2).toFixed(3));
    st.setProperty('--ptx', ((narrow ? 0.1 : 0.27) * vw * pq + 0.05 * vw * mp).toFixed(1) + 'px');
    st.setProperty('--pty', ((1 - eo(o)) * 0.08 * vh + mp * 0.06 * vh).toFixed(1) + 'px');
    st.setProperty('--pop', (1 - (0.62 * eio(pp)) - 0.22 * mp).toFixed(3));

    /* opening type */
    const exit = eio(clamp((o - 0.55) / 0.45));
    st.setProperty('--l1x', (-o * 0.1 * vw).toFixed(1) + 'px');
    st.setProperty('--l1y', (-exit * 0.55 * vh).toFixed(1) + 'px');
    st.setProperty('--l1o', (1 - clamp((o - 0.82) / 0.18)).toFixed(3));
    const e2 = eo(clamp((o - 0.12) / 0.5));
    st.setProperty('--l2x', ((1 - e2) * 0.1 * vw).toFixed(1) + 'px');
    st.setProperty('--l2y', ((1 - e2) * 0.7 * vh - exit * 0.5 * vh).toFixed(1) + 'px');
    st.setProperty('--l2o', (e2 * (1 - clamp((o - 0.85) / 0.15))).toFixed(3));
    st.setProperty('--sho', (0.7 * (1 - clamp(o * 6))).toFixed(3));

    /* phrases: enter, hold, leave dimmed, then fade; the last one hands over to the music */
    const gate = clamp((o - 0.86) / 0.14);                 /* phrases wait until the opening has left */
    phrases.forEach((el, i) => {
      const d = pp * N - (i + 0.15);
      let op;
      if (d < -0.8) op = 0;
      else if (d < -0.3) op = eo((d + 0.8) / 0.5);
      else if (d <= 0.25) op = 1;
      else if (i === N - 1) op = 1 - clamp(mp / 0.16);
      else if (d < 0.62) op = 1 - 0.88 * ((d - 0.25) / 0.37);
      else if (d < 1.5) op = 0.12 * (1 - (d - 0.62) / 0.88);
      else op = 0;
      op *= gate;
      const dy = -clamp(d, -1, 1.6) * 0.22 * vh;
      el.style.opacity = op.toFixed(3);
      el.style.transform = `translate3d(0,calc(-50% + ${dy.toFixed(1)}px),0)`;
      el.classList.toggle('is-live', op > 0.6);
    });

    /* the string: appears with the last phrases, is plucked three times in Side B */
    const so = clamp((pp - 0.62) / 0.25);
    stringEl.style.opacity = so.toFixed(3);
    let A = 5 * clamp((pp - 0.78) / 0.22), phase = pp * 6;
    if (mp > 0) {
      let k = -1; PLUCKS.forEach((t, j) => { if (mp >= t) k = j; });
      const dt = k < 0 ? 0 : (mp - PLUCKS[k]) / 0.3;
      A = Math.max(A, 5 + (k < 0 ? 0 : 62 * Math.exp(-3.2 * dt)));
      phase = mp * 46;
    }
    drawString(A, phase);
    words.forEach((w, i) => w.style.setProperty('--wy', (disp(wordX[i] || 0.5, A, phase) / 200 * stringH * 0.7).toFixed(1) + 'px'));

    /* Side B */
    const mo = clamp((mp - 0.06) / 0.12);
    music.style.setProperty('--mo', mo.toFixed(3));
    music.style.setProperty('--co', clamp((mp - 0.45) / 0.2).toFixed(3));
    music.classList.toggle('is-live', mo > 0.5 && mp > 0.5);
  };
  const tick = () => { if (!raf && !off) raf = requestAnimationFrame(update); };

  /* keyboard focus inside the stage brings the matching scroll position with it */
  const jumpTo = (vhUnits) => scrollTo({ top: top + vhUnits * vh, behavior: 'auto' });
  phrases.forEach((el, i) => el.addEventListener('focusin', () => jumpTo(S1 + ((i + 0.15) / N) * S2)));
  music.addEventListener('focusin', () => jumpTo(S1 + S2 + 0.7 * S3));
  const hash = () => {
    if (location.hash === '#music') jumpTo(S1 + S2 + 0.66 * S3);
    else if (location.hash === '#phrases') jumpTo(S1);
  };

  const onResize = () => { measure(); tick(); };
  const stop = () => { off = true; cancelAnimationFrame(raf); removeEventListener('scroll', tick); removeEventListener('resize', onResize); removeEventListener('hashchange', hash); };
  measure(); update();
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('hashchange', hash);
  addEventListener('pagehide', stop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); update(); hash(); });
  else hash();
  reduce.addEventListener('change', () => { if (reduce.matches) { stop(); root.classList.add('rm'); pf.style.height = ''; } });
})();
