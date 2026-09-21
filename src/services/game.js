// BATAILLE — service de jeu (client)
// Appelle les fonctions serverless Vercel (/api). Le client n'effectue
// jamais lui-même la sélection des questions ni le calcul du score :
// il envoie une sélection, le serveur répond avec le résultat validé.

import { auth } from '../firebase/init.js';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Tu dois être connecté pour jouer.');
  const token = await user.getIdToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function callApi(path, body) {
  const headers = await authHeaders();
  const response = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Une erreur est survenue.');
  return data;
}

export function startGame(category) {
  return callApi('/api/start-game', { category }); // → { gameId, questions }
}

export function submitAnswer(gameId, questionId, selectedAnswer, timeMs) {
  return callApi('/api/submit-answer', { gameId, questionId, selectedAnswer, timeMs });
  // → { correct, correctAnswer, explanation, points }
}

export function finishGame(gameId) {
  return callApi('/api/finish-game', { gameId });
  // → { score, correctCount, totalQuestions, xpEarned, level, streakCount, challengeCode }
}

export function createChallenge(category) {
  return callApi('/api/create-challenge', { category }); // → { challengeId, code, gameId, questions }
}

export function joinChallenge(code) {
  return callApi('/api/join-challenge', { code }); // → { challengeId, code, gameId, questions }
}

export function getChallenge(code) {
  return callApi('/api/get-challenge', { code });
  // → { code, category, status, youAre, youWon, isDraw, player1, player2 }
}
