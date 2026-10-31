/* sankalpvoid — shared behaviour: reveals, header tint, image state, the full-screen project index, media hygiene. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  root.classList.remove('no-js');

  /* WebKit can retain a native range begun at a text node across nonselectable
     display content. Cancel selection itself, not ordinary pointer input:
     sliders, buttons, links and editable/copyable content retain their defaults. */
  const selectable = (node) => {
    const el = node instanceof Element ? node : node && node.parentElement;
    return !!(el && el.closest('input,textarea,select,[contenteditable="true"],.sel'));
  };
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || selectable(e.target)) return;
    const el = e.target instanceof Element ? e.target : e.target.parentElement;
    // Cancel native text-selection initiation before WebKit enters its drag
    // tracking mode; interactive elements keep native focus and activation.
    if (!el.closest('a,button,input,textarea,select,summary,[role="button"],[tabindex]')) e.preventDefault();
  }, true);
  document.addEventListener('selectstart', (e) => {
    if (!selectable(e.target)) e.preventDefault();
  }, true);
  document.addEventListener('dragstart', (e) => {
    if (!selectable(e.target)) e.preventDefault();
  }, true);
  const clearDisplaySelection = (e) => {
    if (selectable(e.target)) return;
    const selection = getSelection();
    if (selection && selection.rangeCount) selection.removeAllRanges();
  };
  document.addEventListener('pointerup', clearDisplaySelection, true);
  document.addEventListener('pointercancel', clearDisplaySelection, true);
  document.querySelectorAll('img,a').forEach((el) => {
    if (!selectable(el)) el.setAttribute('draggable', 'false');
  });

  /* ---- reveals: opt in only once the observer exists; always fail open ---- */
  if ('IntersectionObserver' in window && !reduce.matches) {
    root.classList.add('js-motion');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));
    setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.1 && r.bottom > -50) el.classList.add('in');
    }), 1500);
  }

  /* ---- header colour follows the section beneath it ---- */
  const tinted = document.querySelectorAll('[data-chrome]');
  if (tinted.length && 'IntersectionObserver' in window) {
    const on = new Set();
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? on.add(e.target) : on.delete(e.target)));
      document.body.classList.toggle('chrome-light', on.size > 0);
    }, { rootMargin: '0px 0px -94% 0px' });
    tinted.forEach((el) => cio.observe(el));
  }

  /* ---- arrival: settle the lens hand-off overlay once the page's own hero is ready (see lens.js / arrive.js) ---- */
  if (document.documentElement.classList.contains('is-arriving')) {
    const root = document.documentElement;
    const hero = document.querySelector('.hero img, .hero .sc img');
    const ready = (hero && hero.decode ? hero.decode().catch(() => {}) : Promise.resolve());
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([ready, fonts]), new Promise((r) => setTimeout(r, 1800))]).then(() => requestAnimationFrame(() => {
      root.classList.add('is-settling');
      setTimeout(() => root.classList.remove('is-arriving', 'is-settling'), 1100);
    }));
  }

  /* ---- image load state ---- */
  document.querySelectorAll('.media img').forEach((img) => {
    const done = () => img.classList.add('loaded');
    if (img.complete) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* ================================================================ full-screen project index
     One implementation for the /projects/ page and the overlay opened from any page.
     - hover (mouse) or keyboard focus previews a project as the full-viewport background
     - previews are race-safe: only the latest request may paint, so rapid movement never shows a stale image
     - touch: tapping a title only selects and previews it; a visible "Open <project>" button always shows what will open (no hidden double-tap) */
  const mountIndex = (host) => {
    const items = [...host.querySelectorAll('.idx__item')];
    const layers = [...host.querySelectorAll('.idx__bg')];
    const enter = host.querySelector('[data-idx-enter]');
    const coarse = matchMedia('(hover: none), (pointer: coarse)');
    const cache = new Map();
    const load = (url) => {
      if (!cache.has(url)) cache.set(url, new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = i.onerror = () => res(); i.src = url; }));
      return cache.get(url);
    };
    let token = 0, shown = null, front = 0, pointerIn = false;
    const list = host.querySelector('.idx__list');
    host.dataset.active = '';
    const activate = (li) => {
      if (!li || li === shown) return;
      const mine = ++token;
      shown = li;
      items.forEach((x) => x.classList.toggle('is-active', x === li));
      host.classList.add('has-active');
      if (enter) {
        const a = li.querySelector('.idx__a');
        enter.querySelector('[data-idx-name]').textContent = li.dataset.name || li.querySelector('.idx__t').textContent;
        enter.querySelector('a').href = a.href;
        enter.classList.add('is-ready');
      }
      load(li.dataset.bg).then(() => {
        if (mine !== token || !layers.length) return;         /* stale: a newer preview was requested */
        const next = layers[1 - front], cur = layers[front];
        next.style.backgroundImage = `url(${li.dataset.bg})`;
        next.classList.add('is-on'); cur.classList.remove('is-on');
        front = 1 - front; host.dataset.active = li.dataset.slug;
      });
    };
    /* back to the neutral state: solid background, every title outlined */
    const rest = () => {
      if (!shown) return;
      token++; shown = null;
      items.forEach((x) => x.classList.remove('is-active'));
      layers.forEach((l) => l.classList.remove('is-on'));
      host.classList.remove('has-active'); host.dataset.active = '';
      if (enter) enter.classList.remove('is-ready');
    };
    const handlers = [];
    const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); handlers.push(() => el.removeEventListener(ev, fn, opt)); };
    const focusInside = () => list.contains(document.activeElement) && document.activeElement.matches(':focus-visible, .idx__a');
    on(list, 'pointerleave', (e) => { if (e.pointerType !== 'mouse') return; pointerIn = false; if (!focusInside()) rest(); });
    on(list, 'pointerenter', (e) => { if (e.pointerType === 'mouse') pointerIn = true; });
    /* the pointer previews only while it is over a title; in the gaps (or the margins) the list rests, unless a title holds keyboard focus */
    on(list, 'pointermove', (e) => { if (e.pointerType !== 'mouse') return; const a = e.target.closest('.idx__a'); if (a) activate(a.closest('.idx__item')); else if (!focusInside()) rest(); });
    on(list, 'focusout', (e) => { if (coarse.matches) return; if (!list.contains(e.relatedTarget) && !pointerIn) rest(); });
    if (window.SVTitleFX) items.forEach((li) => SVTitleFX.attach(li.querySelector('.idx__t')));
    items.forEach((li, i) => {
      const a = li.querySelector('.idx__a');
      on(a, 'focus', () => activate(li));
      on(a, 'click', (e) => { if (coarse.matches) { e.preventDefault(); activate(li); } });
      on(a, 'keydown', (e) => {
        const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        items[(i + d + items.length) % items.length].querySelector('.idx__a').focus();
      });
    });
    const syncEnter = () => { if (enter) enter.hidden = !coarse.matches; };
    syncEnter(); on(coarse, 'change', syncEnter);
    /* warm the first previews quietly */
    const warm = () => items.slice(0, 3).forEach((li) => load(li.dataset.bg));
    'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 800 }) : setTimeout(warm, 400);
    return () => { handlers.forEach((h) => h()); token++; };
  };

  const pageIdx = document.querySelector('[data-idx-page]');
  if (pageIdx) mountIndex(pageIdx);

  const triggers = [...document.querySelectorAll('[data-open-index]')];
  if (triggers.length && typeof HTMLDialogElement === 'function') {
    let dlg = null, pending = null, lastTrigger = triggers[0], unmount = null, savedY = 0;
    const make = async () => {
      const res = await fetch('/projects/', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('index unavailable');
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const list = doc.querySelector('.idx__list');
      if (!list) throw new Error('index missing');
      dlg = document.createElement('dialog');
      dlg.className = 'idx idx--dialog';
      dlg.setAttribute('aria-label', 'All projects');
      dlg.innerHTML =
        '<div class="idx__bgs" aria-hidden="true"><span class="idx__bg" data-layer="a"></span><span class="idx__bg" data-layer="b"></span><span class="idx__scrim"></span></div>' +
        '<div class="idx__top"><a class="wordmark" href="/" aria-label="sankalpvoid — gallery"><b>sankalpvoid</b><span>← Gallery</span></a><nav aria-label="More"><a href="/archive/">Archive</a><a href="/profile/">Profile</a><a href="/contact/">Contact</a></nav></div>' +
        '<p class="idx__label mono">All projects · <span class="fine">hover or focus a title to preview it</span><span class="coarse">tap a title to preview, then Open</span></p>' +
        '<p class="idx__enter" data-idx-enter hidden><span class="mono">Tap a title to preview it</span><a href="#" class="idx__go"><span>Open</span> <b data-idx-name></b> <i aria-hidden="true">↗</i></a></p>' +
        '<button class="idx__close" type="button" autofocus><span class="idx__ring" aria-hidden="true"></span>Close<span class="sr-only"> project index</span></button>';
      dlg.insertBefore(list.cloneNode(true), dlg.querySelector('.idx__enter'));
      document.body.appendChild(dlg);
      dlg.querySelector('.idx__close').addEventListener('click', () => dlg.close());
      dlg.addEventListener('close', () => {
        root.classList.remove('is-locked');
        triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
        scrollTo(0, savedY);                                   /* the page behind never moves */
        lastTrigger.focus({ preventScroll: true });
      });
      return dlg;
    };
    const build = () => (pending = pending || make().catch((err) => { pending = null; throw err; }));
    const open = async (e, from) => {
      e && e.preventDefault();
      if (from) lastTrigger = from;
      if (location.pathname === '/projects/') return;
      try {
        const d = await build();
        if (d.open) return;
        savedY = scrollY;
        root.classList.add('is-locked');
        d.showModal();
        if (!unmount) unmount = mountIndex(d);
        lastTrigger.setAttribute('aria-expanded', 'true');
        d.querySelector('.idx__close').focus({ preventScroll: true });   /* the overlay opens neutral: nothing is previewed until a title is hovered or focused */
      } catch { location.href = '/projects/'; }
    };
    triggers.forEach((t) => {
      t.setAttribute('aria-haspopup', 'dialog');
      t.setAttribute('aria-expanded', 'false');
      t.addEventListener('click', (e) => open(e, t));
      t.addEventListener('pointerenter', () => build().catch(() => {}), { once: true });
      t.addEventListener('focus', () => build().catch(() => {}), { once: true });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName) && !(dlg && dlg.open)) open(e, document.activeElement && triggers.includes(document.activeElement) ? document.activeElement : triggers[0]);
    });
    addEventListener('pagehide', () => { if (unmount) unmount(); });
  }

  /* ---- pause any playing media when its page is hidden ---- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('video,audio').forEach((m) => m.pause());
  });
})();
