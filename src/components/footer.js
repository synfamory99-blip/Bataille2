// BATAILLE — footer partagé (injecté dans #site-footer)
//
// Contenu entièrement statique (pas de donnée utilisateur), donc pas de
// risque XSS à l'utiliser via innerHTML — contrairement au pseudo d'un
// joueur, rien ici ne vient d'une saisie.
//
// Important : e-mail et WhatsApp fournis par l'utilisateur (coordonnées
// réelles de FENEX GROUP). Aucun réseau social n'est affiché tant qu'une
// vraie information n'a pas été communiquée — pas de lien inventé.

import { iconMarkup } from '../utils/icons.js';

export function mountFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;

  const year = new Date().getFullYear();

  el.innerHTML = `
    <div class="footer-inner container">
      <div class="footer-grid">
        <div class="footer-col footer-brand">
          <p class="footer-logo">BATAILLE</p>
          <p class="footer-slogan">Qui est le plus fort ?</p>
          <p class="footer-description">Le quiz où chaque réponse compte. Défie tes amis, teste tes connaissances et grimpe dans le classement.</p>
          <a class="footer-cta" href="/index.html">Jouer maintenant →</a>
        </div>

        <div class="footer-col">
          <p class="footer-col-title">BATAILLE</p>
          <nav class="footer-links" aria-label="Navigation BATAILLE">
            <a href="/index.html">Accueil</a>
            <a href="/theme-select.html">Jouer</a>
            <a href="/leaderboard.html">Classement</a>
            <a href="/profile.html">Profil</a>
            <a href="/challenge.html">Défier un ami</a>
          </nav>
        </div>

        <div class="footer-col">
          <p class="footer-col-title">Informations</p>
          <nav class="footer-links" aria-label="Pages d'information">
            <a href="/apropos.html">À propos</a>
            <a href="/faq.html">FAQ</a>
            <a href="/regles.html">Règles du jeu</a>
            <a href="/contact.html">Contact</a>
            <a href="/confidentialite.html">Politique de confidentialité</a>
            <a href="/conditions.html">Conditions d'utilisation</a>
          </nav>
        </div>

        <div class="footer-col">
          <p class="footer-col-title">FENEX GROUP</p>
          <p class="footer-fenex-tagline">Building What's Next</p>
          <p class="footer-description">BATAILLE est un produit de FENEX GROUP.</p>
          <div class="footer-contact">
            <a href="mailto:fenexgroups225@gmail.com">${iconMarkup('mail')}<span>fenexgroups225@gmail.com</span></a>
            <a href="https://wa.me/2250715791501" target="_blank" rel="noopener noreferrer">${iconMarkup('message')}<span>WhatsApp : +225 07 15 79 15 01</span></a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© ${year} FENEX GROUP. Tous droits réservés.</p>
        <p class="footer-bottom-sub">BATAILLE est un produit de FENEX GROUP.</p>
        <nav class="footer-bottom-links" aria-label="Liens légaux">
          <a href="/confidentialite.html">Confidentialité</a>
          <a href="/conditions.html">Conditions</a>
          <a href="/contact.html">Contact</a>
        </nav>
      </div>
    </div>
  `;
}
