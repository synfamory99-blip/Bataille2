// BATAILLE — service d'authentification
//
// Couvre : inscription (email/mot de passe), connexion, mode invité
// (anonyme, pour "essayer avant de créer un compte" — section 22 du
// prompt maître), déconnexion, et écoute de l'état de connexion.
//
// À l'inscription, un document users/{uid} minimal est créé directement
// depuis le client : c'est autorisé par firestore.rules (règle "create")
// car seuls pseudo/avatar sont fournis par l'utilisateur — xp, level,
// streakCount, etc. sont fixés à leurs valeurs de départ et ne pourront
// plus être modifiés que par les Cloud Functions par la suite.

import { auth, db } from '../firebase/init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

function friendlyError(error) {
  const map = {
    'auth/email-already-in-use': 'Cet e-mail est déjà utilisé.',
    'auth/invalid-email': 'E-mail invalide.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/user-not-found': 'Aucun compte avec cet e-mail.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives, réessaie dans quelques minutes.',
  };
  return map[error.code] || 'Une erreur est survenue. Réessaie.';
}

export async function signUp(pseudo, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: pseudo });
    await setDoc(doc(db, 'users', cred.user.uid), {
      pseudo,
      avatar: null,
      createdAt: serverTimestamp(),
      level: 1,
      xp: 0,
      streakCount: 0,
      lastPlayedDate: null,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      bestScore: 0,
    });
    return { user: cred.user };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function continueAsGuest() {
  try {
    const cred = await signInAnonymously(auth);
    return { user: cred.user };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
