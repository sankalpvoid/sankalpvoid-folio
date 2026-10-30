/* Title response: letters near the pointer lean away and swell a little, with a touch of variable-font weight, then spring back.
   A local, elastic lens rather than a hover scale. It never changes the text (a visually hidden copy stays for assistive technology; the
   animated letters are aria-hidden), keeps the title sharp and readable at rest (all transforms are removed when settled), and only runs
   for fine pointers without reduced motion. One shared loop that runs only while something is moving. */
(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const items = new Set();
  let raf = 0, last = 0, px = -1e4, py = -1e4, active = null;

  const split = (el) => {
    if (el.dataset.fx) return null;
    el.dataset.fx = '1';
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const chars = [];
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          [...n.textContent].forEach((c) => { if (c === ' ') { f.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'fx'; s.setAttribute('aria-hidden', 'true'); s.textContent = c; chars.push({ el: s, x: 0, y: 0, k: 0, w: 0 }); f.appendChild(s); });
          n.replaceWith(f);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(el);
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text; el.prepend(sr);
    return chars;
  };

  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const kf = 1 - Math.exp(-dt / 0.09);
    let moving = false;
    items.forEach((it) => {
      const box = it.el.getBoundingClientRect();
      const near = it === active && box.width > 0;
      const R = Math.max(70, box.height * 0.85);
      it.chars.forEach((c) => {
        let tx = 0, ty = 0, tk = 0, tw = 0;
        if (near) {
          const r = c.el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1, f = Math.exp(-Math.pow(d / R, 2) * 1.4);
          tx = (dx / d) * f * R * 0.16; ty = (dy / d) * f * R * 0.05; tk = f * 0.18; tw = f * 160;
        }
        c.x += (tx - c.x) * kf; c.y += (ty - c.y) * kf; c.k += (tk - c.k) * kf; c.w += (tw - c.w) * kf;
        const rest = Math.abs(c.x) + Math.abs(c.y) + Math.abs(c.k) * 40 + Math.abs(c.w) < 0.05;
        if (rest) { if (c.on) { c.el.style.transform = ''; c.el.style.fontVariationSettings = ''; c.on = false; } }
        else { moving = true; c.on = true; c.el.style.transform = `translate3d(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px,0) scale(${(1 + c.k).toFixed(3)})`; c.el.style.fontVariationSettings = `"wght" ${Math.round(400 + c.w)}`; }
      });
    });
    if (moving || active) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const attach = (el) => {
    if (!fine.matches || reduce.matches) return;
    const chars = split(el); if (!chars) return;
    const it = { el, chars }; items.add(it);
    el.addEventListener('pointerenter', () => { active = it; kick(); });
    el.addEventListener('pointerleave', () => { if (active === it) active = null; kick(); });
    el.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; active = it; kick(); }, { passive: true });
  };
  window.SVTitleFX = { attach };
  document.querySelectorAll('.sc-copy .t a').forEach(attach);
})();
