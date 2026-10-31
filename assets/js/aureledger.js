/* Aureledger exhibition: the note-to-lines control, the scrubbed introduction, and the accounting quiz. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const SV = window.SV;

  /* ---- hero: lines drawn across the note; settles once, then follows a pointer or the slider ---- */
  const hero = document.querySelector('[data-hero]');
  const noteEl = hero && hero.querySelector('[data-note]');
  const split = hero && hero.querySelector('#note-split');
  if (noteEl && SV) {
    const n = SV.note(noteEl, { start: 58 });
    const sync = () => { if (split) split.value = Math.round(n.v); };
    if (reduce.matches) { n.set(58); sync(); }
    else {
      let stop = false;
      n.play(58, 3200, 0);
      const t0 = performance.now();
      const follow = (now) => { if (stop) return; sync(); if (now - t0 < 3400) requestAnimationFrame(follow); };
      requestAnimationFrame(follow);
      split && split.addEventListener('input', () => { stop = true; });
      hero.addEventListener('pointerdown', () => { stop = true; }, { once: true });
    }
    if (split) split.addEventListener('input', () => n.set(+split.value));
    /* mouse follows the pointer; touch drags across the note (vertical scrolling is untouched) */
    n.follow(hero, { touch: false });
    noteEl.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || e.buttons === 0) return;
      const r = noteEl.getBoundingClientRect();
      n.set(((e.clientX - r.left) / r.width) * 100); sync();
    }, { passive: true });
    hero.addEventListener('pointermove', () => { if (matchMedia('(hover:hover)').matches) sync(); }, { passive: true });
  }

  /* ---- the introduction: horizontal travel across this chapter is the single source of progress;
         chapters and the slider move the scroll position. Phones, reduced motion and no-JS show the seven stages as a list. ---- */
  const sec = document.querySelector('[data-seq]');
  if (sec) {
    if (reduce.matches) document.documentElement.classList.add('rm');
    else run(sec);
  }
  function run(sec) {
    const img = sec.querySelector('[data-stage-img]');
    const scrub = sec.querySelector('[data-scrub]');
    const chips = [...sec.querySelectorAll('[data-ch]')];
    const capT = sec.querySelector('[data-cap-title]');
    const capX = sec.querySelector('[data-cap-text]');
    const texts = [...sec.querySelectorAll('.seq-static li')].map((li) => ({ t: li.querySelector('b').textContent, x: li.querySelector('figcaption span:last-child').textContent }));
    const N = 32, starts = [0, 6, 10, 16, 21, 24, 29];
    const url = (i) => `/assets/img/al/seq/d-${String(i).padStart(2, '0')}.jpg`;
    const flags = new Array(N).fill(false);
    let loading = false, cur = null, curCh = -1;
    const preload = () => {
      if (loading) return; loading = true;
      let next = 0, active = 0;
      const pump = () => {
        while (active < 2 && next < N) {
          const i = next++; active++;
          const im = new Image(); im.decoding = 'async';
          im.onload = im.onerror = () => { flags[i] = im.complete && im.naturalWidth > 0; active--; if (cur !== null) show(cur, true); pump(); };
          im.src = url(i);
        }
      };
      pump();
    };
    const chapterOf = (i) => { let c = 0; starts.forEach((a, k) => { if (i >= a) c = k; }); return c; };
    const show = (i, force) => {
      let j = i; while (j > 0 && !flags[j]) j--;               /* nearest loaded frame at or before the target */
      if (!force && cur === i && img.dataset.j === String(j)) return;
      cur = i;
      if (img.dataset.j !== String(j)) { img.src = url(j); img.dataset.j = String(j); }
      const c = chapterOf(i);
      if (c !== curCh) {
        curCh = c;
        chips.forEach((b, k) => (k === c ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
        capT.textContent = texts[c].t; capX.textContent = texts[c].x;
        img.alt = `The introduction at stage ${c + 1} of 7: ${texts[c].t.replace(/\.$/, '')}`;
      }
    };
    if (window.HS) HS.on(sec, (p) => { show(Math.min(N - 1, Math.round(p * (N - 1)))); if (document.activeElement !== scrub) scrub.value = Math.round(p * 100); });
    chips.forEach((b, k) => b.addEventListener('click', () => HS.scrollToPanelProgress(sec, (starts[k] + 0.01) / (N - 1), true)));
    scrub.addEventListener('input', () => HS.scrollToPanelProgress(sec, +scrub.value / 100, true));
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) preload(); }, { rootMargin: '0px 40% 0px 40%' });
    near.observe(sec);
    show(0, true);
  }

  /* ---- accounting quiz ---- */
  const quiz = document.querySelector('[data-quiz]');
  const score = document.querySelector('[data-quiz-score]');
  if (quiz) {
    const items = [...quiz.querySelectorAll('li')];
    let right = 0, done = 0;
    items.forEach((li) => {
      li.querySelectorAll('[data-guess]').forEach((b) => b.addEventListener('click', () => {
        if (li.hasAttribute('data-done')) return;
        const ok = b.dataset.guess === li.dataset.ans;
        li.setAttribute('data-done', ''); li.dataset.right = ok ? '1' : '0';
        b.classList.add('pick'); b.setAttribute('aria-pressed', 'true');
        li.querySelector('.quiz__a').hidden = false;
        if (ok) right++; done++;
        score.textContent = done === items.length ? `${right} of ${items.length} matched the ledger's rule.` : `${done} of ${items.length} answered.`;
      }));
    });
  }
})();
