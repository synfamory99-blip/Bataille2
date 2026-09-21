// BATAILLE — header partagé (état de connexion)
// Monte l'affichage "Connexion" / pseudo + déconnexion dans un élément
// #auth-status, sur n'importe quelle page qui l'inclut.

import { onAuthChange, signOutUser } from '../services/auth.js';
import { initHeaderScrollState } from '../utils/reveal.js';

export function mountHeader() {
  const el = document.getElementById('auth-status');
  if (!el) return;
  initHeaderScrollState();
  onAuthChange((user) => {
    el.innerHTML = '';
    if (user) {
      const label = user.isAnonymous ? 'Invité' : (user.displayName || 'Joueur');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = label; // jamais innerHTML : le pseudo vient de l'utilisateur
      const signOutBtn = document.createElement('button');
      signOutBtn.id = 'btn-signout';
      signOutBtn.textContent = 'Déconnexion';
      signOutBtn.addEventListener('click', () => signOutUser());
      el.append(nameSpan, signOutBtn);
    } else {
      const link = document.createElement('a');
      link.href = '/auth.html';
      link.textContent = 'Connexion';
      el.appendChild(link);
    }
  });
}
