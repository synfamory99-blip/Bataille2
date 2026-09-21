// BATAILLE — calcul de niveau (client)
// Même formule que lib/progression.js côté serveur (Node/CommonJS) — pas
// de bundler commun entre client et /api dans cette V1, donc dupliquée
// intentionnellement. Si tu modifies l'une, modifie l'autre.

export function levelForXp(totalXp) {
  let level = 1;
  let threshold = 0;
  let increment = 100;

  while (totalXp >= threshold + increment) {
    threshold += increment;
    level += 1;
    increment += 50;
  }

  return {
    level,
    currentLevelXp: totalXp - threshold,
    xpForNextLevel: increment,
  };
}
