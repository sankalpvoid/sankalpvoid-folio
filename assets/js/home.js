/* Gallery entrance: discrete, keyboard/touch/pointer friendly stage. No scroll hijacking. */
(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const slides = [...stage.querySelectorAll('.slide')];
  const cur = stage.querySelector('[data-cur]');
  const live = stage.querySelector('[data-live]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const slugs = slides.map((s) => s.dataset.slug);
  let index = 0;
  let busy = false;
  let settle = null; /* finishes the in-flight transition immediately */
  const reducedNow = () => reduce.matches;

  /* ---- scenes: charts and the traced bed are built lazily, once per slide ---- */
  const scenes = new Map();
  const mountScene = (slide) => {
    if (!slide || scenes.has(slide) || !window.SV) return;
    const chartEl = slide.querySelector('[data-chart-env]');
    const bedEl = slide.querySelector('[data-bed]');
    const noteEl = slide.querySelector('[data-note]');
    if (chartEl) {
      const c = window.SV.chart(chartEl, { start: 1 });
      scenes.set(slide, { play: () => c.play(1, 2800, 0), settle: () => c.set(1) });
    } else if (noteEl && window.SV) {
      const n = window.SV.note(noteEl, { start: 58 });
      if (matchMedia('(hover:hover) and (pointer:fine)').matches) n.follow(slide);
      scenes.set(slide, { play: () => n.play(58, 3200, 0), settle: () => n.set(58) });
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

  const apply = (next, dir, instant) => {
    const prev = slides[index];
    index = (next + slides.length) % slides.length;
    const slide = slides[index];
    hydrate(slide);
    if (prev !== slide) playScene(slide);
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === index);
      s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      s.querySelectorAll('.enter,[data-enter]').forEach((a) => { a.tabIndex = i === index ? 0 : -1; });
    });
    if (prev !== slide && !reduce.matches && !instant) {
      prev.classList.add('is-leaving');
      slide.classList.toggle('rev', dir < 0);
      slide.classList.add('is-entering');
      busy = true;
      let timer = 0;
      const done = () => { clearTimeout(timer); prev.classList.remove('is-leaving'); slide.classList.remove('is-entering', 'rev'); busy = false; settle = null; };
      settle = done;
      timer = setTimeout(done, 1500);
    }
    document.body.dataset.tone = slide.dataset.tone;
    if (cur) cur.textContent = String(index + 1).padStart(2, '0');
    if (live) live.textContent = slide.getAttribute('aria-label');
    nameActive();
    try { history.replaceState(null, '', index === 0 ? location.pathname : '#' + slugs[index]); } catch {}
    hydrateAround(index);
  };
  const go = (n, dir) => { if (busy && settle) settle(); if (n !== index) apply(n, dir ?? (n > index ? 1 : -1)); };
  const step = (d, instant) => { if (busy && settle) settle(); apply(index + d, d, instant); };

  /* ---- entry to the CURRENT project ----
     Click / tap / Enter on the title or the Enter action runs the lens transition by itself; a deliberate hold on the artwork does the same
     under the finger (lens.js). Arrows change which project is selected; nothing here ever moves to the next project by itself. */
  const proj = () => window.SVProjects && window.SVProjects.get(slugs[index]);
  const enterNow = (x, y) => {
    const p = proj(); if (!p || !window.SVLens) return false;
    SVLens.go({ art: p.art, href: p.href, mode: 'host', host: slides[index], x, y });
    return true;
  };
  stage.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-enter], a.enter');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    if (!a.closest('.slide.is-active')) return;
    if (window.SVLens && !reduce.matches) { e.preventDefault(); const r = a.getBoundingClientRect(); enterNow(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2); }
  });
  let holdCtl = null, hx = 0, hy = 0, hid = null;
  const stopHold = () => { if (holdCtl) { holdCtl.cancel(); holdCtl = null; } hid = null; };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !e.isPrimary || reduce.matches || !window.SVLens || SVLens.busy) return;
    if (e.target.closest('a,button,.controls,.chrome')) return;
    const p = proj(); if (!p) return;
    hx = e.clientX; hy = e.clientY; hid = e.pointerId;
    holdCtl = SVLens.hold({ art: p.art, href: p.href, mode: 'host', host: slides[index], x: hx, y: hy });
  });
  stage.addEventListener('pointermove', (e) => {
    if (!holdCtl || e.pointerId !== hid) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { stopHold(); return; }
    if (Math.hypot(e.clientX - hx, e.clientY - hy) > 14) { stopHold(); return; }   /* a swipe, not a hold */
    holdCtl.move(e.clientX, e.clientY);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => stage.addEventListener(t, stopHold));
  addEventListener('blur', stopHold);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopHold(); });
  stage.addEventListener('contextmenu', (e) => { if (holdCtl) e.preventDefault(); });

  stage.querySelector('[data-next]').addEventListener('click', () => step(1));
  stage.querySelector('[data-prev]').addEventListener('click', () => step(-1));

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
  slides.forEach((s, i) => { s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'); s.querySelectorAll('.enter,[data-enter]').forEach((a) => { a.tabIndex = i === 0 ? 0 : -1; }); });
  document.body.dataset.tone = slides[0].dataset.tone;
  fromHash();
  nameActive();
  hydrate(slides[index]);
  if (index !== 0 || slugs[0] !== 'reclaim') playScene(slides[index]);
  hydrateAround(index);
})();
