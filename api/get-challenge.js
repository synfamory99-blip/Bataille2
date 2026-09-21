// BATAILLE — POST /api/get-challenge
// Renvoie l'état d'une bataille (pour l'écran de comparaison des scores).
// Réservé aux deux joueurs concernés — pas de lecture publique.

const { db } = require('../lib/firebaseAdmin');
const { getAuthenticatedUser } = require('../lib/requireAuth');

function sanitizePlayer(player) {
  if (!player) return null;
  return {
    pseudo: player.pseudo,
    status: player.status,
    score: player.score,
    correctCount: player.correctCount,
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'Code manquant' });
  }

  try {
    const normalizedCode = code.toUpperCase().trim();
    const snapshot = await db.collection('challenges').where('code', '==', normalizedCode).limit(1).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Bataille introuvable' });
    }
    const challenge = snapshot.docs[0].data();

    const isParticipant =
      challenge.player1.userId === user.uid || (challenge.player2 && challenge.player2.userId === user.uid);
    if (!isParticipant) {
      return res.status(403).json({ error: "Tu ne fais pas partie de cette bataille." });
    }

    const isFinished = challenge.status === 'finished';
    const isDraw = isFinished && challenge.winnerId === null;
    const youWon = isFinished && !isDraw ? challenge.winnerId === user.uid : null;

    return res.status(200).json({
      code: challenge.code,
      category: challenge.category,
      status: challenge.status,
      youAre: challenge.player1.userId === user.uid ? 'player1' : 'player2',
      youWon,
      isDraw,
      player1: sanitizePlayer(challenge.player1),
      player2: sanitizePlayer(challenge.player2),
    });
  } catch (error) {
    console.error('get-challenge error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
