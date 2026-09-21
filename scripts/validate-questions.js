// BATAILLE — validation des questions
// Vérifie, avant tout import, que chaque question respecte le format
// attendu (section 5 et 28 du prompt maître) : structure complète,
// une seule bonne réponse valide, difficulté connue, pas de doublons.
//
// Usage : node scripts/validate-questions.js

const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname, '..', 'src', 'data', 'questions_seed');
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

function validateFile(filename) {
  const filePath = path.join(SEED_DIR, filename);
  const expectedCategory = path.basename(filename, '.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const questions = JSON.parse(raw);
  const errors = [];
  const idsInFile = new Set();

  questions.forEach((q, index) => {
    const where = `${filename} [index ${index}]`;

    if (!q.id) errors.push(`${where} : id manquant`);
    else if (idsInFile.has(q.id)) errors.push(`${where} : id "${q.id}" dupliqué dans ce fichier`);
    else idsInFile.add(q.id);

    if (q.category !== expectedCategory) {
      errors.push(`${where} : category "${q.category}" ne correspond pas au fichier "${expectedCategory}"`);
    }
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 5) {
      errors.push(`${where} : texte de question manquant ou trop court`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${where} : il faut exactement 4 options (trouvé : ${q.options ? q.options.length : 0})`);
    } else if (new Set(q.options).size !== 4) {
      errors.push(`${where} : deux options identiques`);
    }
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      errors.push(`${where} : correctAnswer doit être un index entre 0 et 3`);
    }
    if (!VALID_DIFFICULTIES.includes(q.difficulty)) {
      errors.push(`${where} : difficulty "${q.difficulty}" invalide (attendu : ${VALID_DIFFICULTIES.join('/')})`);
    }
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length < 10) {
      errors.push(`${where} : explication manquante ou trop courte`);
    }
  });

  return { questions, errors };
}

function main() {
  const files = fs.readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  const allIds = new Set();
  const allErrors = [];
  const countsByCategory = {};
  const countsByDifficulty = { easy: 0, medium: 0, hard: 0 };

  files.forEach((filename) => {
    const { questions, errors } = validateFile(filename);
    allErrors.push(...errors);
    countsByCategory[filename] = questions.length;

    questions.forEach((q) => {
      if (q.id) {
        if (allIds.has(q.id)) allErrors.push(`id "${q.id}" dupliqué entre plusieurs fichiers`);
        allIds.add(q.id);
      }
      if (VALID_DIFFICULTIES.includes(q.difficulty)) countsByDifficulty[q.difficulty]++;
    });
  });

  console.log('--- BATAILLE : validation des questions ---\n');
  Object.entries(countsByCategory).forEach(([file, count]) => {
    console.log(`${file}: ${count} question(s)`);
  });
  console.log(`\nTotal : ${allIds.size} question(s)`);
  console.log(`Répartition difficulté : facile=${countsByDifficulty.easy}, moyen=${countsByDifficulty.medium}, difficile=${countsByDifficulty.hard}\n`);

  if (allErrors.length > 0) {
    console.error(`❌ ${allErrors.length} erreur(s) trouvée(s) :\n`);
    allErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('✅ Toutes les questions sont valides.');
  }
}

main();
