// BATAILLE — POST /api/join-challenge
//
// Joueur B entre le code. On ne recrée JAMAIS une nouvelle série de
// questions : on réutilise telle quelle celle figée sur le défi par
// create-challenge (section 5 de la stratégie de chargement).
// Gère aussi le cas où l'appelant est déjà player1 ou player2 (rejoue
// la page, retrouve sa propre partie sans en recréer une autre).

const { admin, db } = require('../lib/firebaseAdmin');
const { getAuthenticatedUser } = require('../lib/requireAuth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code invalide' });
  }

  try {
    const normalizedCode = code.toUpperCase().trim();
    const snapshot = await db.collection('challenges').where('code', '==', normalizedCode).limit(1).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Aucune bataille trouvée avec ce code.' });
    }
    const challengeDoc = snapshot.docs[0];
    const challenge = challengeDoc.data();

    if (challenge.player1.userId === user.uid) {
      return res.status(200).json({
        challengeId: challengeDoc.id,
        code: challenge.code,
        category: challenge.category,
        gameId: challenge.player1.gameId,
        questions: challenge.questions,
      });
    }
    if (challenge.player2 && challenge.player2.userId === user.uid) {
      return res.status(200).json({
        challengeId: challengeDoc.id,
        code: challenge.code,
        category: challenge.category,
        gameId: challenge.player2.gameId,
        questions: challenge.questions,
      });
    }
    if (challenge.player2) {
      return res.status(403).json({ error: 'Cette bataille est déjà complète.' });
    }

    const pseudo = user.name || 'Invité';
    const gameRef = db.collection('games').doc();

    await gameRef.set({
      userId: user.uid,
      category: challenge.category,
      questionIds: challenge.questionIds,
      answers: {},
      status: 'in_progress',
      challengeId: challengeDoc.id,
      challengeCode: challenge.code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await challengeDoc.ref.update({
      player2: {
        userId: user.uid,
        pseudo,
        gameId: gameRef.id,
        status: 'playing',
        score: null,
        correctCount: null,
      },
      status: 'in_progress',
    });

    return res.status(200).json({
      challengeId: challengeDoc.id,
      code: challenge.code,
      category: challenge.category,
      gameId: gameRef.id,
      questions: challenge.questions,
    });
  } catch (error) {
    console.error('join-challenge error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
