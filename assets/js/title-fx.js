/* Title response: the whole title leans a few pixels toward the pointer (one element, one transform) and springs back. No per-letter motion,
   no text rewriting, nothing for assistive technology to repeat. Fine pointers and no reduced motion only; removed completely at rest. */
(() => {
  const ok = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = new Set(); let raf = 0, last = 0;
  const frame = (now) => {
    raf = 0; const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; const k = 1 - Math.exp(-dt / 0.14); let moving = false;
    items.forEach((it) => {
      it.x += (it.tx - it.x) * k; it.y += (it.ty - it.y) * k;
      if (Math.abs(it.x) + Math.abs(it.y) < 0.03 && !it.hot) { if (it.on) { it.el.style.transform = ''; it.on = false; } return; }
      moving = true; it.on = true; it.el.style.transform = `translate3d(${it.x.toFixed(2)}px,${it.y.toFixed(2)}px,0)`;
    });
    if (moving) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const attach = (el) => {
    if (!ok || el.__tfx) return; el.__tfx = true;
    const it = { el, x: 0, y: 0, tx: 0, ty: 0, on: false, hot: false }; items.add(it); el.style.willChange = 'transform';
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); it.hot = true; it.tx = ((e.clientX - r.left) / r.width - 0.5) * 14; it.ty = ((e.clientY - r.top) / r.height - 0.5) * 6; kick(); }, { passive: true });
    el.addEventListener('pointerleave', () => { it.hot = false; it.tx = it.ty = 0; kick(); });
  };
  window.SVTitleFX = { attach };
  document.querySelectorAll('.sc-copy .t a, [data-idx-page] .idx__t').forEach(attach);
})();
