/* Wires the project rail and the story's closing panel: both bring in the NEXT project (shared order in projects.js, wrapping after the last).
   The rail's corner handle can be dragged (diagonal peel); the large closing panel is click / Enter only so it never captures touch scrolling. */
(() => {
  if (!window.SVPeel || !window.SVProjects) return;
  const cur = document.body.dataset.project;
  const nextP = () => SVProjects.next(cur);
  const go = (t) => { location.href = t.href; };
  const opts = { target: () => { const n = nextP(); return { name: n.name, art: n.art, href: n.href }; }, page: () => document.getElementById('main'), commit: go, keep: true };
  document.querySelectorAll('[data-peel]').forEach((h) => SVPeel.attach(h, opts));
  document.querySelectorAll('[data-peel-next]').forEach((h) => SVPeel.attach(h, Object.assign({}, opts, { drag: false })));
})();
