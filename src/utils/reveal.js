// BATAILLE — révélation progressive des éléments au scroll
//
// Principe : par défaut (CSS seul, voir base.css), tout est visible —
// aucun risque de contenu bloqué invisible si ce script échoue à charger.
// Ce script n'ajoute la classe .reveal-ready sur <body> (qui active
// l'animation via CSS) qu'une fois prêt, et respecte
// prefers-reduced-motion en n'activant jamais l'effet dans ce cas.

export function initReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || items.length === 0 || !('IntersectionObserver' in window)) {
    return;
  }

  document.body.classList.add('reveal-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

// Assombrit/contraste le header une fois qu'on a un peu défilé — un
// header qui ne change jamais d'état a l'air figé, un header qui change
// dès le premier pixel est nerveux ; le seuil ci-dessous évite les deux.
export function initHeaderScrollState() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 8;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}
