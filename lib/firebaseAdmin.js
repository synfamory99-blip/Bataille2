// BATAILLE — initialisation Firebase Admin (côté serveur uniquement)
//
// Utilisé par les fonctions serverless Vercel dans /api. Nécessite la
// variable d'environnement FIREBASE_SERVICE_ACCOUNT_KEY sur Vercel,
// contenant le JSON complet de la clé de compte de service Firebase
// (Console Firebase > Paramètres du projet > Comptes de service >
// Générer une nouvelle clé privée), copié tel quel en une seule ligne.
//
// Ne jamais exposer ce fichier ou la clé au client : il ne doit être
// importé que par du code exécuté dans /api (serveur), jamais dans /src.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY manquante — à définir dans les variables d\'environnement Vercel.'
    );
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = {
  admin,
  db: admin.firestore(),
  auth: admin.auth(),
};
