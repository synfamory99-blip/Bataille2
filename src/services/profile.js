// BATAILLE — service profil/classement (client)
//
// Contrairement au jeu (score, questions), le profil et le classement
// n'ont rien de secret : firestore.rules autorise déjà leur lecture
// publique (users/{userId} → allow read: if true). Pas besoin de passer
// par une fonction serverless ici — le client peut interroger Firestore
// directement via le SDK, ce qui reste 100% gratuit et plus simple.
//
// Choix d'architecture (étape 8) : on n'a pas créé de collection
// `leaderboard` séparée (dénormalisée) comme évoqué dans le cadrage
// initial — interroger directement `users` triée par xp évite d'avoir
// une deuxième source de vérité à synchroniser, pour un coût identique
// à cette échelle (section 23 du prompt maître : "adapter cette
// structure si une meilleure architecture est nécessaire").

import { db } from '../firebase/init.js';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  getCountFromServer,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function getTopPlayers(topN = 10) {
  const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(topN));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// Rang du joueur = 1 + nombre de joueurs strictement au-dessus en XP.
// Utilise une requête d'agrégation (count), pas besoin de tout charger.
export async function getMyRank(myXp) {
  const q = query(collection(db, 'users'), where('xp', '>', myXp || 0));
  const snap = await getCountFromServer(q);
  return snap.data().count + 1;
}
