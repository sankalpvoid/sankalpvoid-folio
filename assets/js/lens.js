/* Lens: the shared transition surface.
   One WebGL canvas (created once, capped at DPR 1.5, rendered only while a gesture or transition is running) draws a project's artwork
   as a deforming surface: a smooth lens bulge around the pointer that grows while you hold, relaxes with a small spring if you let go,
   and, when entry completes, opens into a zoom whose final frame equals the destination's arrival overlay (see arrive.js), so the
   hand-off between pages shows no flash and no second entrance. Only the artwork deforms; header, controls and titles are DOM above it.
   Without WebGL (or with reduced motion) the same states use a plain CSS scale on an overlay image: no distortion is claimed.
   The destination is prepared before the hand-off (HTML fetched, its hero images decoded, bounded by a timeout); if that fails the visitor
   simply navigates normally. Nothing here traps the visitor: every path ends in close() or a real navigation. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const HOLD_MS = 560;
  let canvas = null, gl = null, prog = null, loc = {}, tex = new Map(), lost = false, glOk = null;
  let host = null, mode = 'fixed', art = '', texW = 1, texH = 1, curTex = null;
  const st = { s: 0, z: 0, a: 0, cx: 0.5, cy: 0.5, tx: 0.5, ty: 0.5 };
  let raf = 0, last = 0, running = false, busy = false, spr = null, fallback = null;
  const images = new Map();

  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 res,ts,c;uniform float s,z,a;
  vec2 cover(vec2 u){float sr=res.x/res.y,tr=ts.x/ts.y;vec2 k=vec2(1.);if(sr>tr)k.y=tr/sr;else k.x=sr/tr;return (u-.5)*k+.5;}
  void main(){
    vec2 u=v; vec2 d=u-c; d.x*=res.x/res.y; float r=length(d);
    float f=s*.34*exp(-pow(r/.5,2.)*1.5);               /* local lens: samples pulled toward the pointer = magnified */
    vec2 q=c+(u-c)*(1.-f);
    vec2 w=q-.5; q=.5+w*(1.+s*.10*dot(w,w)*4.);       /* faint barrel across the surface while held */
    q=c+(q-c)*(1.-z*.55);                              /* completion: open into a zoom about the pointer */
    q=clamp(q,.001,.999);
    vec3 col=texture2D(t,cover(q)).rgb;
    col*=1.-s*(1.-z)*.22*smoothstep(.2,.9,length(u-.5)*1.4); /* soft vignette gives the surface curvature */
    gl_FragColor=vec4(col,a);}`;

  const initGL = () => {
    if (glOk !== null) return glOk;
    try {
      canvas = document.createElement('canvas');
      canvas.className = 'lens'; canvas.setAttribute('aria-hidden', 'true');
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
      if (!gl) return (glOk = false);
      const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(prog);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const p = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
      ['t', 'res', 'ts', 'c', 's', 'z', 'a'].forEach((n) => { loc[n] = gl.getUniformLocation(prog, n); });
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; close(true); });
      canvas.addEventListener('webglcontextrestored', () => { lost = false; tex.clear(); });
      return (glOk = true);
    } catch (e) { return (glOk = false); }
  };

  const load = (src) => {
    if (!images.has(src)) images.set(src, new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    return images.get(src);
  };
  const texFor = (src, img) => {
    if (tex.has(src)) return tex.get(src);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const rec = { t, w: img.naturalWidth, h: img.naturalHeight }; tex.set(src, rec); return rec;
  };

  const size = () => {
    const r = (mode === 'fixed' ? { width: innerWidth, height: innerHeight } : host.getBoundingClientRect());
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };
  const draw = () => {
    if (!gl || lost || !curTex) return;
    size();
    gl.useProgram(prog); gl.bindTexture(gl.TEXTURE_2D, curTex.t);
    gl.uniform1i(loc.t, 0); gl.uniform2f(loc.res, canvas.width, canvas.height); gl.uniform2f(loc.ts, curTex.w, curTex.h);
    gl.uniform2f(loc.c, st.cx, 1 - st.cy); gl.uniform1f(loc.s, st.s); gl.uniform1f(loc.z, st.z); gl.uniform1f(loc.a, st.a);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const k = 1 - Math.exp(-dt / 0.07);
    st.cx += (st.tx - st.cx) * k; st.cy += (st.ty - st.cy) * k;
    if (spr) {                                         /* spring strength back to rest with a small overshoot */
      spr.v += (-170 * (st.s - 0) - 19 * spr.v) * dt; st.s += spr.v * dt;
      if (st.s < 0) { st.s = 0; spr.v = Math.abs(spr.v) * 0.2; }
      st.a = Math.min(st.a, clamp(st.s * 6));
      if (st.s < 0.002 && Math.abs(spr.v) < 0.02) { const done = spr.done; spr = null; st.s = 0; close(); done && done(); return; }
    }
    if (fallback) fallback.style.setProperty('--ls', st.s.toFixed(3));
    draw();
    if (running) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && running) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const open = async (opts) => {
    art = opts.art; mode = opts.mode || 'fixed'; host = opts.host || document.body;
    st.s = 0; st.z = 0; st.a = 0; spr = null;
    const px = (opts.x ?? innerWidth / 2), py = (opts.y ?? innerHeight / 2);
    const r = mode === 'fixed' ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : host.getBoundingClientRect();
    st.tx = st.cx = clamp((px - r.left) / r.width); st.ty = st.cy = clamp((py - r.top) / r.height);
    running = true;
    const img = await load(art);
    if (!running) return false;                         /* released before the artwork was ready */
    if (!reduce() && initGL() && !lost && img) {
      curTex = texFor(art, img);
      canvas.className = 'lens lens--' + mode;
      if (mode === 'host') host.insertBefore(canvas, host.querySelector('.sc-copy')); else document.body.appendChild(canvas);
      st.a = 1;
    } else {
      /* no WebGL / reduced motion: a plain scaled still of the same artwork. No distortion is claimed. */
      fallback = document.createElement('div'); fallback.className = 'lens lens--css lens--' + mode; fallback.style.backgroundImage = `url(${art})`;
      fallback.style.setProperty('--lx', (st.cx * 100) + '%'); fallback.style.setProperty('--ly', (st.cy * 100) + '%');
      if (mode === 'host') host.insertBefore(fallback, host.querySelector('.sc-copy')); else document.body.appendChild(fallback);
    }
    kick();
    return true;
  };
  function close(silent) {
    running = false; cancelAnimationFrame(raf); raf = 0; spr = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
    fallback = null; st.s = 0; st.z = 0; st.a = 0; curTex = null;
  }
  const to = (key, goal, ms, ease = eio) => new Promise((res) => {
    const from = st[key], t0 = performance.now();
    const step = (now) => { if (!running) return res(); const k = clamp((now - t0) / ms); st[key] = from + (goal - from) * ease(k); if (k < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });

  /* Prepare the destination: fetch its HTML and decode the first images it will show. Bounded; failure is not an error. */
  const prepare = (href, ms = 1500) => {
    const job = (async () => {
      try {
        const r = await fetch(href, { credentials: 'same-origin' });
        const html = await r.text();
        const srcs = [...html.matchAll(/<(?:link rel="preload"[^>]*href|img[^>]*\ssrc)="([^"]+)"/g)].map((m) => m[1]).filter((u) => /\.(jpe?g|png|webp|avif)/i.test(u)).slice(0, 4);
        await Promise.all(srcs.map(load));
      } catch (e) { /* ordinary navigation will still work */ }
    })();
    return Promise.race([job, new Promise((res) => setTimeout(res, ms))]);
  };
  const handOff = (href, art, x, y) => {
    try { sessionStorage.setItem('sv-arrive', JSON.stringify({ art, x: Math.round(x), y: Math.round(y), t: Date.now() })); } catch (e) { /* storage unavailable */ }
    location.href = href;
  };

  /* A gesture: hold on the artwork. begin() shows feedback at once; progress follows the hold; release returns; completion navigates. */
  const hold = (o) => {
    if (busy) return null;
    let alive = true, done = false, t0 = performance.now(), hr = 0, opened = null;
    const prep = prepare(o.href, 4000);
    opened = open({ art: o.art, mode: o.mode, host: o.host, x: o.x, y: o.y });
    const tick = (now) => {
      if (!alive) return;
      const p = clamp((now - t0) / HOLD_MS);
      st.s = 1 - Math.pow(1 - p, 2.2);                   /* feedback is immediate and eases toward its maximum */
      st.a = 1;
      if (p >= 1 && !done) { done = true; finish(); return; }
      hr = requestAnimationFrame(tick);
    };
    hr = requestAnimationFrame(tick);
    const finish = async () => {
      busy = true; alive = false;
      await opened;
      if (!running) { busy = false; return; }
      await Promise.all([to('z', 1, 520), to('s', 0, 520)]);
      await Promise.race([prep, new Promise((r) => setTimeout(r, 1200))]);
      handOff(o.href, o.art, o.x, o.y);
      setTimeout(() => { busy = false; close(); }, 3000);   /* if navigation is blocked the visitor is released */
    };
    return {
      move(x, y) { const r = mode === 'fixed' ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : host.getBoundingClientRect(); st.tx = clamp((x - r.left) / r.width); st.ty = clamp((y - r.top) / r.height); },
      cancel() { if (!alive || done) return; alive = false; cancelAnimationFrame(hr); if (!running) return; spr = { v: 0 }; kick(); },
      get active() { return alive; }
    };
  };

  /* A programmatic entry (click, tap, keyboard, next project): the same surface runs the whole sequence by itself. */
  const go = async (o) => {
    if (busy) return false;
    busy = true;
    if (reduce()) { location.href = o.href; setTimeout(() => { busy = false; }, 2000); return true; }
    const prep = prepare(o.href, 2500);
    const ok = await open({ art: o.art, mode: o.mode, host: o.host, x: o.x, y: o.y });
    if (!ok || !running) { busy = false; location.href = o.href; return true; }
    await to('s', 1, 460);
    await Promise.all([to('z', 1, 520), to('s', 0, 520)]);
    await Promise.race([prep, new Promise((r) => setTimeout(r, 1200))]);
    handOff(o.href, o.art, o.x ?? innerWidth / 2, o.y ?? innerHeight / 2);
    setTimeout(() => { busy = false; close(); }, 3000);
    return true;
  };

  addEventListener('pageshow', () => { busy = false; close(); });
  window.SVLens = { hold, go, preload: load, HOLD_MS, get busy() { return busy; }, supported: () => initGL() };
})();
