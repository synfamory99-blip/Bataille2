# BATAILLE — V1

Jeu de quiz compétitif. « Qui est le plus fort ? »

## Architecture : pages statiques multiples (pas de SPA)

Décision prise à l'étape 2 : plutôt qu'un routeur SPA (prévu initialement),
le site utilise plusieurs pages HTML statiques (`index.html`, `auth.html`,
puis `theme-select.html`, `game.html`, etc. aux étapes suivantes). C'est
plus simple à maintenir pour un développeur solo, tout aussi compatible
avec Vercel, et évite de construire un routeur maison pour un site qui
reste petit.

## Architecture : fonctions serverless Vercel plutôt que Cloud Functions Firebase

Décision prise pour rester 100% gratuit sans carte bancaire (les Cloud
Functions Firebase exigent le plan payant Blaze) : la logique serveur
(sélection des questions, validation des réponses) vit dans `/api`
(fonctions serverless Vercel, gratuites, déjà utilisées pour l'hébergement)
et utilise le SDK Admin Firebase pour parler à Firestore. Voir
`lib/firebaseAdmin.js` pour la configuration requise.

## Importer les questions sans terminal (alternative simple)

Plutôt que `scripts/import-questions.js` (nécessite Node + firebase-admin en
local), tu peux utiliser `/api/admin-seed-questions` : une fois le projet
déployé sur Vercel avec `FIREBASE_SERVICE_ACCOUNT_KEY` **et**
`ADMIN_SEED_SECRET` définies (voir `.env.example`), ouvre simplement cette
URL dans ton navigateur :

```
https://<ton-projet>.vercel.app/api/admin-seed-questions?secret=<ton ADMIN_SEED_SECRET>
```

Ça importe les 48 questions de test en une requête, sans rien installer.
Redéployable à volonté (ça écrase les questions existantes avec les mêmes
id, sans dupliquer).

## Config Firebase réelle renseignée

`src/firebase/config.js` contient désormais la vraie config du projet Firebase (`bataille-60f91`). Il reste à :
1. Activer Firestore (mode natif) et Authentication (E-mail/Mot de passe + Anonyme) dans la console
2. Déployer `firestore.rules`
3. Générer une clé de compte de service et définir `FIREBASE_SERVICE_ACCOUNT_KEY` sur Vercel
4. Importer les questions de test (`npm run import:questions`)

## État actuel (étape 8 — profil + classement)

Ce qui est **réellement fonctionnel** :
- Tout ce des étapes 1 à 7
- `/api/finish-game` suit maintenant aussi les **victoires/défaites** (uniquement pour les parties de défi) — mis à jour pour les deux joueurs dans la même transaction que le score/XP, y compris le profil de l'adversaire
- `profile.html` : pseudo, niveau avec barre XP, parties jouées, meilleur score, victoires, défaites, série — toutes des stats **réellement stockées**, aucune donnée inventée
- `leaderboard.html` : top 10 par XP + position exacte du joueur (via une requête d'agrégation Firestore, pas un comptage manuel)
- Liens "Classement" / "Profil" ajoutés à la navigation (accueil, choix du thème, défi)
- **Choix d'architecture** : pas de collection `leaderboard` séparée comme évoqué dans le cadrage initial — le classement interroge directement `users` trié par XP (lecture publique déjà autorisée par les règles), ce qui évite une deuxième source de vérité à synchroniser. Section 23 du prompt maître autorise explicitement à adapter la structure.
- **Correctif de sécurité appliqué en cours de route** : le pseudo (choisi librement par l'utilisateur) était injecté via `innerHTML` dans le header et le classement — risque de XSS stocké. Corrigé partout en passant par `textContent`/DOM plutôt que par de l'HTML interpolé, avant toute mise en ligne.

⚠️ Toujours pas testé de bout en bout avec un vrai déploiement.

Ce qui **n'est pas encore implémenté** :
- BATAILLE MIX, QR code pour rejoindre un défi, classements hebdo/mensuel/par thème (prévus "ultérieurement" par le prompt maître, pas dans cette V1)

## État actuel (étape 9 — BATAILLE MIX)

Ce qui est **réellement fonctionnel** :
- Tout ce des étapes 1 à 8
- `lib/selectQuestions.js` : `selectMixQuestions()` applique la répartition fixe du prompt maître (2 Côte d'Ivoire, 2 Football, 2 Musique, 2 Culture générale, 1 Drapeaux & pays, 1 Sciences & techno = 10 questions) — **la somme est vérifiée (10)**, et l'ordre final est re-mélangé pour ne pas grouper les questions par thème
- `/api/start-game` accepte désormais `category: "mix"` en plus des 6 thèmes classiques, en réutilisant exactement la même mécanique de partie (anti-triche, score, XP) que le mode solo normal — aucune duplication de logique
- La carte BATAILLE MIX sur `theme-select.html` est activée et lance une vraie partie

⚠️ Le mode MIX reste réservé aux parties solo pour cette V1 (pas de défi en MIX) — cohérent avec le prompt maître qui ne mentionne le mode mix que pour le jeu normal, pas pour les défis.

⚠️ Toujours pas testé de bout en bout avec un vrai déploiement — vérifié par relecture, validation de syntaxe, et test isolé de la répartition (10 questions confirmées).

Ce qui **n'est pas encore implémenté** :
- QR code pour rejoindre un défi (uniquement "si possible sans complexifier la V1" selon le prompt maître — à évaluer)

## État actuel (étape 10 — responsive + polish)

Ce qui a été fait :
- **Hover desktop** : boutons et cartes cliquables réagissent au survol (souris réelle uniquement — `@media (hover: hover) and (pointer: fine)`, jamais sur tactile pour éviter l'état "collé" après un tap)
- **Animation d'entrée** légère sur chaque page (`page-fade-in` sur `.container`) — subtile, respecte `prefers-reduced-motion` (déjà neutralisée globalement pour qui le demande)
- **Feedback de réponse animé** : les boutons corrects/incorrects ont maintenant un petit "pulse" au lieu d'un simple changement de couleur statique
- **Grilles responsives** : catégories (accueil), thèmes (choix du thème), mini-thèmes (défi), stats (profil) passent de 2 colonnes (mobile) à 3-4 colonnes à partir de 640px — plus rien ne reste écrasé sur tablette/desktop alors que le design reste mobile-first
- **Zones de sécurité (encoche/barre iPhone)** : `env(safe-area-inset-*)` ajouté sur les conteneurs et le bouton Continuer de l'écran de jeu
- `-webkit-tap-highlight-color: transparent` — plus de flash gris disgracieux au tap sur mobile
- Clavier mobile en majuscules automatiques sur le champ de code de bataille
- Accolades CSS vérifiées équilibrées sur tous les fichiers modifiés

⚠️ Honnêteté sur les limites de cette passe : je n'ai **aucun navigateur ni appareil réel** pour tester visuellement ici — tout ça est une relecture attentive du CSS (grilles, breakpoints, tailles de cible tactile ≥48px, media queries), pas un test sur un vrai petit smartphone/tablette/grand écran comme le demande la section 26 du prompt maître. Un aperçu HTML autonome de la page d'accueil (`bataille-apercu.html`) est fourni pour un contrôle visuel rapide, mais teste idéalement toi-même sur un vrai téléphone avant de considérer cette étape validée.

Ce qui **n'est pas encore fait** :
- Vérification des 600 questions finales (toujours 48 de test)
- Tests de sécurité Firestore en conditions réelles
- Déploiement réel

## Rédaction des questions — 600/600 atteintes ✅

**Les 600 questions visées par le prompt maître sont maintenant écrites** (100 par thème × 6 thèmes) :
- `npm run validate:questions` passe (structure, une seule bonne réponse valide, pas de doublon d'id)
- Vérification supplémentaire effectuée sur l'ensemble : **zéro texte de question strictement dupliqué**, sur les 600
- Répartition difficulté finale : 195 faciles, 315 moyennes, 90 difficiles
- Chaque fait a été choisi en évitant les données volatiles (populations exactes, prix, records très récents) pour rester correct dans la durée
- Un sujet a été délibérément écarté après vérification en cours de route : la CAN 2025/2026 (titre retiré au Sénégal vainqueur sur le terrain, réattribué au Maroc par une commission d'appel deux mois après) — trop disputé et instable pour une question de quiz factuelle

⚠️ **Important — ce qui n'a PAS été fait** : ces 600 questions n'ont été vérifiées que par relecture et par des scripts de validation structurelle (format, unicité, cohérence). **Aucune vérification factuelle croisée avec des sources externes** (recherche web, fact-checking systématique) n'a été effectuée pour chacune des 600 — c'est un travail de rédaction à partir de connaissances générales, pas un travail de fact-checking journalistique. Avant un vrai lancement public, une relecture humaine (ou une vérification factuelle plus poussée) reste recommandée, comme le demande d'ailleurs la section 28 du prompt maître ("vérifier les 600 questions avant de déclarer le produit prêt").

⚠️ Les questions n'ont, comme le reste du projet, jamais été testées dans le vrai jeu (pas de déploiement réel) — seulement importées virtuellement dans les fichiers seed et validées structurellement.

Pour importer ces 600 questions une fois déployé : `npm run import:questions` (local) ou `/api/admin-seed-questions?secret=...` (sans terminal, voir plus haut).

## Footer complet + pages d'information + hero "cartes de duel"

- **Footer partagé** (`src/components/footer.js` + `src/styles/footer.css`), injecté sur les 5 pages de navigation (accueil, choix du thème, défi, profil, classement) : 4 colonnes (BATAILLE + description + CTA, navigation, informations, FENEX GROUP), barre de copyright avec **année dynamique** (calculée en JS, jamais codée en dur), liens vers les pages légales
- ⚠️ **Aucune coordonnée ni réseau social inventé pour FENEX GROUP** — aucune information réelle n'a été fournie, donc un placeholder clairement identifié ("Coordonnées à venir") est affiché à la place. À remplacer dès que tu as les vraies informations.
- **6 nouvelles pages créées** : `apropos.html`, `contact.html`, `faq.html`, `regles.html`, `confidentialite.html`, `conditions.html`. FAQ et Règles du jeu contiennent du vrai contenu (dérivé des mécaniques réellement implémentées : score, XP, défi). Contact/Confidentialité/Conditions restent des placeholders explicites — **aucun faux contenu juridique n'a été inventé**, conformément à la consigne.
- **Hero retravaillé** : les deux formes floues remplacées par de vraies "cartes de duel" (mini-cartes avec barre de couleur + lignes, rotation légère, ombre, mouvement au survol desktop), hauteur verticale resserrée pour atteindre les boutons plus vite, texte d'accroche simplifié en "Défie tes amis. Réponds vite. Gagne."
- Cartes de catégories : texte secondaire simplifié en "10 questions"

⚠️ Vérifié : accolades CSS équilibrées sur tous les fichiers (11 fichiers), zéro emoji restant, syntaxe JS validée, et les 14 pages HTML parsent sans erreur. Toujours aucun test visuel réel — l'aperçu `bataille-apercu.html` inclut cette fois le vrai contenu du footer (pas un placeholder), regarde-le en priorité.

## Vraies icônes SVG + écran de jeu retravaillé

Tous les emoji du site (⚔️🏆🎯🔥🥇🥈🥉🇨🇮⚽🌍🎵🏳️🧠⚡🎮, etc.) ont été remplacés par un vrai système d'icônes SVG (`src/utils/icons.js`) : traits réguliers, `currentColor` pour hériter la couleur du texte environnant. Les emoji rendent de façon incohérente selon la plateforme (certains drapeaux ne s'affichent même pas sous Windows) — vérifié : **zéro emoji restant** dans tout le HTML/JS du projet.

- Drapeau de la Côte d'Ivoire rendu en vraies couleurs (pas `currentColor`, un drapeau garde ses couleurs quel que soit le thème)
- Classement : médailles emoji remplacées par des badges de rang colorés (or/argent/bronze) — plus fiable visuellement
- Écran de jeu, repris en profondeur (la partie explicitement demandée en priorité) :
  - **Vraie barre de progression** visuelle en plus du texte "Question X/10"
  - **Pastille de difficulté colorée** (verte/or/rouge) au lieu du texte avec emoji
  - **Icônes check/croix** qui apparaissent sur les réponses une fois validées, avec une micro-animation d'apparition
  - Écran de résultat : icône trophée avec la même mise en scène orchestrée que précédemment, icône flamme pour la série
- Écran de bataille : icône dynamique selon l'issue (épée = en cours, trophée = victoire, croix = défaite, fanion = égalité)

⚠️ Vérifié par relecture complète, recherche automatisée de tout emoji restant (zéro trouvé), équilibre des accolades CSS sur tous les fichiers, validation syntaxique JS de tous les fichiers modifiés, et test de bon parsing HTML sur les 8 pages. Toujours aucun test visuel sur un vrai navigateur — l'aperçu `bataille-apercu.html` (accueil) donne un contrôle rapide, mais l'écran de jeu (le plus retravaillé) mérite vraiment un test de ta part.

## Écran de jeu — refonte immersive (audio + animations)

Refonte complète de l'écran de jeu demandée, en gardant strictement la logique existante (Firebase, API, scoring) intacte :

- **Carte de question surélevée** avec lueur discrète, icône de catégorie, apparition animée
- **Minuterie circulaire visuelle**, purement présentative — elle visualise la fenêtre de 15s déjà utilisée côté serveur pour le bonus de rapidité (`SPEED_BONUS_WINDOW_MS`), mais **n'influence jamais le score réel**, toujours calculé par `/api/submit-answer`
- **Réponses en cascade** : chaque option apparaît avec un léger décalage plutôt que toutes d'un coup
- **Bonne réponse** : icône check, glow, léger burst de confettis CSS, "+XP" flottant, son de validation
- **Mauvaise réponse** : icône croix, shake, la bonne réponse est mise en évidence, son distinct (pas la même sonorité recolorée)
- **Système audio complet** (`src/utils/audio.js`) : effets sonores **synthétisés via Web Audio API** — aucun fichier requis, donc zéro risque de droits d'auteur et zéro dépendance externe. Bouton 🔊/🔇 dans le jeu, préférence persistée (localStorage), déblocage propre au premier tap (contrainte autoplay des navigateurs, jamais d'erreur si Web Audio est indisponible)
- **Musique de fond optionnelle** : purement par fichier (`/audio/background.mp3`, absent par défaut avec un `audio/README.md` expliquant comment l'ajouter) — je ne peux pas télécharger de musique libre de droits dans cet environnement (pas d'accès réseau), donc rien n'est fourni par défaut ; son absence ne casse jamais rien (échec silencieux)
- **Écran de fin** : confettis supplémentaires si victoire, son distinct victoire/défaite, en plus du compteur animé et de la révélation orchestrée déjà en place
- Architecture demandée respectée : un seul point d'entrée `playSound(name)`, rien de dispersé ailleurs dans le code

⚠️ Vérifié par relecture complète, recherche automatisée de tout emoji restant (zéro trouvé), équilibre des accolades CSS, validation syntaxique JS de tous les fichiers modifiés, et parsing HTML de `game.html`. **Je ne peux pas vérifier l'absence d'erreur dans la vraie console du navigateur ni entendre les sons** — aucun navigateur réel ici. Teste en priorité l'écran de jeu complet (son compris, avec et sans l'option "réduire les animations" du système).

## Correctif critique : le bug de l'écran de jeu superposé au score

Signalé avec une capture d'écran : l'écran de jeu (dernière question, bouton Continuer) et l'écran de résultat (BRAVO, score) s'affichaient **en même temps**.

**Cause réelle** : l'attribut `hidden` ne masque pas un élément dont une classe CSS fixe déjà `display` (ex. `.btn` en `inline-flex`, `.game-page`/`.end-screen` en `flex`) — les deux règles ont la même spécificité, et celle chargée en dernier dans la feuille de style l'emporte, donc la classe gagnait sur `[hidden]`. Ce bug touchait aussi (en silence, sans qu'on l'ait remarqué) les boutons Rafraîchir/Revanche de `battle-result.html`.

**Correctif** : une seule règle dans `base.css` — `[hidden] { display: none !important; }` — qui règle tous ces cas d'un coup, de façon garantie.

## Animations gameplay et écran de résultat retravaillées

- **Écran de résultat** : n'apparaît plus qu'une fois l'écran de jeu totalement disparu (conséquence directe du correctif ci-dessus), avec une **arrivée orchestrée** : le trophée "pop" avec un léger rebond, puis chaque ligne (score, points, XP, série) se révèle avec un décalage progressif (staggering) plutôt que tout d'un bloc
- **Le score et les points se comptent** de 0 jusqu'à leur valeur finale (animation JS avec courbe ease-out), au lieu de s'afficher bruts
- **Réponse correcte** : un "pop" nerveux avec léger dépassement (overshoot), sensation de récompense
- **Réponse incorrecte** : un "shake" horizontal — signal clairement différent d'une bonne réponse, pas la même animation recolorée
- **Transition entre deux questions** : léger fondu-sortant puis fondu-entrant, au lieu d'un remplacement instantané et plat du contenu
- Tout respecte `prefers-reduced-motion` (testé dans le raisonnement : bascule immédiate à l'état final sans animation)

⚠️ Corrigé par relecture attentive du CSS/JS et vérification syntaxique — je n'ai toujours aucun navigateur réel ici, donc reteste ce flux (finir une partie) en priorité : c'est l'endroit exact où le bug a été repéré.

## Refonte design system (interface premium)

Reprise complète du système visuel, en gardant l'identité de marque déjà validée (palette violet-nuit/corail/or, esprit duel) mais avec une exécution beaucoup plus soignée :

- **Ombres multicouches** (proche nette + lointaine diffuse) au lieu d'un flou générique unique — plus de profondeur perçue
- **Deux courbes d'animation distinctes** : `--ease-snap` pour le feedback tactile immédiat (boutons, réponses de jeu), `--ease-premium` (ease-out expo) pour les révélations et transitions de mise en page — moins mécanique
- **Header sticky avec flou d'arrière-plan** (`backdrop-filter: blur`), qui gagne une bordure/ombre discrète seulement après quelques pixels de défilement (`.is-scrolled`, piloté par `src/utils/reveal.js`)
- **Révélation progressive au scroll** (`src/utils/reveal.js`, IntersectionObserver) : les sections de l'accueil apparaissent en fondu/translation à l'approche — **dégradation propre assurée** : sans JS ou avec `prefers-reduced-motion`, tout reste visible par défaut
- **Boutons et cartes** : micro-interactions plus riches (élévation au survol desktop, pression légère au clic, bordures très discrètes plutôt qu'aucune ou trop marquées)
- **Hiérarchie typographique affinée** : hauteurs de ligne et espacement des lettres différenciés entre titres/corps, ajout d'un style "eyebrow" (petit label en majuscules) pour donner du contexte avant chaque titre
- **Hero repensé** : formes de "collision" adoucies (flou léger, opacité réduite, easing premium) plutôt que des blocs plats qui claquent à l'arrivée ; boutons alignés horizontalement dès que l'espace le permet

⚠️ Correctif honnête au passage : les cartes de catégories de l'accueil annonçaient "100 questions" alors que seulement 28/thème existent à ce stade — remplacé par "10 questions par partie" (vrai quel que soit l'état de la banque de questions).

⚠️ Comme pour le responsive : relecture attentive du CSS/JS et vérification syntaxique complète, mais aucun test visuel sur un vrai navigateur ici. L'aperçu `bataille-apercu.html` (accueil) donne un contrôle rapide ; le reste des pages hérite automatiquement des mêmes boutons/cartes/header via `base.css`, mais mérite aussi un vrai coup d'œil de ta part.

## Prochaine étape

À toi de jouer : déployer et tester en conditions réelles (voir les instructions plus haut), continuer la rédaction des questions par lots, ou passer aux tests de sécurité Firestore.

Voir `bataille-v1-cadrage.md` pour le cadrage complet (architecture, Firestore, flux, risques, plan par étapes).

## Lancer en local

Ouvrir `index.html` via un petit serveur statique (ex. `npx serve .`) — les imports ES modules ne fonctionnent pas en ouvrant le fichier directement (`file://`).
