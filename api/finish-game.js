// BATAILLE — POST /api/finish-game
//
// Calcule le score OFFICIEL d'une partie terminée. Le score affiché
// pendant la partie (feedback immédiat) n'est qu'un aperçu ; celui-ci,
// recalculé ici à partir des réponses enregistrées côté serveur, est
// celui qui sera réellement sauvegardé (section 7 de la stratégie de
// chargement).
//
// Étape 6 : XP, niveau, série quotidienne. Étape 7 : si la partie
// appartient à un défi (games/{id}.challengeId), met aussi à jour le
// document challenges/{id} — score du joueur, et si les deux ont
// terminé, détermine le vainqueur. C'est ce qui relie une partie de
// défi au système de comparaison, sans dupliquer la logique de score.

const { admin, db } = require('../lib/firebaseAdmin');
const { getAuthenticatedUser } = require('../lib/requireAuth');
const { levelForXp, computeXpEarned, computeStreak } = require('../lib/progression');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { gameId } = req.body || {};
  if (!gameId) {
    return res.status(400).json({ error: 'Requête invalide' });
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
    if (game.status === 'finished') {
      // Idempotent : si déjà terminée, on renvoie le résultat déjà calculé
      // plutôt que de recompter les stats du profil une seconde fois.
      const userSnap = await db.collection('users').doc(user.uid).get();
      const userData = userSnap.exists ? userSnap.data() : {};
      return res.status(200).json({
        score: game.score,
        correctCount: game.correctCount,
        totalQuestions: game.questionIds.length,
        xpEarned: game.xpEarned || 0,
        level: userData.level || 1,
        streakCount: userData.streakCount || 0,
        challengeCode: game.challengeCode || null,
      });
    }

    const answers = game.answers || {};
    const answeredIds = Object.keys(answers);
    if (answeredIds.length < game.questionIds.length) {
      return res.status(400).json({
        error: `Partie incomplète : ${answeredIds.length}/${game.questionIds.length} questions répondues.`,
      });
    }

    let score = 0;
    let correctCount = 0;
    game.questionIds.forEach((qId) => {
      const a = answers[qId];
      if (a) {
        score += a.points || 0;
        if (a.correct) correctCount += 1;
      }
    });

    const xpEarned = computeXpEarned(score, answers);
    const userRef = db.collection('users').doc(user.uid);
    const challengeRef = game.challengeId ? db.collection('challenges').doc(game.challengeId) : null;

    let outcome;
    try {
      outcome = await db.runTransaction(async (tx) => {
        // --- Lectures d'abord (règle Firestore : tout lire avant d'écrire) ---
        const freshGameSnap = await tx.get(gameRef);
        const freshGame = freshGameSnap.data();
        if (freshGame.status === 'finished') {
          throw new Error('ALREADY_FINISHED');
        }

        const userSnap = await tx.get(userRef);
        const userData = userSnap.exists ? userSnap.data() : {};

        const challengeSnap = challengeRef ? await tx.get(challengeRef) : null;
        const challenge = challengeSnap && challengeSnap.exists ? challengeSnap.data() : null;

        // Si l'adversaire a déjà fini, on va connaître le vainqueur ici :
        // il faut donc aussi lire son profil pour mettre à jour ses
        // victoires/défaites — toujours pendant la phase de lecture.
        let isPlayer1 = null;
        let otherSlot = null;
        let otherUserRef = null;
        let otherUserSnap = null;
        if (challenge) {
          isPlayer1 = challenge.player1.userId === user.uid;
          otherSlot = isPlayer1 ? challenge.player2 : challenge.player1;
          if (otherSlot && otherSlot.status === 'finished') {
            otherUserRef = db.collection('users').doc(otherSlot.userId);
            otherUserSnap = await tx.get(otherUserRef);
          }
        }

        // --- Calculs ---
        const newXpTotal = (userData.xp || 0) + xpEarned;
        const levelInfo = levelForXp(newXpTotal);
        const streakResult = computeStreak(userData.lastPlayedDate || null);
        const newStreak = streakResult.streakIncrement
          ? (userData.streakCount || 0) + 1
          : streakResult.streakReset
            ? 1
            : (userData.streakCount || 0); // streakUnchanged : déjà joué aujourd'hui

        const bestScore = Math.max(userData.bestScore || 0, score);
        const gamesPlayed = (userData.gamesPlayed || 0) + 1;

        const userUpdate = {
          xp: newXpTotal,
          level: levelInfo.level,
          streakCount: newStreak,
          lastPlayedDate: streakResult.lastPlayedDate,
          gamesPlayed,
          bestScore,
        };

        // Prépare la mise à jour de la bataille (et des victoires/défaites
        // des deux joueurs) AVANT d'écrire, pour pouvoir fusionner le
        // résultat dans userUpdate plutôt que d'émettre deux écritures
        // concurrentes sur le même document.
        let challengeUpdate = null;
        let otherUserUpdate = null;
        if (challenge) {
          const slotKey = isPlayer1 ? 'player1' : 'player2';
          const updatedSlot = { ...challenge[slotKey], score, correctCount, status: 'finished' };
          challengeUpdate = { [slotKey]: updatedSlot };

          if (otherSlot && otherSlot.status === 'finished') {
            challengeUpdate.status = 'finished';
            const otherUserData = otherUserSnap.exists ? otherUserSnap.data() : {};

            if (updatedSlot.score > otherSlot.score) {
              challengeUpdate.winnerId = updatedSlot.userId;
              userUpdate.wins = (userData.wins || 0) + 1;
              otherUserUpdate = { losses: (otherUserData.losses || 0) + 1 };
            } else if (otherSlot.score > updatedSlot.score) {
              challengeUpdate.winnerId = otherSlot.userId;
              userUpdate.losses = (userData.losses || 0) + 1;
              otherUserUpdate = { wins: (otherUserData.wins || 0) + 1 };
            } else {
              challengeUpdate.winnerId = null; // égalité : ni victoire ni défaite
            }
          }
        }

        // --- Écritures ---
        tx.update(gameRef, {
          status: 'finished',
          score,
          correctCount,
          xpEarned,
          finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (userSnap.exists) {
          tx.update(userRef, userUpdate);
        } else {
          // Profil minimal créé à la volée (ex. compte invité/anonyme).
          tx.set(userRef, {
            pseudo: null,
            avatar: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            wins: 0,
            losses: 0,
            ...userUpdate,
          });
        }

        if (challengeUpdate) {
          tx.update(challengeRef, challengeUpdate);
        }
        if (otherUserRef && otherUserUpdate) {
          tx.update(otherUserRef, otherUserUpdate);
        }

        return { level: levelInfo.level, streakCount: newStreak };
      });
    } catch (txError) {
      if (txError.message === 'ALREADY_FINISHED') {
        // Deux appels concurrents à finish-game pour la même partie :
        // on renvoie le résultat déjà enregistré plutôt qu'une erreur.
        const finishedSnap = await gameRef.get();
        const finishedGame = finishedSnap.data();
        const userSnap = await userRef.get();
        const userData = userSnap.exists ? userSnap.data() : {};
        return res.status(200).json({
          score: finishedGame.score,
          correctCount: finishedGame.correctCount,
          totalQuestions: finishedGame.questionIds.length,
          xpEarned: finishedGame.xpEarned || 0,
          level: userData.level || 1,
          streakCount: userData.streakCount || 0,
          challengeCode: finishedGame.challengeCode || null,
        });
      }
      throw txError;
    }

    return res.status(200).json({
      score,
      correctCount,
      totalQuestions: game.questionIds.length,
      xpEarned,
      level: outcome.level,
      streakCount: outcome.streakCount,
      challengeCode: game.challengeCode || null,
    });
  } catch (error) {
    console.error('finish-game error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
