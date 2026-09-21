// BATAILLE — POST /api/submit-answer
//
// Remplace la Cloud Function "submitAnswer" du cadrage initial.
//
// Anti-triche (section 6 de la stratégie de chargement) : le client
// n'envoie jamais la bonne réponse, seulement sa sélection. Ici on
// vérifie que la partie existe, appartient bien à l'utilisateur, que la
// question fait partie de la partie, qu'elle n'a pas déjà été répondue,
// et que la réponse est valide — avant de calculer le score.

const { db } = require('../lib/firebaseAdmin');
const { getAuthenticatedUser } = require('../lib/requireAuth');

const SPEED_BONUS_WINDOW_MS = 15000; // au-delà, plus de bonus de rapidité
const MAX_SPEED_BONUS = 5;
const BASE_POINTS = 10;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { gameId, questionId, selectedAnswer, timeMs } = req.body || {};

  if (!gameId || !questionId || typeof selectedAnswer !== 'number') {
    return res.status(400).json({ error: 'Requête invalide' });
  }
  if (selectedAnswer < 0 || selectedAnswer > 3) {
    return res.status(400).json({ error: 'Réponse invalide' });
  }

  try {
    const gameRef = db.collection('games').doc(gameId);
    const gameSnap = await gameRef.get();
    if (!gameSnap.exists) {
      return res.status(404).json({ error: 'Partie introuvable' });
    }
    const game = gameSnap.data();

    if (game.userId !== user.uid) {
      return res.status(403).json({ error: "Cette partie ne t'appartient pas" });
    }
    if (game.status !== 'in_progress') {
      return res.status(400).json({ error: 'Cette partie est déjà terminée' });
    }
    if (!game.questionIds.includes(questionId)) {
      return res.status(400).json({ error: "Cette question n'appartient pas à la partie" });
    }
    if (game.answers && game.answers[questionId]) {
      return res.status(400).json({ error: 'Cette question a déjà une réponse enregistrée' });
    }

    const questionSnap = await db.collection('questions').doc(questionId).get();
    if (!questionSnap.exists) {
      return res.status(404).json({ error: 'Question introuvable' });
    }
    const question = questionSnap.data();

    const correct = selectedAnswer === question.correctAnswer;
    const safeTimeMs = typeof timeMs === 'number' && timeMs >= 0 ? timeMs : SPEED_BONUS_WINDOW_MS;
    const speedBonus = correct
      ? Math.max(0, Math.round(MAX_SPEED_BONUS * (1 - Math.min(safeTimeMs, SPEED_BONUS_WINDOW_MS) / SPEED_BONUS_WINDOW_MS)))
      : 0;
    const points = correct ? BASE_POINTS + speedBonus : 0;

    await gameRef.update({
      [`answers.${questionId}`]: {
        selected: selectedAnswer,
        correct,
        points,
        timeMs: safeTimeMs,
        difficulty: question.difficulty,
      },
    });

    return res.status(200).json({
      correct,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points,
    });
  } catch (error) {
    console.error('submit-answer error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
