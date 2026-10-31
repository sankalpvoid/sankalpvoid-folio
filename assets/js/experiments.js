/* Experiments: live studies load only on request and are unloaded when closed. */
(() => {
  let open = null;
  const close = (rec, restore = true) => {
    if (!rec) return;
    rec.slot.hidden = true;
    rec.slot.replaceChildren();
    document.documentElement.classList.remove('is-locked');           /* removes the iframe: stops its scripts, timers and media */
    if (restore) rec.btn.focus({ preventScroll: true });
    rec.btn.setAttribute('aria-expanded', 'false');
    rec.btn.textContent = 'Try it here';
    if (open === rec) open = null;
  };
  document.querySelectorAll('[data-live]').forEach((btn) => {
    const slot = document.querySelector('[data-live-slot]');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      if (open && open.btn === btn) return close(open);
      close(open, false);
      const rec = { btn, slot };
      slot.innerHTML = `<div class="live__bar"><span class="mono">Live · ${btn.dataset.title.replace(' live study', '')}</span><button type="button">Close preview</button></div><div class="live__box"><div class="live__load" role="status">Loading the live study…</div></div>`;
      const box = slot.querySelector('.live__box');
      const f = document.createElement('iframe');
      f.title = btn.dataset.title;
      f.src = btn.dataset.live;
      f.setAttribute('allow', 'fullscreen');
      f.referrerPolicy = 'no-referrer';
      f.addEventListener('load', () => slot.querySelector('.live__load')?.remove());
      box.appendChild(f);
      slot.querySelector('button').addEventListener('click', () => close(rec));
      slot.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.textContent = 'Close preview';
      open = rec;
      document.documentElement.classList.add('is-locked');
    });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(open); });
  addEventListener('pagehide', () => close(open, false));
})();

/* state swap under each study image */
document.querySelectorAll('[data-swap]').forEach((fig) => {
  const imgs = [...fig.querySelectorAll('.swap__i')], btns = [...fig.querySelectorAll('[data-swap-to]')];
  btns.forEach((b) => b.addEventListener('click', () => {
    const k = +b.dataset.swapTo;
    imgs.forEach((im, i) => { im.hidden = i !== k; });
    btns.forEach((x, i) => x.setAttribute('aria-pressed', String(i === k)));
  }));
});

/* Study A: scroll as a sequence. The story's own progress through this panel chooses the captured frame (0, 1,100 and 2,200 px). */
(() => {
  const panel = document.querySelector('[data-exp-scroll]');
  if (panel && window.HS) {
    const imgs = [...panel.querySelectorAll('.exps__imgs img')], px = panel.querySelector('[data-exp-px]');
    let cur = -1;
    HS.on(panel, (p) => {
      const i = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
      if (i !== cur) { cur = i; imgs.forEach((el, k) => el.classList.toggle('is-on', k === i)); }
      px.textContent = Math.round(p * 2200).toLocaleString('en-US');
    });
  }
  /* Study B: pointer as depth. A lens of the "pointer moved" capture follows the pointer over the "at rest" capture. */
  const d = document.querySelector('[data-expd]');
  if (d && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    let raf = 0, tx = 50, ty = 50, cx = 50, cy = 50;
    const step = () => { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; d.style.setProperty('--mx', cx.toFixed(2) + '%'); d.style.setProperty('--my', cy.toFixed(2) + '%'); raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(step) : 0; };
    d.addEventListener('pointermove', (e) => { const r = d.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100; if (!raf) raf = requestAnimationFrame(step); });
  }
  /* Study C: timeline as orchestration. */
  const t = document.querySelector('[data-exp-time]');
  if (t) {
    const imgs = [...t.querySelectorAll('.expt__fig img')], input = t.querySelector('[data-exp-time-in]');
    input.addEventListener('input', () => { const i = +input.value > 50 ? 1 : 0; imgs.forEach((el, k) => el.classList.toggle('is-on', k === i)); });
  }
})();
