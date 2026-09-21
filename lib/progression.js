// BATAILLE — progression (XP, niveaux, série quotidienne)
//
// Fonctions pures (aucun accès Firestore ici) pour rester faciles à
// tester isolément. Utilisées par /api/finish-game.
//
// Barème de niveaux (section 12 du prompt maître) :
//   Niveau 1 → 0 XP, Niveau 2 → 100 XP, Niveau 3 → 250 XP, ...
// chaque palier suivant demandant 50 XP de plus que le précédent.

function levelForXp(totalXp) {
  let level = 1;
  let threshold = 0; // XP cumulée nécessaire pour atteindre `level`
  let increment = 100; // XP nécessaire pour passer de ce niveau au suivant

  while (totalXp >= threshold + increment) {
    threshold += increment;
    level += 1;
    increment += 50;
  }

  return {
    level,
    currentLevelXp: totalXp - threshold, // XP acquise dans le niveau actuel
    xpForNextLevel: increment, // XP totale requise pour passer au niveau suivant
  };
}

// XP gagnée pour une partie : le score sert de base (1 point = 1 XP,
// cohérent avec l'exemple "8/10 → +80 XP" du prompt maître), avec un
// petit bonus selon la difficulté des questions réussies (section 8 :
// "Elle [la difficulté] peut influencer légèrement les XP obtenus").
function computeXpEarned(score, answers) {
  let bonus = 0;
  Object.values(answers).forEach((a) => {
    if (!a.correct) return;
    if (a.difficulty === 'medium') bonus += 1;
    if (a.difficulty === 'hard') bonus += 2;
  });
  return score + bonus;
}

function todayDateString(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function yesterdayDateString(date = new Date()) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return todayDateString(d);
}

// Met à jour la série quotidienne. Une partie jouée "aujourd'hui" ne
// compte qu'une fois (section 13 : "Ne pas permettre au joueur de gagner
// plusieurs jours simplement en lançant plusieurs parties le même jour").
function computeStreak(lastPlayedDate, now = new Date()) {
  const today = todayDateString(now);
  const yesterday = yesterdayDateString(now);

  if (lastPlayedDate === today) {
    return { streakUnchanged: true, lastPlayedDate: today };
  }
  if (lastPlayedDate === yesterday) {
    return { streakIncrement: 1, lastPlayedDate: today };
  }
  return { streakReset: true, lastPlayedDate: today };
}

module.exports = { levelForXp, computeXpEarned, computeStreak, todayDateString };
