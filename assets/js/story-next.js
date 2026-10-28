/* The final chapter of every story: a link to the next exhibition that can be pressed and dragged to unroll (see unroll.js). */
(() => {
  const a = document.querySelector('[data-next-unroll]');
  if (!a || !window.SVUnroll) return;
  SVUnroll.attach(a, { bg: a.dataset.bg, name: a.dataset.name });
})();
