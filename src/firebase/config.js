// BATAILLE — configuration Firebase (projet réel)
//
// Ces valeurs ne sont pas secrètes en elles-mêmes (c'est la config
// publique du SDK web) — la sécurité repose entièrement sur
// firestore.rules et sur le fait que les opérations sensibles passent
// par les fonctions serverless (/api), qui utilisent une clé de compte
// de service séparée (voir lib/firebaseAdmin.js), elle bien secrète.

export const firebaseConfig = {
  apiKey: "AIzaSyBDvbrPkuxfS8zcw9jIh8pk_tjPhDqYrY8",
  authDomain: "bataille-60f91.firebaseapp.com",
  projectId: "bataille-60f91",
  storageBucket: "bataille-60f91.firebasestorage.app",
  messagingSenderId: "105925001072",
  appId: "1:105925001072:web:f0cd9a7013845b0d9119b5",
  measurementId: "G-PJKPH5KEG4",
};
