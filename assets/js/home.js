/* Gallery entrance: discrete, keyboard/touch/pointer friendly stage. No scroll hijacking. */
(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const slides = [...stage.querySelectorAll('.slide')];
  const ticks = [...stage.querySelectorAll('[data-go]')];
  const cur = stage.querySelector('[data-cur]');
  const live = stage.querySelector('[data-live]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const slugs = slides.map((s) => s.dataset.slug);
  let index = 0;
  let busy = false;
  const reducedNow = () => reduce.matches;

  /* ---- scenes: charts and the traced bed are built lazily, once per slide ---- */
  const scenes = new Map();
  const mountScene = (slide) => {
    if (!slide || scenes.has(slide) || !window.SV) return;
    const chartEl = slide.querySelector('[data-chart-env]');
    const bedEl = slide.querySelector('[data-bed]');
    if (chartEl) {
      const c = window.SV.chart(chartEl, { start: 1 });
      scenes.set(slide, { play: () => c.play(1, 2800, 0), settle: () => c.set(1) });
    } else if (bedEl) {
      const rec = { play: () => {}, settle: () => {}, ready: null };
      scenes.set(slide, rec);
      rec.ready = window.SV.bed(bedEl, { start: 1 }).then((b) => {
        rec.play = () => b.play(1, 3000, 0);
        rec.settle = () => b.set(1);
        bedEl.classList.add('is-drawn');
      }).catch(() => { bedEl.querySelector('.bed-fallback')?.setAttribute('data-failed', ''); });
    }
  };
  const playScene = (slide) => {
    const rec = scenes.get(slide);
    if (!rec) return;
    if (reducedNow()) { rec.settle(); return; }
    if (rec.ready) rec.ready.then(() => rec.play()); else rec.play();
  };

  /* ---- lazy media: only the neighbours of the visible slide are fetched ---- */
  const hydrate = (slide) => {
    if (!slide) return;
    slide.querySelectorAll('img[data-src]').forEach((img) => {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    });
    mountScene(slide);
  };
  const hydrateAround = (i) => {
    const run = () => { hydrate(slides[(i + 1) % slides.length]); hydrate(slides[(i - 1 + slides.length) % slides.length]); };
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 400);
  };

  /* ---- shared-element name: only the active slide's composition may carry it ---- */
  const nameActive = () => {
    stage.querySelectorAll('[data-exhibit]').forEach((el) => { el.style.viewTransitionName = ''; });
    const el = slides[index].querySelector('[data-exhibit]');
    if (el) el.style.viewTransitionName = 'exhibit';
  };

  const apply = (next, dir) => {
    const prev = slides[index];
    index = (next + slides.length) % slides.length;
    const slide = slides[index];
    hydrate(slide);
    if (prev !== slide) playScene(slide);
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === index);
      s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      s.querySelector('.enter').tabIndex = i === index ? 0 : -1;
    });
    if (prev !== slide && !reduce.matches) {
      prev.classList.add('is-leaving');
      slide.classList.toggle('rev', dir < 0);
      slide.classList.add('is-entering');
      busy = true;
      const done = () => { prev.classList.remove('is-leaving'); slide.classList.remove('is-entering', 'rev'); busy = false; };
      setTimeout(done, 1500);
    }
    document.body.dataset.tone = slide.dataset.tone;
    ticks.forEach((t, i) => (i === index ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
    if (cur) cur.textContent = String(index + 1).padStart(2, '0');
    if (live) live.textContent = slide.getAttribute('aria-label');
    nameActive();
    try { history.replaceState(null, '', index === 0 ? location.pathname : '#' + slugs[index]); } catch {}
    hydrateAround(index);
  };
  const go = (n, dir) => { if (!busy && n !== index) apply(n, dir ?? (n > index ? 1 : -1)); };
  const step = (d) => { if (!busy) apply(index + d, d); };

  stage.querySelector('[data-next]').addEventListener('click', () => step(1));
  stage.querySelector('[data-prev]').addEventListener('click', () => step(-1));
  ticks.forEach((t) => t.addEventListener('click', () => go(+t.dataset.go)));

  /* keyboard (skipped while the project index is open) */
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { step(1); }
    else if (e.key === 'ArrowLeft') { step(-1); }
    else if (e.key === 'Enter' && e.target === document.body) { slides[index].querySelector('.enter').click(); }
  });

  /* touch / pen swipe; vertical scrolling is untouched (touch-action: pan-y) */
  let sx = 0, sy = 0, tracking = false;
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || e.target.closest('a,button')) return; tracking = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener('pointerup', (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { tracking = false; });

  /* restrained pointer depth: transform only, fine pointers only */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce.matches) {
    let raf = 0;
    stage.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = stage.getBoundingClientRect();
        stage.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        stage.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    }, { passive: true });
  }

  /* deep link: /#wealthwithsg opens that slide; bfcache/back restore keeps the state */
  const fromHash = () => {
    const i = slugs.indexOf(location.hash.slice(1));
    if (i >= 0 && i !== index) apply(i, 1);
  };
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('pageshow', (e) => { if (e.persisted) nameActive(); });
  slides.forEach((s, i) => { s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'); if (i) s.querySelector('.enter').tabIndex = -1; else s.querySelector('.enter').tabIndex = 0; });
  document.body.dataset.tone = slides[0].dataset.tone;
  fromHash();
  nameActive();
  hydrate(slides[index]);
  if (index !== 0 || slugs[0] !== 'reclaim') playScene(slides[index]);
  hydrateAround(index);
})();
