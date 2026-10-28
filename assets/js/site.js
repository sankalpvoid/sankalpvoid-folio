/* sankalpvoid — shared behaviour: reveals, image states, project index overlay. */
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
      if (r.top < innerHeight * 1.1) el.classList.add('in');
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

  /* ---- image load state (fade in; failures stay visible with alt text) ---- */
  document.querySelectorAll('.media img').forEach((img) => {
    const done = () => img.classList.add('loaded');
    if (img.complete) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* ---- project index overlay (progressive enhancement of /projects/) ---- */
  const triggers = [...document.querySelectorAll('[data-open-index]')];
  if (triggers.length && typeof HTMLDialogElement === 'function') {
    let dlg = null;
    let pending = null;
    let lastTrigger = triggers[0];
    const build = () => (pending = pending || make().catch((err) => { pending = null; throw err; }));
    const make = async () => {
      const res = await fetch('/projects/', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('index unavailable');
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const list = doc.querySelector('[data-index-source]');
      if (!list) throw new Error('index missing');
      dlg = document.createElement('dialog');
      dlg.className = 'index';
      dlg.setAttribute('aria-label', 'All projects');
      dlg.innerHTML = '<div class="index__bar"><span class="mono">All projects</span><button class="index__close" type="button">Close <span class="sr-only">project index</span></button></div>';
      const clone = list.cloneNode(true);
      clone.querySelectorAll('img').forEach((i) => i.setAttribute('loading', 'lazy'));
      dlg.appendChild(clone);
      const foot = document.createElement('div');
      foot.className = 'index__foot';
      foot.innerHTML = '<a href="/">Home</a><a href="/about/">About</a><a href="/about/#music">Music</a><a href="/contact/">Contact</a><a href="https://github.com/sankalpvoid" rel="noreferrer" target="_blank">GitHub ↗</a>';
      dlg.appendChild(foot);
      document.body.appendChild(dlg);
      dlg.querySelector('.index__close').addEventListener('click', () => dlg.close());
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', () => {
        triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
        lastTrigger.focus({ preventScroll: true });
      });
      return dlg;
    };
    const open = async (e, from) => {
      e.preventDefault();
      if (from) lastTrigger = from;
      try { const d = await build(); d.showModal(); lastTrigger.setAttribute('aria-expanded', 'true'); }
      catch { location.href = '/projects/'; }
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
  }

  /* ---- pause any playing media when its page is hidden or scrolled away ---- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('video,audio').forEach((m) => m.pause());
  });
})();
