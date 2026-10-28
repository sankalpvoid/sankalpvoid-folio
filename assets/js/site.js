/* sankalpvoid — shared behaviour: reveals, header tint, image state, the full-screen project index, media hygiene. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  root.classList.remove('no-js');

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

  /* ---- image load state ---- */
  document.querySelectorAll('.media img').forEach((img) => {
    const done = () => img.classList.add('loaded');
    if (img.complete) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* ================================================================ full-screen project index
     One implementation for the /projects/ page and the overlay opened from any page.
     - hover (mouse) or keyboard focus previews a project as the full-viewport background
     - previews are race-safe: only the latest request may paint, so rapid movement never shows a stale image
     - touch: tapping a title previews it; a separate "Enter" control opens it (no double-tap) */
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
    let token = 0, shown = null, front = 0;
    const activate = (li) => {
      if (!li || li === shown) return;
      const mine = ++token;
      shown = li;
      items.forEach((x) => x.classList.toggle('is-active', x === li));
      if (enter) {
        const a = li.querySelector('.idx__a');
        enter.querySelector('[data-idx-name]').textContent = li.querySelector('.idx__t').textContent;
        enter.querySelector('a').href = a.href;
      }
      load(li.dataset.bg).then(() => {
        if (mine !== token || !layers.length) return;         /* stale: a newer preview was requested */
        const next = layers[1 - front], cur = layers[front];
        next.style.backgroundImage = `url(${li.dataset.bg})`;
        next.classList.add('is-on'); cur.classList.remove('is-on');
        front = 1 - front; host.dataset.active = li.dataset.slug;
      });
    };
    const handlers = [];
    const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); handlers.push(() => el.removeEventListener(ev, fn, opt)); };
    items.forEach((li, i) => {
      const a = li.querySelector('.idx__a');
      on(li, 'pointerenter', (e) => { if (e.pointerType === 'mouse') activate(li); });
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
    activate(items[0]);
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
        '<div class="idx__bgs" aria-hidden="true"><span class="idx__bg is-on" data-layer="a"></span><span class="idx__bg" data-layer="b"></span><span class="idx__scrim"></span></div>' +
        '<div class="idx__top"><a class="wordmark" href="/" aria-label="sankalpvoid — gallery"><b>sankalpvoid</b><span>← Gallery</span></a><nav aria-label="More"><a href="/archive/">Archive</a><a href="/profile/">Profile</a><a href="/contact/">Contact</a></nav></div>' +
        '<p class="idx__label mono">All projects · hover, or focus with the keyboard</p>' +
        '<p class="idx__enter" data-idx-enter hidden><span class="mono">Selected</span><a href="#" class="idx__go"><b data-idx-name></b> <i aria-hidden="true">↗</i></a></p>' +
        '<button class="idx__close" type="button"><span class="idx__ring" aria-hidden="true"></span>Close<span class="sr-only"> project index</span></button>';
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
        d.querySelector('.idx__a').focus({ preventScroll: true });
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
