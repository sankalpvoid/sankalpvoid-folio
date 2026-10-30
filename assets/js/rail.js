/* Project pages: the rail's Next control and the story's closing panel bring in the NEXT project (shared order in projects.js, wrapping after
   the last) through the same lens transition used by the gallery. Closing returns to that project's slide in the gallery. */
(() => {
  const cur = document.body.dataset.project;
  const next = () => window.SVProjects && SVProjects.next(cur);
  const run = (e, el) => {
    const n = next(); if (!n || !window.SVLens) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    SVLens.go({ art: n.art, href: n.href, mode: 'fixed', x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  document.querySelectorAll('[data-next],[data-next-end]').forEach((el) => el.addEventListener('click', (e) => run(e, el)));
  const n = next(); if (n && window.SVLens) { SVLens.preload(n.art); }
})();
