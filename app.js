const orbitStyles = document.createElement('link');
orbitStyles.rel = 'stylesheet';
orbitStyles.href = 'orbit-polish.css';
document.head.appendChild(orbitStyles);

const workStyles = document.createElement('link');
workStyles.rel = 'stylesheet';
workStyles.href = 'work-polish.css';
document.head.appendChild(workStyles);

const labStyles = document.createElement('link');
labStyles.rel = 'stylesheet';
labStyles.href = 'lab-polish.css';
document.head.appendChild(labStyles);

const sideBStyles = document.createElement('link');
sideBStyles.rel = 'stylesheet';
sideBStyles.href = 'side-b-polish.css';
document.head.appendChild(sideBStyles);

const gramophoneStyles = document.createElement('link');
gramophoneStyles.rel = 'stylesheet';
gramophoneStyles.href = 'gramophone.css';
document.head.appendChild(gramophoneStyles);

const aboutStyles = document.createElement('link');
aboutStyles.rel = 'stylesheet';
aboutStyles.href = 'about-polish.css';
document.head.appendChild(aboutStyles);

const sideBSection = document.getElementById('side-b');
if (sideBSection) {
  const gramophone = document.createElement('div');
  gramophone.className = 'gramophone';
  gramophone.setAttribute('aria-hidden', 'true');
  gramophone.innerHTML = '<div class="gramophone-horn"></div><div class="gramophone-neck"></div><div class="gramophone-deck"></div><div class="gramophone-spindle"></div>';
  sideBSection.appendChild(gramophone);
}

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

  document.querySelectorAll('.project').forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${px}%`);
      card.style.setProperty('--my', `${py}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    });
  });

  const voidWord = document.querySelector('.void-word');
  window.addEventListener('scroll', () => {
    if (!voidWord) return;
    const amount = Math.min(window.scrollY * 0.025, 12);
    voidWord.style.transform = `translateX(${amount}px)`;
  }, { passive: true });
}
