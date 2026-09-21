// BATAILLE — page classement
import { onAuthChange } from '../services/auth.js';
import { mountHeader } from '../components/header.js';
import { mountFooter } from '../components/footer.js';
import { getTopPlayers, getMyRank, getProfile } from '../services/profile.js';

mountHeader();
mountFooter();

const RANK_CLASS = { 1: 'rank-gold', 2: 'rank-silver', 3: 'rank-bronze' };

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = '/auth.html';
    return;
  }

  const listEl = document.getElementById('leaderboard-list');
  const meEl = document.getElementById('leaderboard-me');

  try {
    const [top, myProfile] = await Promise.all([
      getTopPlayers(10),
      getProfile(user.uid),
    ]);

    listEl.innerHTML = '';
    top.forEach((player, index) => {
      const rank = index + 1;
      const row = document.createElement('div');
      row.className = 'card leaderboard-row' + (player.uid === user.uid ? ' is-me' : '');

      const rankSpan = document.createElement('span');
      rankSpan.className = 'leaderboard-rank' + (RANK_CLASS[rank] ? ` ${RANK_CLASS[rank]}` : '');
      rankSpan.textContent = String(rank);

      const pseudoSpan = document.createElement('span');
      pseudoSpan.className = 'leaderboard-pseudo';
      pseudoSpan.textContent = player.pseudo || 'Invité'; // jamais innerHTML : pseudo fourni par l'utilisateur

      const xpSpan = document.createElement('span');
      xpSpan.className = 'leaderboard-xp';
      xpSpan.textContent = `${player.xp || 0} XP`;

      row.append(rankSpan, pseudoSpan, xpSpan);
      listEl.appendChild(row);
    });

    if (top.length === 0) {
      listEl.innerHTML = '<p>Personne n\'a encore joué — sois le premier !</p>';
    }

    const myRank = await getMyRank(myProfile?.xp || 0);
    meEl.textContent = `Ta position : #${myRank} — ${myProfile?.xp || 0} XP`;
  } catch (error) {
    listEl.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = error.message;
    listEl.appendChild(p);
    meEl.textContent = '';
  }
});
