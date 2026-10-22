/* Furnishers exhibition: scroll-linked line→furniture sequence. Native scroll only; reduced-motion gets a static contact sheet. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const sec = document.querySelector('[data-seq]');
  if (!sec) return;
  if (reduce.matches) { document.documentElement.classList.add('rm'); sec.querySelectorAll('img[loading]').forEach((i) => i.removeAttribute('loading')); return; }
  const frames = [...sec.querySelectorAll('.f')];
  const step = sec.querySelector('[data-seq-step]');
  const text = sec.querySelector('[data-seq-text]');
  const bar = sec.querySelector('[data-seq-bar]');
  const n = frames.length;
  const captions = [
    'Vertical hairlines. Nothing is a bed yet; it is only measurement.',
    'The lines gather and lengthen, like timber laid out on a floor.',
    'A rhythm of slats appears: the headboard, before anything else.',
    'The whole bed, drawn in one weight of line.',
    'Mattress and bedding fill in above the outlined frame.',
    'The render is revealed through an organic window.',
    'The finished studio render. A placeholder until real photography exists.'
  ];
  let shown = -1, ticking = false;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const update = () => {
    ticking = false;
    const r = sec.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    const x = p * (n - 1);
    frames.forEach((f, i) => { f.style.opacity = clamp(1 - Math.abs(x - i)).toFixed(3); });
    const k = Math.round(x);
    if (k !== shown) { shown = k; step.textContent = `${String(k + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`; text.textContent = captions[k]; }
    bar.style.transform = `scaleX(${p.toFixed(3)})`;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  /* only listen while the section is near the viewport; warm the lazy frames on first approach */
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); update(); }
    else removeEventListener('scroll', onScroll);
  }, { rootMargin: '30% 0px' });
  io.observe(sec);
  const warm = new IntersectionObserver(([e]) => { if (e.isIntersecting) { frames.forEach((f) => f.removeAttribute('loading')); warm.disconnect(); } }, { rootMargin: '120% 0px' });
  warm.observe(sec);
  /* fetch the remaining frames quietly once the page is idle, so a jump straight to the sequence is never blank */
  const idle = () => frames.forEach((f) => f.removeAttribute('loading'));
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(idle, { timeout: 4000 }) : setTimeout(idle, 2500)));
  addEventListener('resize', onScroll);
  update();
})();
