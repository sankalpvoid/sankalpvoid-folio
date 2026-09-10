const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const reveals = [...document.querySelectorAll('.reveal')];
if (prefersReduced) {
  reveals.forEach(el => el.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => revealObserver.observe(el));
}

const navIndex = document.getElementById('navIndex');
const sections = [...document.querySelectorAll('.section-index')];
const sectionObserver = new IntersectionObserver(entries => {
  const active = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (active && navIndex) navIndex.textContent = active.target.dataset.index || '00';
}, { threshold: [0.2, 0.45, 0.65] });
sections.forEach(section => sectionObserver.observe(section));

if (!prefersReduced) {
  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', e => {
    if (!glow) return;
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, { passive: true });

  const orbit = document.getElementById('orbitMap');
  if (orbit) {
    orbit.addEventListener('pointermove', e => {
      const rect = orbit.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      orbit.style.transform = `perspective(900px) rotateX(${y * -2.2}deg) rotateY(${x * 2.2}deg)`;
    });
    orbit.addEventListener('pointerleave', () => {
      orbit.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  }

  const voidWord = document.querySelector('.void-word');
  window.addEventListener('scroll', () => {
    if (!voidWord) return;
    const amount = Math.min(window.scrollY * 0.025, 12);
    voidWord.style.transform = `translateX(${amount}px)`;
  }, { passive: true });
}
