// BATAILLE — système audio du jeu
//
// Choix assumé : les effets sonores sont SYNTHÉTISÉS via la Web Audio
// API plutôt que chargés depuis des fichiers .mp3. Deux raisons :
// 1) impossible de fournir des fichiers audio réels libres de droits
//    dans cet environnement (pas d'accès réseau pour en télécharger) ;
// 2) ça évite tout risque de droits d'auteur et toute dépendance
//    externe — le jeu fonctionne à 100% dès le premier chargement,
//    sans fichier à héberger.
//
// La musique de fond, en revanche, est purement à base de fichier
// (/audio/background.mp3) car une musique de fond synthétisée sonne
// presque toujours mauvaise ou agaçante — le prompt demande explicitement
// d'éviter cet effet "casino". Si le fichier n'existe pas, la musique de
// fond est simplement absente, sans erreur ni son cassé.
//
// Architecture demandée respectée : playSound(name) et un seul point
// d'entrée pour toute la logique audio, rien de dispersé ailleurs.

const STORAGE_KEY = 'bataille_audio_prefs';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false };
    const parsed = JSON.parse(raw);
    return { muted: !!parsed.muted };
  } catch {
    return { muted: false };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // stockage indisponible (navigation privée, etc.) — on continue sans persister
  }
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.prefs = loadPrefs();
    this.unlocked = false;
    this.music = null; // <audio> pour la musique de fond, créé seulement si le fichier existe
  }

  // La Web Audio API interdit de démarrer un son avant une interaction
  // utilisateur (politique d'autoplay). On appelle ceci au premier tap
  // n'importe où sur la page — jamais avant, jamais d'erreur si l'appel
  // arrive plusieurs fois.
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.ctx = null; // Web Audio indisponible : le jeu continue sans son, jamais bloquant
    }
    this._tryStartMusic();
  }

  get muted() {
    return this.prefs.muted;
  }

  toggleMute() {
    this.prefs.muted = !this.prefs.muted;
    savePrefs(this.prefs);
    if (this.music) this.music.muted = this.prefs.muted;
    if (!this.prefs.muted && !this.music) this._tryStartMusic();
    return this.prefs.muted;
  }

  // Enveloppe simple (attaque rapide, relâchement doux) pour qu'un ton
  // synthétisé sonne comme un vrai effet plutôt qu'un bip brut.
  _tone(freq, startTime, duration, { type = 'sine', gain = 0.18, glideTo = null } = {}) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, startTime + duration);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gainNode).connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  playSound(name) {
    if (this.prefs.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'click':
        this._tone(520, t, 0.06, { type: 'triangle', gain: 0.12 });
        break;
      case 'correct':
        this._tone(660, t, 0.12, { type: 'sine', gain: 0.16 });
        this._tone(880, t + 0.09, 0.16, { type: 'sine', gain: 0.16 });
        break;
      case 'wrong':
        this._tone(220, t, 0.22, { type: 'sawtooth', gain: 0.12, glideTo: 130 });
        break;
      case 'next':
        this._tone(440, t, 0.07, { type: 'triangle', gain: 0.1 });
        break;
      case 'xp':
        this._tone(523, t, 0.09, { type: 'sine', gain: 0.14 });
        this._tone(659, t + 0.07, 0.09, { type: 'sine', gain: 0.14 });
        this._tone(784, t + 0.14, 0.14, { type: 'sine', gain: 0.14 });
        break;
      case 'victory':
        this._tone(523, t, 0.14, { type: 'sine', gain: 0.16 });
        this._tone(659, t + 0.12, 0.14, { type: 'sine', gain: 0.16 });
        this._tone(784, t + 0.24, 0.14, { type: 'sine', gain: 0.16 });
        this._tone(1047, t + 0.36, 0.28, { type: 'sine', gain: 0.18 });
        break;
      case 'defeat':
        this._tone(392, t, 0.2, { type: 'sine', gain: 0.14 });
        this._tone(311, t + 0.16, 0.3, { type: 'sine', gain: 0.14 });
        break;
      default:
        break;
    }
  }

  // Tente de démarrer /audio/background.mp3 en boucle, volume faible.
  // Absence de fichier (404) ou blocage autoplay : échec silencieux,
  // jamais d'erreur visible ni de son cassé. Dépose ton propre fichier
  // (libre de droits) à ce chemin pour l'activer.
  _tryStartMusic() {
    if (this.music || this.prefs.muted) return;
    const audio = new Audio('/audio/background.mp3');
    audio.loop = true;
    audio.volume = 0.12;
    audio.muted = this.prefs.muted;
    audio.play().then(() => { this.music = audio; }).catch(() => { /* pas de fichier ou autoplay bloqué : silence propre, on retentera au prochain appel */ });
  }
}

export const audioManager = new AudioManager();

// Raccourci demandé par le cahier des charges : playSound("correct") etc.
export function playSound(name) {
  audioManager.playSound(name);
}
