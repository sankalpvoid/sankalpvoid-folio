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
    sec.querySelector('.draw__ctl').hidden = true;
  };

  if (reduce.matches) staticMode();
  else {
    const pinned = () => !!(window.HS && HS.active);
    let bed = null;
    const start = pinned() ? 0 : 1;                         /* in the flat layout the stage rests on the finished render and the slider scrubs it */
    SV.bed(stageEl, { start, viewBox: STAGE_VB }).then((b) => { bed = b; stageEl.querySelector('.bed-fallback')?.remove(); caption(start); scrub.value = start * 100; }).catch(() => staticMode());
    const fb = stageEl.querySelector('.bed-fallback'); if (fb) fb.style.opacity = 0;
    /* one source of progress: the horizontal travel across this chapter; the slider moves the scroll position */
    if (window.HS) HS.on(sec, (p) => { if (!pinned()) return; if (bed) bed.set(p); caption(p); scrub.value = Math.round(p * 100); });
    scrub.addEventListener('input', () => {
      const p = +scrub.value / 100;
      if (pinned()) HS.scrollToPanelProgress(sec, p);
      else { if (bed) bed.set(p); caption(p); }
    });
  }

  /* before / after comparison */
  const cmp = document.querySelector('[data-cmp]');
  const cin = cmp && cmp.querySelector('[data-cmp-in]');
  if (cin) cin.addEventListener('input', () => cmp.style.setProperty('--pos', cin.value + '%'));
})();
