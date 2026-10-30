/* Arrival: runs in <head>, before first paint. If the visitor came through a lens hand-off (see lens.js), the same artwork is painted as a
   full-screen overlay at the zoom where the lens ended, so the new document begins on the frame the old one finished on. site.js then
   settles it (scale to 1, fade) once the page's own hero is decoded. A timeout guarantees it can never stay on screen. */
(() => {
  try {
    const raw = sessionStorage.getItem('sv-arrive');
    if (!raw) return;
    sessionStorage.removeItem('sv-arrive');
    const a = JSON.parse(raw);
    if (!a || !a.art || Date.now() - a.t > 8000 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = document.documentElement;
    r.style.setProperty('--arr-art', `url(${a.art})`);
    r.style.setProperty('--arr-x', Math.round((a.x / innerWidth) * 100) + '%');
    r.style.setProperty('--arr-y', Math.round((a.y / innerHeight) * 100) + '%');
    r.classList.add('is-arriving');
    setTimeout(() => r.classList.remove('is-arriving', 'is-settling'), 4500);
  } catch (e) { /* no storage: nothing to continue from */ }
})();
