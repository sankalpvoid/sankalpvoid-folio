/* WealthWithSG exhibition: illustrative noise→structure chart, a scrubber, and the live-frame stepper.
   All numbers are generated (seeded) and illustrative; nothing here is market data. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1200, H = 560;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  function build(svg, count) {
    const r = rng(7);
    let p = 48; const bars = [];
    for (let i = 0; i < count; i++) {
      const o = p, c = o + (r() - 0.4) * 8 + 0.55;
      bars.push({ o, c, h: Math.max(o, c) + r() * 3.4, l: Math.min(o, c) - r() * 3.4 });
      p = c;
    }
    const lo = Math.min(...bars.map((b) => b.l)), hi = Math.max(...bars.map((b) => b.h));
    const padX = 60, top = 70, bot = H - 70;
    const x = (i) => padX + (i / (count - 1)) * (W - padX * 2);
    const y = (v) => bot - ((v - lo) / (hi - lo)) * (bot - top);
    const step = (W - padX * 2) / count;

    const gNoise = el('g', {}, svg);
    const lines = [];
    for (let j = 0; j < 8; j++) {
      const rr = rng(100 + j);
      let d = '';
      for (let i = 0; i <= 56; i++) {
        const px = padX + (i / 56) * (W - padX * 2);
        const base = y(bars[Math.min(count - 1, Math.round((i / 56) * (count - 1)))].c);
        const py = base + (rr() - 0.5) * 210 * (0.35 + 0.9 * Math.sin((i / 56) * Math.PI));
        d += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
      }
      lines.push(el('path', { d, class: 'nz' }, gNoise));
    }
    const gC = el('g', {}, svg);
    const candles = bars.map((b, i) => {
      const g = el('g', { class: 'cd ' + (b.c >= b.o ? 'up' : 'down') }, gC);
      const cx = x(i), bw = Math.max(4, step * 0.5);
      el('line', { x1: cx, x2: cx, y1: y(b.h), y2: y(b.l) }, g);
      el('rect', { x: cx - bw / 2, y: y(Math.max(b.o, b.c)), width: bw, height: Math.max(3, Math.abs(y(b.o) - y(b.c))) }, g);
      const mid = (y(b.h) + y(b.l)) / 2;
      g.style.transformOrigin = `${cx}px ${mid}px`;
      return g;
    });
    const sm = bars.map((_, i) => { const s = bars.slice(Math.max(0, i - 7), i + 1); return s.reduce((a, b) => a + b.c, 0) / s.length; });
    const ma = el('path', { d: sm.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(''), class: 'ma', pathLength: 1 }, svg);
    ma.style.strokeDasharray = '1';
    const cl = el('path', { d: bars.map((b, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(b.c).toFixed(1)).join(''), class: 'cl', pathLength: 1 }, svg);
    cl.style.strokeDasharray = '1';

    return (t) => {
      // 0 → pure noise, ~0.45 → noise and a single price line, 1 → structure
      const nz = 1 - ease(clamp(t / 0.62));
      const line = ease(clamp((t - 0.12) / 0.4)) * (1 - ease(clamp((t - 0.62) / 0.3)) * 0.55);
      const st = ease(clamp((t - 0.38) / 0.62));
      lines.forEach((p, j) => { p.style.opacity = (nz * (0.35 + 0.1 * (j % 3))).toFixed(3); });
      cl.style.strokeDashoffset = (1 - ease(clamp((t - 0.12) / 0.42))).toFixed(3);
      cl.style.opacity = line.toFixed(3);
      candles.forEach((g, i) => {
        const d = clamp((st * 1.35 - (i / candles.length) * 0.35));
        g.style.opacity = d.toFixed(3);
        g.style.transform = `scaleY(${(0.08 + 0.92 * ease(d)).toFixed(3)})`;
      });
      ma.style.strokeDashoffset = (1 - ease(clamp((t - 0.55) / 0.45))).toFixed(3);
      ma.style.opacity = clamp((t - 0.5) * 3).toFixed(3);
    };
  }

  /* ---- hero: plays once on load, then rests on structure ---- */
  const heroFig = document.querySelector('[data-chart="hero"]');
  if (heroFig) {
    const svg = heroFig.querySelector('svg');
    const draw = build(svg, matchMedia('(max-width:640px)').matches ? 28 : 56);
    if (reduce.matches) draw(1);
    else {
      let start = 0;
      const dur = 5200;
      draw(0);
      const tick = (ts) => { if (!start) start = ts + 250; const t = clamp((ts - start) / dur); draw(t); if (t < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
  }

  /* ---- scrubber ---- */
  const scrub = document.querySelector('[data-scrub]');
  if (scrub) {
    const svg = scrub.querySelector('svg');
    const draw = build(svg, 48);
    const input = scrub.querySelector('input');
    const out = scrub.querySelector('.scrub__out');
    const words = [
      [0, 'Noise.', 'Many lines, no meaning yet.'],
      [28, 'Recognition.', 'One path starts to stand out from the tangle.'],
      [55, 'Structure.', 'Candles give the movement a grammar.'],
      [85, 'Context.', 'A moving average adds memory, a reference to read the candles against.']
    ];
    const upd = () => {
      const v = +input.value;
      draw(v / 100);
      const w = [...words].reverse().find((x) => v >= x[0]);
      out.innerHTML = `<b>${w[1]}</b> ${w[2]}`;
      input.setAttribute('aria-valuetext', `${w[1]} ${w[2]}`);
    };
    input.addEventListener('input', upd);
    upd();
    /* a gentle first demonstration the first time it scrolls into view (not repeated) */
    if (!reduce.matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (+input.value !== 0) return;
        let s = 0; const d = 3200;
        const tick = (ts) => {
          if (scrub.dataset.touched) return;
          if (!s) s = ts;
          const t = clamp((ts - s) / d);
          input.value = Math.round(ease(t) * 100); upd();
          if (t < 1) requestAnimationFrame(tick);
        };
        scrub.addEventListener('pointerdown', () => { scrub.dataset.touched = '1'; }, { once: true });
        input.addEventListener('keydown', () => { scrub.dataset.touched = '1'; }, { once: true });
        requestAnimationFrame(tick);
      }, { threshold: 0.6 });
      io.observe(scrub);
    }
  }

  /* ---- live frames stepper ---- */
  const fr = document.querySelector('[data-frames]');
  if (fr) {
    const img = fr.querySelector('[data-frame-img]');
    const box = fr.querySelector('.frames__img');
    const note = fr.querySelector('[data-frame-note]');
    const btns = [...fr.querySelectorAll('[data-i]')];
    const frames = [
      ['Two lines move across an empty field. The promise is made before anything is explained.', 'Frame 1: a white line and a brass line rising across a dark field, with the WealthWithSG wordmark'],
      ['“Shapes begin to repeat. Recognising a pattern is not the same as understanding it.” The first small candles appear.', 'Frame 2: small candles appear at the left under the line, beside the caption about recognising patterns'],
      ['“Signals collide. Up close, noise and information look exactly alike.” Faint noise lines cross the candles.', 'Frame 3: dense candlesticks with faint noise lines crossing them'],
      ['“Strip the noise away and structure is what remains.” The tangle fades and the candles stay.', 'Frame 4: the noise has faded, leaving clean candlesticks and two averages'],
      ['The chart steps back and a person steps forward. The portrait is a labelled placeholder until real material arrives.', 'Frame 5: large candles beside a placeholder panel for a portrait of the founder'],
      ['The chart branches into the site’s sections: learning, exploring, analysis and discovering. The call to action closes the story.', 'Frame 6: a branching diagram leading to Learning, Explore, Analysis and Discover SG']
    ];
    let cur = 0;
    const set = (i) => {
      cur = i;
      btns.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      note.textContent = frames[i][0];
      const n = i + 1, base = `/assets/img/wsg/hero-${n}`;
      const apply = () => { img.srcset = `${base}-720.jpg 720w, ${base}.jpg 1440w`; img.src = `${base}-720.jpg`; img.alt = frames[i][1]; };
      if (reduce.matches) return apply();
      box.classList.add('swap');
      setTimeout(() => { apply(); const done = () => box.classList.remove('swap'); img.addEventListener('load', done, { once: true }); setTimeout(done, 700); }, 160);
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => set(i));
      b.addEventListener('pointerenter', () => { new Image().src = `/assets/img/wsg/hero-${i + 1}-720.jpg`; }, { once: true });
    });
    fr.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (!e.target.matches('[data-i]')) return;
      e.preventDefault();
      const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length;
      set(n); btns[n].focus();
    });
  }
})();
