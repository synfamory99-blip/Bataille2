// BATAILLE — point d'entrée de la page d'accueil
// Étape 7 : "Jouer maintenant" et "Défier un ami" mènent tous les deux
// à une vraie fonctionnalité (redirige vers la connexion si nécessaire).

import { onAuthChange } from './services/auth.js';
import { mountHeader } from './components/header.js';
import { mountFooter } from './components/footer.js';
import { initReveal } from './utils/reveal.js';

mountHeader();
mountFooter();
initReveal();

let currentUser = null;
onAuthChange((user) => { currentUser = user; });

document.getElementById('btn-play')?.addEventListener('click', () => {
  window.location.href = currentUser ? '/theme-select.html' : '/auth.html';
});

document.getElementById('btn-challenge')?.addEventListener('click', () => {
  window.location.href = currentUser ? '/challenge.html' : '/auth.html';
});
