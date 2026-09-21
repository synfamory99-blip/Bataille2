// BATAILLE — page profil
import { onAuthChange } from '../services/auth.js';
import { mountHeader } from '../components/header.js';
import { mountFooter } from '../components/footer.js';
import { getProfile } from '../services/profile.js';
import { levelForXp } from '../utils/levels.js';
import { iconMarkup } from '../utils/icons.js';

mountHeader();
mountFooter();

document.getElementById('streak-banner-icon').innerHTML = iconMarkup('flame');

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = '/auth.html';
    return;
  }

  document.getElementById('profile-pseudo').textContent = user.isAnonymous
    ? 'Invité'
    : (user.displayName || 'Joueur');

  const profile = await getProfile(user.uid);
  const xp = profile?.xp || 0;
  const { level, currentLevelXp, xpForNextLevel } = levelForXp(xp);

  document.getElementById('profile-level').textContent = `Niveau ${level}`;
  document.getElementById('xp-bar-fill').style.width = `${Math.min(100, (currentLevelXp / xpForNextLevel) * 100)}%`;
  document.getElementById('xp-bar-label').textContent = `${currentLevelXp} / ${xpForNextLevel} XP`;

  document.getElementById('stat-games').textContent = profile?.gamesPlayed || 0;
  document.getElementById('stat-best').textContent = profile?.bestScore || 0;
  document.getElementById('stat-wins').textContent = profile?.wins || 0;
  document.getElementById('stat-losses').textContent = profile?.losses || 0;

  const streak = profile?.streakCount || 0;
  document.getElementById('streak-banner-text').textContent = streak > 0
    ? `Série actuelle : ${streak} jour${streak > 1 ? 's' : ''}`
    : "Joue aujourd'hui pour démarrer ta série";
});
