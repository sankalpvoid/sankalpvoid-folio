/* Furnishers exhibition: the traced bed drawn to a render. Scroll sets one progress value; a slider offers the same control. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const SV = window.SV;

  /* hero scene: settled composition (the gallery plays the draw on entry) */
  const heroBed = document.querySelector('.hero [data-bed]');
  if (heroBed && SV) SV.bed(heroBed, { start: 1 }).then(() => heroBed.classList.add('is-drawn')).catch(() => {});

  /* a window on the same 1500x1200 space, tight on the bed; geometry and render stay registered */
  const STAGE_VB = '150 190 1200 960';
  const sec = document.querySelector('[data-draw]');
  if (!sec || !SV) return;
  const stageEl = sec.querySelector('[data-bed-stage]');
  const scrub = sec.querySelector('[data-scrub]');
  const step = sec.querySelector('[data-step]');
  const text = sec.querySelector('[data-text]');
  const captions = [
    [0, 'Hairlines on a blank page. Nothing is a bed yet; it is only measurement.'],
    [0.14, 'The slats appear first: the headboard is what a bed says about itself.'],
    [0.34, 'The frame, bedding, throw and pillow are drawn in the same line.'],
    [0.52, 'The render fills the drawn silhouette from the top down.'],
    [0.74, 'Then the room arrives around the bed.'],
    [0.95, 'The finished studio render, a placeholder until real photography exists.']
  ];
  let shown = -1;
  const caption = (p) => {
    let k = 0; captions.forEach((c, i) => { if (p >= c[0]) k = i; });
    if (k !== shown) { shown = k; step.textContent = `${String(k + 1).padStart(2, '0')} / ${String(captions.length).padStart(2, '0')}`; text.textContent = captions[k][1]; }
  };

  const staticMode = () => {
    document.documentElement.classList.add('rm');
    const box = sec.querySelector('[data-static]');
    box.hidden = false;
    [[0.22, 'Slats'], [0.45, 'Frame'], [0.72, 'Fill'], [1, 'Room']].forEach(([p, label]) => {
      const f = document.createElement('figure');
      f.innerHTML = `<div class="bed"><svg></svg></div><figcaption class="mono">${label}</figcaption>`;
      box.appendChild(f);
      SV.bed(f.querySelector('.bed'), { start: p }).catch(() => {});
    });
    SV.bed(stageEl, { start: 1, viewBox: STAGE_VB }).then(() => stageEl.querySelector('.bed-fallback')?.remove()).catch(() => {});
  };

  if (reduce.matches) { staticMode(); return; }

  let bed = null;
  SV.bed(stageEl, { start: 0, viewBox: STAGE_VB }).then((b) => { bed = b; stageEl.querySelector('.bed-fallback')?.remove(); apply(current()); }).catch(() => { staticMode(); });
  const fb = stageEl.querySelector('.bed-fallback'); if (fb) fb.style.opacity = 0;

  const current = () => {
    const r = sec.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  };
  const apply = (p) => { if (bed) bed.set(p); caption(p); scrub.value = Math.round(p * 100); };
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; apply(current()); }); } };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
    else removeEventListener('scroll', onScroll);
  }, { rootMargin: '20% 0px' });
  io.observe(sec);
  scrub.addEventListener('input', () => { if (bed) bed.set(+scrub.value / 100); caption(+scrub.value / 100); });
  addEventListener('resize', onScroll);

  /* before / after comparison */
  const cmp = document.querySelector('[data-cmp]');
  const cin = cmp && cmp.querySelector('[data-cmp-in]');
  if (cin) cin.addEventListener('input', () => cmp.style.setProperty('--pos', cin.value + '%'));
})();
