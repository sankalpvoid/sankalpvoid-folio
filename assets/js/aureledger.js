/* Aureledger exhibition: step-synced frame and the "does it count?" quiz. */
(() => {
  const steps = [...document.querySelectorAll('.steps__list li')];
  const imgs = [...document.querySelectorAll('.steps__frame img')];
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

  const quiz = document.querySelector('[data-quiz]');
  const score = document.querySelector('[data-quiz-score]');
  if (!quiz) return;
  const items = [...quiz.querySelectorAll('li')];
  let right = 0, done = 0;
  items.forEach((li) => {
    li.querySelectorAll('[data-guess]').forEach((b) => b.addEventListener('click', () => {
      if (li.hasAttribute('data-done')) return;
      const ok = b.dataset.guess === li.dataset.ans;
      li.setAttribute('data-done', ''); li.dataset.right = ok ? '1' : '0';
      b.classList.add('pick'); b.setAttribute('aria-pressed', 'true');
      const a = li.querySelector('.quiz__a'); a.hidden = false;
      if (ok) right++; done++;
      score.textContent = done === items.length ? `${right} of ${items.length} matched the ledger's rule.` : `${done} of ${items.length} answered.`;
    }));
  });
})();
