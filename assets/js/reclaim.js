/* Reclaim exhibition: the recording plays only while visible; the orb is opt-in. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- recording: starts when most of it is on screen, pauses when it leaves ---- */
  const v = document.querySelector('[data-vid] video');
  const btn = document.querySelector('[data-vid-btn]');
  if (v && btn) {
    let user = false; /* the visitor's explicit choice wins over visibility */
    const label = () => { btn.textContent = v.paused ? 'Play recording' : 'Pause'; btn.setAttribute('aria-pressed', String(!v.paused)); };
    const play = () => v.play().then(label).catch(label);
    btn.addEventListener('click', () => { user = true; if (v.paused) play(); else { v.pause(); label(); } });
    v.addEventListener('pause', label); v.addEventListener('play', label);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { v.preload = 'auto'; if (!reduce.matches && !user) play(); }
        else { v.pause(); }
      }, { threshold: 0.55 });
      io.observe(v);
    }
    label();
  }

  /* ---- the breathing orb: four seconds each, only when asked ---- */
  const orb = document.querySelector('[data-orb]');
  const obtn = document.querySelector('[data-orb-btn]');
  if (orb && obtn) {
    const lab = orb.querySelector('[data-orb-label]');
    const live = document.querySelector('[data-orb-live]');
    const steps = ['Inhale', 'Hold', 'Exhale', 'Hold'];
    let timer = 0, i = 0, cycles = 0;
    const tick = () => {
      lab.textContent = steps[i % 4];
      orb.classList.toggle('expand', i % 4 < 2);
      if (live) live.textContent = steps[i % 4];
      if (++i > 15) stop(); /* three full cycles, then rest */
    };
    const stop = () => { clearInterval(timer); timer = 0; i = 0; lab.textContent = 'Ready'; orb.classList.remove('expand'); obtn.textContent = 'Follow the rhythm'; obtn.setAttribute('aria-pressed', 'false'); if (live) live.textContent = '4 · 4 · 4 · 4 seconds'; };
    obtn.addEventListener('click', () => {
      if (timer) return stop();
      obtn.textContent = 'Stop'; obtn.setAttribute('aria-pressed', 'true');
      tick(); timer = setInterval(tick, 4000);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && timer) stop(); });
  }
})();
