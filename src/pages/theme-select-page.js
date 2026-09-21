// BATAILLE — page de choix du thème
import { onAuthChange } from '../services/auth.js';
import { mountHeader } from '../components/header.js';
import { mountFooter } from '../components/footer.js';
import { startGame } from '../services/game.js';

mountHeader();
mountFooter();

// Il faut être connecté (compte réel ou invité) pour jouer et sauvegarder
// une partie — redirige vers l'authentification sinon.
onAuthChange((user) => {
  if (!user) window.location.href = '/auth.html';
});

document.querySelectorAll('.theme-card[data-category]:not([disabled])').forEach((card) => {
  card.addEventListener('click', async () => {
    const category = card.dataset.category;
    card.classList.add('is-loading');
    try {
      const { gameId, questions } = await startGame(category);
      sessionStorage.setItem('bataille_game', JSON.stringify({ gameId, questions, category, mode: 'solo' }));
      window.location.href = '/game.html';
    } catch (error) {
      alert(error.message);
      card.classList.remove('is-loading');
    }
  });
});
