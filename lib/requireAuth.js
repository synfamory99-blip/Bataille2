// BATAILLE — vérifie le token Firebase Auth envoyé dans l'en-tête
// Authorization: Bearer <idToken>. Retourne le token décodé (avec uid)
// ou null si absent/invalide. Utilisé par toutes les routes /api qui
// doivent savoir "qui" fait la requête sans jamais faire confiance à
// un userId envoyé directement dans le corps de la requête.

const { auth } = require('./firebaseAdmin');

async function getAuthenticatedUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    return null;
  }
}

module.exports = { getAuthenticatedUser };
