// BATAILLE — icônes SVG
//
// Remplace les emoji (rendu incohérent selon plateforme — certains
// drapeaux ne s'affichent même pas sous Windows) par un vrai système
// d'icônes : traits réguliers, currentColor (héritent la couleur du
// texte environnant via CSS), viewBox 24x24 uniforme.
//
// Comme le site n'a pas de bundler/templating partagé entre les pages
// HTML statiques, ce module est la source de vérité pour le SVG utilisé
// dynamiquement en JS ; le même tracé est recopié tel quel dans le HTML
// statique là où c'est nécessaire (pas de duplication de logique, juste
// du balisage identique).

const BASE_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  sword: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M14.5 3.5 20.5 9.5 11 19 5 19 5 13 14.5 3.5Z"/><path d="M9 15 3.5 20.5"/><path d="M16.5 5.5 18.5 7.5"/></svg>`,

  target: `<svg ${BASE_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>`,

  trophy: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a3 3 0 0 0 3 5"/><path d="M17 5h3a3 3 0 0 1-3 5"/><path d="M12 13v3"/><path d="M8.5 20h7"/><path d="M9.5 16.5h5l.5 3.5h-6l.5-3.5Z"/></svg>`,

  flame: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M12 2.5c1 2.5-3 4-3 7.5a3 3 0 0 0 6 0c0-1-.5-1.5-.8-2.2 1.5 1 2.8 3 2.8 5.2a5 5 0 0 1-10 0c0-4 3-6.2 5-10.5Z"/></svg>`,

  bolt: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>`,

  globe: `<svg ${BASE_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z"/></svg>`,

  music: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M9 18V5.5L20 3v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/></svg>`,

  pennant: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M5 21V4"/><path d="M5 4l14 4-14 4"/></svg>`,

  atom: `<svg ${BASE_ATTRS} aria-hidden="true"><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,

  football: `<svg ${BASE_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5 16 10l-1.5 4.5h-5L8 10l4-2.5Z"/><path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21"/></svg>`,

  checkCircle: `<svg ${BASE_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>`,

  xCircle: `<svg ${BASE_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/></svg>`,

  user: `<svg ${BASE_ATTRS} aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.4-3.5 4.3-5.5 7.5-5.5s6.1 2 7.5 5.5"/></svg>`,

  mail: `<svg ${BASE_ATTRS} aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></svg>`,

  message: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z"/></svg>`,

  speakerOn: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4v-5Z"/><path d="M16 9c1 1 1 5 0 6"/><path d="M18.5 7c2 2 2 8 0 10"/></svg>`,

  speakerOff: `<svg ${BASE_ATTRS} aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4v-5Z"/><path d="M16 9l5 6"/><path d="M21 9l-5 6"/></svg>`,

  // Drapeau ivoirien : couleurs réelles (pas currentColor), pour rester
  // fidèle quelle que soit la couleur de texte environnante.
  flagCI: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" fill="#1E1840"/><rect x="5" y="6.2" width="4.67" height="11.6" fill="#FF8200"/><rect x="9.67" y="6.2" width="4.66" height="11.6" fill="#F5F1FF"/><rect x="14.33" y="6.2" width="4.67" height="11.6" fill="#009A49"/></svg>`,
};

// Retourne le SVG d'une icône, prêt à insérer via innerHTML (contenu
// statique et fiable, jamais dérivé d'une saisie utilisateur — pas de
// risque XSS comparable à celui déjà corrigé pour les pseudos).
export function iconMarkup(name) {
  return icons[name] || '';
}
