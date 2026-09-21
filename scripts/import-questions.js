// BATAILLE — import des questions vers Firestore
//
// Nécessite le package "firebase-admin" (npm install firebase-admin)
// et une clé de compte de service Firebase (Console Firebase > Paramètres
// du projet > Comptes de service > Générer une nouvelle clé privée).
//
// Usage :
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/import-questions.js
//
// Ce script écrit dans la collection "questions" via l'Admin SDK, qui
// contourne les règles de sécurité Firestore (normal : c'est un outil
// d'administration, pas le client final). Il ne doit jamais être exécuté
// depuis le navigateur.
//
// Important (section 28 du prompt maître) : ce script importe les
// questions de TEST (48, dans src/data/questions_seed). Avant le
// lancement réel, les 600 questions définitives devront être ajoutées
// aux fichiers seed et repasser par validate-questions.js.

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const SEED_DIR = path.join(__dirname, '..', 'src', 'data', 'questions_seed');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function importQuestions() {
  const files = fs.readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  let total = 0;

  for (const filename of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(SEED_DIR, filename), 'utf-8'));
    // Firestore limite les batchs à 500 écritures ; largement suffisant ici (100/thème).
    const batch = db.batch();
    questions.forEach((q) => {
      const ref = db.collection('questions').doc(q.id);
      batch.set(ref, q);
    });
    await batch.commit();
    console.log(`✅ ${filename} : ${questions.length} question(s) importée(s)`);
    total += questions.length;
  }

  console.log(`\nTerminé : ${total} question(s) au total dans Firestore.`);
}

importQuestions().catch((error) => {
  console.error('❌ Échec de l\'import :', error.message);
  process.exit(1);
});
