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

  /* ---- the introduction: scroll is the single source of progress; chapters and slider move the scroll ---- */
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
    const statics = [...sec.querySelectorAll('.seq-static li')];
    const texts = statics.map((li) => ({ t: li.querySelector('b').textContent, x: li.querySelector('figcaption span:last-child').textContent }));
    const wide = matchMedia('(min-width:861px)');
    /* frame index at which each chapter begins, for the desktop (landscape) and phone (portrait) sets */
    const SETS = {
      d: { n: 32, prefix: 'd', starts: [0, 6, 10, 16, 21, 24, 29] },
      m: { n: 10, prefix: 'm', starts: [0, 2, 3, 5, 6, 7, 8] }
    };
    let set = wide.matches ? SETS.d : SETS.m;
    const cache = new Map();
    const url = (s, i) => `/assets/img/al/seq/${s.prefix}-${String(i).padStart(2, '0')}.jpg`;
    const loaded = (s) => { if (!cache.has(s)) cache.set(s, new Array(s.n).fill(false)); return cache.get(s); };
    let loading = new Set();
    const preload = (s) => {
      if (loading.has(s)) return; loading.add(s);
      const flags = loaded(s); let next = 0, active = 0;
      const pump = () => {
        while (active < 4 && next < s.n) {
          const i = next++; active++;
          const im = new Image(); im.decoding = 'async';
          im.onload = im.onerror = () => { flags[i] = im.complete && im.naturalWidth > 0; active--; if (cur !== null) show(cur, true); pump(); };
          im.src = url(s, i);
        }
      };
      pump();
    };
    const chapterOf = (i) => { let c = 0; set.starts.forEach((a, k) => { if (i >= a) c = k; }); return c; };
    let cur = null, curCh = -1;
    const show = (i, force) => {
      const flags = loaded(set);
      let j = i; while (j > 0 && !flags[j]) j--;     /* nearest loaded frame at or before the target */
      if (!force && cur === i && img.dataset.j === String(j)) return;
      cur = i;
      if (img.dataset.j !== String(j)) { img.src = url(set, j); img.dataset.j = String(j); }
      const c = chapterOf(i);
      if (c !== curCh) {
        curCh = c;
        chips.forEach((b, k) => (k === c ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
        capT.textContent = texts[c].t; capX.textContent = texts[c].x;
        img.alt = `The introduction at stage ${c + 1} of 7: ${texts[c].t.replace(/\.$/, '')}`;
      }
    };
    const span = () => Math.max(1, sec.offsetHeight - innerHeight);
    const progress = () => Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / span()));
    let ticking = false;
    const frame = () => { ticking = false; const p = progress(); const i = Math.min(set.n - 1, Math.round(p * (set.n - 1))); show(i); scrub.value = Math.round(p * 100); };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    const scrollToP = (p) => { const y = sec.offsetTop + Math.min(1, Math.max(0, p)) * span(); scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' }); };

    chips.forEach((b, k) => b.addEventListener('click', () => scrollToP((set.starts[k] + 0.01) / (set.n - 1))));
    scrub.addEventListener('input', () => scrollToP(+scrub.value / 100));
    scrub.addEventListener('change', () => { /* keep the page where the value landed */ });
    wide.addEventListener('change', () => { set = wide.matches ? SETS.d : SETS.m; cur = null; curCh = -1; img.dataset.j = ''; preload(set); frame(); });

    /* frames are fetched only as the section approaches, in order, four at a time */
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { preload(set); addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
      else removeEventListener('scroll', onScroll);
    }, { rootMargin: '60% 0px' });
    near.observe(sec);
    addEventListener('resize', onScroll);
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
