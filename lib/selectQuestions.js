// BATAILLE — sélection des questions côté serveur
// Partagé par /api/start-game et /api/create-challenge (section 2 de la
// stratégie de chargement : la sélection se fait toujours côté serveur).

const { db } = require('./firebaseAdmin');

const QUESTIONS_PER_GAME = 10;

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function selectQuestionsForCategory(category) {
  const snapshot = await db.collection('questions').where('category', '==', category).get();
  if (snapshot.size < QUESTIONS_PER_GAME) {
    throw new Error(
      `Pas assez de questions pour ce thème (${snapshot.size} disponibles, ${QUESTIONS_PER_GAME} nécessaires).`
    );
  }
  const all = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  return shuffle(all).slice(0, QUESTIONS_PER_GAME);
}

// BATAILLE MIX (section 4 du prompt maître / section 3 de la stratégie de
// chargement) : répartition fixe à travers les 6 thèmes, totalisant 10
// questions. La sélection reste entièrement côté serveur, comme pour un
// thème unique.
const MIX_DISTRIBUTION = {
  cote_ivoire: 2,
  football: 2,
  musique: 2,
  culture_generale: 2,
  drapeaux_pays: 1,
  sciences_technologie: 1,
};

async function selectMixQuestions() {
  const picks = [];
  for (const [category, count] of Object.entries(MIX_DISTRIBUTION)) {
    // eslint-disable-next-line no-await-in-loop -- 6 catégories seulement, séquentiel est très bien ici
    const snapshot = await db.collection('questions').where('category', '==', category).get();
    if (snapshot.size < count) {
      throw new Error(
        `Pas assez de questions dans "${category}" pour BATAILLE MIX (${snapshot.size} disponibles, ${count} nécessaires).`
      );
    }
    const all = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    picks.push(...shuffle(all).slice(0, count));
  }
  // Mélange l'ordre final : sans ça, les questions arriveraient groupées
  // thème par thème plutôt que vraiment "mix".
  return shuffle(picks);
}

// Jamais correctAnswer ni explanation avant que le joueur ait répondu.
function sanitize(questions) {
  return questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
  }));
}

module.exports = { selectQuestionsForCategory, selectMixQuestions, MIX_DISTRIBUTION, sanitize, QUESTIONS_PER_GAME };
