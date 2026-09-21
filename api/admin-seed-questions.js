// BATAILLE — GET/POST /api/admin-seed-questions?secret=...
//
// Alternative à scripts/import-questions.js pour ceux qui ne veulent pas
// installer Node/firebase-admin en local : cette fonction tourne sur
// Vercel (qui a déjà accès à FIREBASE_SERVICE_ACCOUNT_KEY) et s'exécute
// simplement en ouvrant son URL dans un navigateur, avec le bon secret.
//
// Protégée par une variable d'environnement ADMIN_SEED_SECRET (à définir
// sur Vercel, une chaîne aléatoire que tu choisis toi-même) — sans elle,
// n'importe qui pourrait réimporter/écraser les questions.
//
// Les fichiers JSON sont importés statiquement (require) plutôt que lus
// dynamiquement sur le disque, pour que Vercel les inclue à coup sûr
// dans le déploiement de la fonction.

const { db } = require('../lib/firebaseAdmin');

const SEED_FILES = {
  cote_ivoire: require('../src/data/questions_seed/cote_ivoire.json'),
  football: require('../src/data/questions_seed/football.json'),
  culture_generale: require('../src/data/questions_seed/culture_generale.json'),
  musique: require('../src/data/questions_seed/musique.json'),
  drapeaux_pays: require('../src/data/questions_seed/drapeaux_pays.json'),
  sciences_technologie: require('../src/data/questions_seed/sciences_technologie.json'),
};

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const providedSecret = req.query?.secret || (req.body && req.body.secret);
  if (!process.env.ADMIN_SEED_SECRET) {
    return res.status(500).json({
      error: 'ADMIN_SEED_SECRET non définie sur Vercel — ajoute cette variable d\'environnement avant d\'utiliser cette route.',
    });
  }
  if (providedSecret !== process.env.ADMIN_SEED_SECRET) {
    return res.status(403).json({ error: 'Secret invalide' });
  }

  try {
    const summary = [];
    let total = 0;

    for (const [category, questions] of Object.entries(SEED_FILES)) {
      const batch = db.batch();
      questions.forEach((q) => {
        batch.set(db.collection('questions').doc(q.id), q);
      });
      // eslint-disable-next-line no-await-in-loop -- 6 catégories seulement
      await batch.commit();
      summary.push(`${category}: ${questions.length} question(s)`);
      total += questions.length;
    }

    return res.status(200).json({
      message: `Import terminé : ${total} question(s) au total.`,
      summary,
    });
  } catch (error) {
    console.error('admin-seed-questions error:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};
