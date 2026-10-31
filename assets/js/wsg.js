/* WealthWithSG hero: one chart you can move across. Settles on structure by itself. */
(() => {
  const hero = document.querySelector('[data-hero]');
  const env = hero && hero.querySelector('[data-chart-env]');
  if (!env || !window.SV) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const input = hero.querySelector('#noise');
  const out = hero.querySelector('#noise-out');
  const chart = window.SV.chart(env, { start: reduce.matches ? 1 : 0 });
  let touched = false;
  const word = (v) => (v < 20 ? 'Noise' : v < 50 ? 'Recognition' : v < 85 ? 'Structure' : 'Structure and context');
  const show = (v) => { input.value = Math.round(v * 100); out.textContent = word(v * 100); };
  const set = (v) => { chart.stop(); chart.set(v); show(v); };

  if (reduce.matches) { chart.set(1); show(1); }
  else {
    /* on load: noise settles into structure once */
    chart.play(1, 3600, 0);
    let raf = 0; const t0 = performance.now();
    const follow = (now) => { if (touched) return; show(chart.p); if (now - t0 < 3800) raf = requestAnimationFrame(follow); };
    raf = requestAnimationFrame(follow);
    addEventListener('pagehide', () => cancelAnimationFrame(raf));
  }

  input.addEventListener('input', () => { touched = true; set(+input.value / 100); });

  /* pointer across the chart: left is noise, right is structure; easing back to structure on leave */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce.matches) {
    hero.addEventListener('pointermove', (e) => {
      if (e.target.closest('.hero-ctl,.actions,a,button')) return;
      touched = true;
      const r = hero.getBoundingClientRect();
      set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { if (touched) { chart.play(1, 1200); setTimeout(() => show(1), 1250); } });
  }
})();

/* Story stage: the same illustrative chart, scrubbed by the story's own progress (noise at the start, structure at the end). */
(() => {
  const panel = document.querySelector('[data-wsg-stage]');
  const env = panel && panel.querySelector('[data-chart-env]');
  if (!env || !window.SV || !window.HS) return;
  const chart = window.SV.chart(env, { start: 0 });
  const k = panel.querySelector('[data-wsg-k]'), t = panel.querySelector('[data-wsg-t]');
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const COPY = [['Frame 03 · Conflict', 'Up close, noise and information look exactly alike.'], ['Frame 04 · Breakdown', 'Strip the noise away and structure is what remains.']];
  let cur = -1;
  HS.on(panel, (p) => {
    chart.stop(); chart.set(clamp((p - 0.12) / 0.7));
    const i = p < 0.45 ? 0 : 1;
    if (i !== cur) { cur = i; k.textContent = COPY[i][0]; t.textContent = COPY[i][1]; }
  });
})();
