// BATAILLE — POST /api/start-game
//
// Sélectionne 10 questions côté serveur pour une partie solo (section 2
// de la stratégie de chargement). Pour une partie de défi, voir
// create-challenge.js / join-challenge.js, qui réutilisent les mêmes
// utilitaires (lib/selectQuestions.js) mais figent les questions pour
// les deux joueurs.

const { admin, db } = require('../lib/firebaseAdmin');
const { getAuthenticatedUser } = require('../lib/requireAuth');
const { selectQuestionsForCategory, selectMixQuestions, sanitize } = require('../lib/selectQuestions');
const { VALID_CATEGORIES } = require('../lib/categories');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { category } = req.body || {};
  const isMix = category === 'mix';
  if (!isMix && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Thème invalide' });
  }

  try {
    const selected = isMix ? await selectMixQuestions() : await selectQuestionsForCategory(category);

    const gameRef = db.collection('games').doc();
    await gameRef.set({
      userId: user.uid,
      category,
      questionIds: selected.map((q) => q.id),
      answers: {},
      status: 'in_progress',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ gameId: gameRef.id, questions: sanitize(selected) });
  } catch (error) {
    console.error('start-game error:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};
