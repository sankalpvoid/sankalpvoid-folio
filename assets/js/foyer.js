/* Homepage: the orbit follows the thread being read; tiles hand their image to the exhibition they open. */
(() => {
  const ring = document.querySelector('[data-ring]');
  const items = [...document.querySelectorAll('.threads__list li')];
  if (ring && items.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) ring.dataset.active = e.target.dataset.i; });
    }, { rootMargin: '-40% 0px -45% 0px' });
    items.forEach((li) => io.observe(li));
  }

  /* The clicked tile's picture takes the shared name the exhibition's opening scene carries, so the page
     expands out of it (browsers without cross-document view transitions simply navigate). */
  document.querySelectorAll('[data-tile]').forEach((a) => {
    const name = () => { document.querySelectorAll('.t__img').forEach((i) => { i.style.viewTransitionName = ''; }); const img = a.querySelector('.t__img'); if (img) img.style.viewTransitionName = 'exhibit'; };
    a.addEventListener('click', name);
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter') name(); });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) document.querySelectorAll('.t__img').forEach((i) => { i.style.viewTransitionName = ''; }); });
})();
