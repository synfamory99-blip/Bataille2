// BATAILLE — POST /api/create-challenge
//
// Joueur A crée un défi (section 9 du prompt maître / section 5 de la
// stratégie de chargement) : les 10 questions sont sélectionnées UNE
// SEULE FOIS ici et figées sur le document challenges/{id} — le joueur B
// recevra exactement la même série (jamais une nouvelle sélection).

const { admin, db } = require('../lib/firebaseAdmin');
const { getAuthenticatedUser } = require('../lib/requireAuth');
const { selectQuestionsForCategory, sanitize } = require('../lib/selectQuestions');
const { VALID_CATEGORIES } = require('../lib/categories');
const { randomCode } = require('../lib/generateCode');

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = randomCode();
    const existing = await db.collection('challenges').where('code', '==', candidate).limit(1).get();
    if (existing.empty) return candidate;
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { category } = req.body || {};
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Thème invalide' });
  }

  try {
    const selected = await selectQuestionsForCategory(category);
    const sanitized = sanitize(selected);

    const code = await generateUniqueCode();
    if (!code) {
      return res.status(500).json({ error: 'Impossible de générer un code de bataille, réessaie.' });
    }

    const pseudo = user.name || 'Invité';
    const challengeRef = db.collection('challenges').doc();
    const gameRef = db.collection('games').doc();

    await gameRef.set({
      userId: user.uid,
      category,
      questionIds: selected.map((q) => q.id),
      answers: {},
      status: 'in_progress',
      challengeId: challengeRef.id,
      challengeCode: code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await challengeRef.set({
      code,
      category,
      questions: sanitized,
      questionIds: selected.map((q) => q.id),
      player1: {
        userId: user.uid,
        pseudo,
        gameId: gameRef.id,
        status: 'playing',
        score: null,
        correctCount: null,
      },
      player2: null,
      status: 'waiting_for_player2',
      winnerId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      challengeId: challengeRef.id,
      code,
      gameId: gameRef.id,
      questions: sanitized,
    });
  } catch (error) {
    console.error('create-challenge error:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};
