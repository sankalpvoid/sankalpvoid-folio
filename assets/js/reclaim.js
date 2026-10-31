/* Reclaim: "the evening". One phone, five beats. The story's own progress (HS) chooses the beat; the screens crossfade, the caption changes.
   The breathing recording is opt-in: it plays only when the visitor presses the button, inside the same phone. Flat pages show the beats as a list. */
(() => {
  const panel = document.querySelector('[data-rc-stage]');
  if (!panel) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const shots = [...panel.querySelectorAll('[data-screen]')];
  const pins = [...panel.querySelectorAll('[data-pin]')];
  const phone = panel.querySelector('.rcs__phone');
  const video = panel.querySelector('video');
  const btn = panel.querySelector('[data-vid-btn]');
  const k = panel.querySelector('[data-beat-k]'), t = panel.querySelector('[data-beat-title]'), x = panel.querySelector('[data-beat-text]');
  const BEATS = [
    ['An urge', 'An urge arrives.', 'The home screen leads with one question and one button, ahead of any counter.'],
    ['A small choice', 'A small choice.', 'Four small actions, no decision tree: box breathing, a five-minute wave, a water reset, a short walk. Or log the craving without an exercise.'],
    ['A small action', 'A small action.', 'Box breathing: inhale, hold, exhale, hold, four seconds each. The recording is the prototype itself.'],
    ['Feedback', 'It’s recorded.', 'Finishing logs the craving with the tool used. A one-tap “Did that help?” is optional and skippable. Everything is saved on the device and synced when you’re signed in.'],
    ['Returning later', 'You come back.', 'After a few rated cravings, a tool can be marked “Worked for you before”: a plain rule over the feedback you gave, not a validated or intelligent model. Sample data: four seeded cravings.']
  ];
  /* progress ranges -> screen index (0 home, 1 support, 2 inhale, 3 hold, 4 exhale, 5 feedback, 6 later) and beat */
  const at = (p) => (p < 0.17 ? [0, 0] : p < 0.34 ? [1, 1] : p < 0.47 ? [2, 2] : p < 0.58 ? [3, 2] : p < 0.69 ? [4, 2] : p < 0.84 ? [5, 3] : [6, 4]);
  let shown = -1, beat = -1;
  const stopVideo = () => { if (!video) return; video.pause(); phone.classList.remove('is-rec'); if (btn) { btn.textContent = 'Play the recording'; btn.setAttribute('aria-pressed', 'false'); } };
  const render = (p) => {
    const [s, b] = at(p);
    if (s !== shown) { shown = s; shots.forEach((el, i) => el.classList.toggle('is-on', i === s)); pins.forEach((el) => el.classList.toggle('is-on', +el.dataset.pin === s)); if (s !== 2 && s !== 3 && s !== 4) stopVideo(); }
    if (b !== beat) { beat = b; k.textContent = BEATS[b][0]; t.textContent = BEATS[b][1]; x.textContent = BEATS[b][2]; if (btn) btn.hidden = b !== 2; if (b !== 2) stopVideo(); }
  };
  if (window.HS) HS.on(panel, render);
  if (btn && video) btn.addEventListener('click', () => {
    if (!video.paused) { stopVideo(); return; }
    phone.classList.add('is-rec'); video.preload = 'auto'; video.play().catch(() => {});
    btn.textContent = 'Stop the recording'; btn.setAttribute('aria-pressed', 'true');
  });
  if (video) video.addEventListener('ended', stopVideo);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopVideo(); });
  render(0);
})();
