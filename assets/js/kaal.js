/* Kaal's crow, as a browser encounter. Uses the app's real runtime art (canonical sheet + animation strips, frame order and the feet anchor
   (128, 243) from the app's own sheet/strip contracts) and a faithful adaptation of its click rules (CLICK_GAP 450 ms, settle 2.5 s):
     - quiet idle, an occasional blink, now and then a small life of its own (preen, scratch, wing stretch);
     - the pointer approaching only makes it attentive (it never moves the bird);
     - one click: the bird notices, then ruffles; a quick double click: it flinches; three or more quick clicks: it takes off with the
       full wing-beat strip, lands somewhere else on the perch and settles for a moment (clicks only flinch while it settles);
     - then it returns to the same idle pose.
   Contained in its stage. Pauses offscreen and when the tab is hidden. Reduced motion: no timers, no loops, still poses on request.
   This is the portfolio's browser interaction using Kaal's artwork and behaviour rules, not the installed desktop app; there is no audio. */
(() => {
  const host = document.querySelector('[data-kaal-presence]');
  if (!host) return;
  const stage = host.querySelector('[data-crow-stage]');
  const cv = host.querySelector('.kaal-canvas');
  const sprite = host.querySelector('.kaal-sprite');
  const hint = host.querySelector('[data-crow-hint]');
  const btn = host.querySelector('[data-crow-prompt]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const CELL = 256, ANCHOR = { x: 128, y: 243 }, CLICK_GAP = 450, SETTLE = 2500;
  const BASE = '/assets/img/kaal/crow/';
  const SHEET = { idle: 0, alert: 3, listening: 4, attentive: 5, watch: 6 };            /* cell index in the 4x5 canonical sheet */
  const STRIPS = {
    blink: { n: 5, ms: [60, 45, 70, 55, 80] },
    ruffle: { n: 6, ms: [100, 90, 90, 90, 110, 120] },
    preen: { n: 10, ms: [140, 160, 180, 130, 130, 130, 130, 170, 160, 140], rep: [3, 6, 1, 3] },
    scratch: { n: 8, ms: [120, 140, 150, 80, 80, 140, 130, 140], rep: [3, 4, 2, 4] },
    stretch: { n: 8, ms: [120, 120, 130, 140, 420, 140, 130, 140] },
    flap: { n: 8, ms: Array(8).fill(1000 / 14), loop: true }
  };
  const WORDS = { ruffle: 'It ruffles its feathers.', preen: 'It preens.', scratch: 'It scratches.', stretch: 'It stretches a wing.', flinch: 'It flinches.', fly: 'It takes off and lands somewhere else.', notice: 'It notices you.' };
  const imgs = {}; let loaded = false, loading = false;
  let ctx = null, W = 0, H = 0, dpr = 1;
  let cur = { cell: SHEET.idle }, strip = null, raf = 0, facing = 1, hover = false, visible = false, feetX = 0.62, lift = 0;
  let timers = new Set(), clicks = 0, lastClick = 0, seqTimer = 0, settledUntil = 0, rotation = 0, flight = null, flightLock = false;
  const rng = Math.random;
  const later = (f, ms) => { const t = setTimeout(() => { timers.delete(t); f(); }, ms); timers.add(t); return t; };
  const clearAll = () => { timers.forEach(clearTimeout); timers.clear(); clearTimeout(seqTimer); seqTimer = 0; cancelAnimationFrame(raf); raf = 0; };
  const say = (t) => { if (hint) hint.textContent = t; };

  const load = () => {
    if (loaded || loading) return Promise.resolve();
    loading = true;
    const names = ['sheet', ...Object.keys(STRIPS)];
    return Promise.all(names.map((n) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = `${BASE}${n}.webp`; imgs[n] = i; }))).then(() => {
      loaded = !!imgs.sheet.naturalWidth;
      if (loaded) { ctx = cv.getContext('2d'); cv.hidden = false; sprite.hidden = true; resize(); draw(); }
    });
  };
  const resize = () => {
    const r = stage.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  };
  const scale = () => (H * 0.84) / CELL;
  const feet = () => ({ x: W * feetX, y: H * 0.81 });
  const timeline = (name) => {
    const s = STRIPS[name], out = [];
    const times = s.rep ? s.rep[2] + Math.floor(rng() * (s.rep[3] - s.rep[2] + 1)) : 1;
    for (let i = 0; i < s.n; i++) {
      if (s.rep && i === s.rep[0]) { for (let k = 0; k < times; k++) for (let j = s.rep[0]; j <= s.rep[1]; j++) out.push({ f: j, ms: s.ms[j] }); i = s.rep[1]; }
      else out.push({ f: i, ms: s.ms[i] });
    }
    return out;
  };
  const draw = () => {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const sc = scale(), p = feet();
    let img, sx = 0;
    if (strip) { img = imgs[strip.name]; sx = strip.frame * CELL; }
    else { img = imgs.sheet; sx = (cur.cell % 4) * CELL; }
    const sy = strip ? 0 : Math.floor(cur.cell / 4) * CELL;
    if (!img || !img.naturalWidth) return;
    ctx.save(); ctx.translate(p.x, p.y - lift); ctx.scale(facing * sc, sc);
    ctx.drawImage(img, sx, sy, CELL, CELL, -ANCHOR.x, -ANCHOR.y, CELL, CELL);
    ctx.restore();
  };
  const frame = (now) => {
    raf = 0;
    if (!visible) return;
    if (strip) {
      const t = now - strip.t0; let acc = 0, f = strip.tl[strip.tl.length - 1].f;
      const total = strip.tl.reduce((a, e) => a + e.ms, 0), tt = STRIPS[strip.name].loop ? t % total : t;
      for (const e of strip.tl) { if (tt < acc + e.ms) { f = e.f; break; } acc += e.ms; }
      strip.frame = f;
      if (!STRIPS[strip.name].loop && t >= total) { const done = strip.done; strip = null; cur = { cell: SHEET.idle }; draw(); done && done(); schedule(); return; }
    }
    if (flight) {
      const k = Math.min(1, (now - flight.t0) / flight.ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      lift = Math.sin(Math.PI * k) * H * 0.22; feetX = flight.from + (flight.to - flight.from) * e;
      if (k >= 1) { lift = 0; flight = null; strip = null; cur = { cell: SHEET.idle }; flightLock = false; settledUntil = performance.now() + SETTLE; draw(); schedule(); return; }
    }
    draw();
    if (strip || flight) raf = requestAnimationFrame(frame);
  };
  const play = (name, done) => {
    if (!loaded || reduce.matches || !visible) return false;
    strip = { name, tl: timeline(name), t0: performance.now(), frame: 0, done };
    if (!raf) raf = requestAnimationFrame(frame);
    return true;
  };
  const pose = (cell) => { cur = { cell }; strip = null; draw(); };

  /* the bird's own small life; only when nothing else is happening */
  const schedule = () => {
    if (reduce.matches || !visible) return;
    timers.forEach(clearTimeout); timers.clear();
    later(() => { if (!strip && !flight && !hover && visible) play('blink'); schedule(); }, 2500 + rng() * 4000);
    later(() => { if (!strip && !flight && !hover && visible) play(['preen', 'scratch', 'stretch'][Math.floor(rng() * 3)]); }, 9000 + rng() * 6000);
  };

  /* click rules adapted from the app: a run of clicks resolves once the gap passes */
  const hit = (e) => {
    const r = stage.getBoundingClientRect(), p = feet(), sc = scale();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    return Math.abs(x - p.x) < 110 * sc && y < p.y - lift + 12 * sc && y > p.y - lift - 190 * sc;
  };
  const resolve = () => {
    seqTimer = 0; const n = clicks; clicks = 0;
    if (performance.now() < settledUntil) { say(WORDS.flinch); pose(SHEET.alert); later(() => pose(SHEET.idle), 400); return; }
    if (n >= 3) return fly();
    if (n === 2) { say(WORDS.flinch); pose(SHEET.alert); later(() => { pose(SHEET.idle); }, 380); return; }
    const name = ['ruffle', 'preen', 'scratch', 'stretch'][rotation++ % 4]; say(WORDS[name]);
    if (!play(name)) { still(name); }
  };
  const fly = () => {
    if (reduce.matches || !loaded || flightLock) return;
    flightLock = true; say(WORDS.fly);
    const to = Math.min(0.82, Math.max(0.28, feetX + (rng() < 0.5 ? -1 : 1) * (0.18 + rng() * 0.16)));
    strip = { name: 'flap', tl: timeline('flap'), t0: performance.now(), frame: 0 };
    flight = { t0: performance.now(), ms: 1500, from: feetX, to };
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const click = (e) => {
    if (flightLock) return;
    const now = performance.now();
    if (clicks > 0 && now - lastClick >= CLICK_GAP) resolve();
    clicks++; lastClick = now;
    if (clicks === 1) { say(WORDS.notice); pose(SHEET.watch); }
    clearTimeout(seqTimer); seqTimer = setTimeout(resolve, CLICK_GAP + 15);
  };
  /* reduced motion / explicit control: a still pose that stands for the action */
  const STILL = { ruffle: 13, preen: 6, scratch: 7, stretch: 3 };
  const still = (name) => { say(WORDS[name] + ' (still pose, motion reduced)'); pose([SHEET.alert, SHEET.attentive, SHEET.listening, SHEET.watch][rotation % 4]); later(() => pose(SHEET.idle), 1600); };

  stage.addEventListener('pointermove', (e) => {
    if (!ctx || e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect(), p = feet(); const near = Math.hypot(e.clientX - r.left - p.x, e.clientY - r.top - (p.y - 80)) < 300;
    stage.style.cursor = hit(e) ? 'pointer' : '';
    if (strip || flight) return;
    if (near && !hover) { hover = true; facing = (e.clientX - r.left) < p.x ? -1 : 1; if (!reduce.matches) pose(SHEET.attentive); }
    else if (!near && hover) { hover = false; pose(SHEET.idle); }
    else if (near) { const f = (e.clientX - r.left) < p.x ? -1 : 1; if (f !== facing) { facing = f; draw(); } }
  });
  stage.addEventListener('pointerleave', () => { if (hover) { hover = false; if (!strip && !flight) pose(SHEET.idle); } });
  stage.addEventListener('click', (e) => { if (ctx && hit(e)) click(e); });
  if (btn) btn.addEventListener('click', () => { if (!loaded) { load().then(() => click({})); return; } if (reduce.matches) { still(['ruffle', 'preen', 'scratch', 'stretch'][rotation++ % 4]); return; } click({}); });

  const io = new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting) && !document.hidden;
    if (visible) { load().then(() => { schedule(); draw(); }); } else clearAll();
  }, { rootMargin: '0px 60% 0px 60%' });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { visible = false; clearAll(); } else { const r = stage.getBoundingClientRect(); visible = r.right > 0 && r.left < innerWidth; if (visible) schedule(); } });
  addEventListener('resize', () => { if (loaded) { resize(); draw(); } });
  addEventListener('pagehide', clearAll);
  window.__crow = () => ({ loaded, strip: strip && strip.name, cell: cur.cell, flying: !!flight, clicks, visible, timers: timers.size, raf: !!raf, facing, hover });
})();
