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
