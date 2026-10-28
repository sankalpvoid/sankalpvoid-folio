/* Portrait: subtle pointer response and, once a photograph is supplied via data-photo, a sketch-to-photo reveal.
   With no photo it stays a complete illustration. Reduced motion: no pointer effects, no reveal animation. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const setup = (el) => {
    if (el.dataset.ready) return; el.dataset.ready = '1';
    const dot = el.querySelector('.p-dot');
    const place = (t) => {          /* t: -0.5..0.5 along the orbit */
      if (!dot) return;
      const rx = +dot.dataset.rx, ry = +dot.dataset.ry, cx = +dot.dataset.cx, cy = +dot.dataset.cy;
      const a = Math.PI * (0.5 + t * 0.9);   /* an arc across the lower front of the ellipse */
      dot.setAttribute('cx', (cx + rx * Math.cos(a)).toFixed(1)); dot.setAttribute('cy', (cy + ry * Math.sin(a)).toFixed(1));
    };
    place(0.14);

    if (!reduce.matches && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      let raf = 0;
      const host = el.closest('[data-portrait-host]') || el;
      host.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = host.getBoundingClientRect();
          const x = clamp((e.clientX - r.left) / r.width - 0.5, -0.6, 0.6), y = clamp((e.clientY - r.top) / r.height - 0.5, -0.6, 0.6);
          el.style.setProperty('--px', x.toFixed(3)); el.style.setProperty('--py', y.toFixed(3));
          place(x * 0.6 + 0.14);
        });
      }, { passive: true });
    }
  };

  /* Photo support: set data-photo="/assets/img/portrait/portrait.jpg" on the .portrait element (see docs/PORTRAIT.md). */
  const loadPhoto = (el) => {
    const src = el.dataset.photo; if (!src) return;
    const img = el.querySelector('.portrait__photo'); if (!img || img.getAttribute('src') === src) return;
    img.addEventListener('load', () => {
      el.classList.add('has-photo');
      if (reduce.matches) { el.style.setProperty('--split', '100%'); return; }
      /* the photograph is drawn in from the left once, then follows a fine pointer across the frame */
      el.style.setProperty('--split', '0%');
      const t0 = performance.now(), dur = 1600;
      const tick = (now) => { const k = clamp((now - t0) / dur, 0, 1); el.style.setProperty('--split', (100 * (1 - Math.pow(1 - k, 3))).toFixed(1) + '%'); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
        el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); const v = clamp(((e.clientX - r.left) / r.width) * 100, 12, 100); el.style.setProperty('--split', v.toFixed(1) + '%'); }, { passive: true });
        el.addEventListener('pointerleave', () => el.style.setProperty('--split', '100%'));
      }
    }, { once: true });
    img.src = src;
  };

  const init = () => document.querySelectorAll('[data-portrait]').forEach((el) => { setup(el); loadPhoto(el); });
  window.SVPortrait = { refresh: init };
  init();
})();
