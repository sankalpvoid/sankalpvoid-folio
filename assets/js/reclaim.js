/* Reclaim exhibition: decision stepper (sticky phone) + prototype viewer. */
(() => {
  /* ---- decisions: the sticky phone follows the decision nearest the viewport centre ---- */
  const steps = [...document.querySelectorAll('.dec__list li')];
  const imgs = [...document.querySelectorAll('.dec__stack img')];
  if (steps.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const n = e.target.dataset.step;
        steps.forEach((s) => s.classList.toggle('is-current', s === e.target));
        imgs.forEach((im) => im.classList.toggle('on', im.dataset.for === n));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  }

  /* ---- viewer ---- */
  const root = document.querySelector('[data-viewer]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const themeBtns = [...root.querySelectorAll('[data-theme]')];
  const dev = root.querySelector('.viewer__dev');
  const img = root.querySelector('[data-screen-img]');
  const panel = root.querySelector('[role="tabpanel"]');
  const title = root.querySelector('[data-note-title]');
  const text = root.querySelector('[data-note-text]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const notes = {
    home: ['Home', 'One question, one action. “What would help right now?” sits above the day count, with craving support a single tap away.'],
    craving: ['Craving support', 'Small tools sized for an urge that passes: box breathing, a five-minute countdown and a one-minute water reset.'],
    health: ['Health', 'An evidence-informed timeline keyed to time since the quit date. General guidance and estimates, not an individual medical claim.'],
    momentum: ['Momentum', '“Momentum is not perfect. It is how quickly you choose again.” Resilience and achievements, without a streak that punishes a bad day.'],
    dreams: ['Dreams', 'Savings goals funded by smoke-free days. Progress is shown against a target; the goal here is sample data.']
  };
  let screen = 'home', theme = 'dark';
  const src = (s, t) => `/assets/img/rc/${t}-${s}`;

  const render = () => {
    const next = () => {
      img.srcset = `${src(screen, theme)}-390.jpg 390w, ${src(screen, theme)}.jpg 780w`;
      img.src = `${src(screen, theme)}-390.jpg`;
      img.alt = `Reclaim ${notes[screen][0].toLowerCase()} screen, ${theme} theme`;
    };
    title.textContent = notes[screen][0];
    text.textContent = notes[screen][1];
    if (reduce.matches) return next();
    dev.classList.add('swap');
    setTimeout(() => { next(); img.addEventListener('load', () => dev.classList.remove('swap'), { once: true }); setTimeout(() => dev.classList.remove('swap'), 600); }, 180);
  };
  const select = (btn, focus) => {
    screen = btn.dataset.screen;
    tabs.forEach((t) => { const on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', btn.id);
    if (focus) btn.focus();
    render();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
    t.addEventListener('pointerenter', () => { const p = new Image(); p.src = `${src(t.dataset.screen, theme)}-390.jpg`; }, { once: true });
  });
  themeBtns.forEach((b) => b.addEventListener('click', () => {
    theme = b.dataset.theme;
    themeBtns.forEach((x) => x.setAttribute('aria-pressed', x === b));
    render();
  }));
})();
