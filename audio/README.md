# Musique de fond (optionnelle)

Les **effets sonores** (clic, bonne/mauvaise réponse, XP, victoire, défaite)
sont entièrement synthétisés en JavaScript (`src/utils/audio.js`, Web Audio
API) — aucun fichier requis, ça fonctionne dès le premier chargement.

La **musique de fond**, en revanche, fonctionne uniquement par fichier :
dépose ici un fichier nommé exactement

```
background.mp3
```

Le jeu tentera automatiquement de le charger en boucle, à faible volume,
dès la première interaction du joueur (contrainte des navigateurs sur
l'autoplay). Si le fichier est absent, aucune erreur : la musique de fond
est simplement silencieuse, le reste du jeu (effets sonores, animations)
continue de fonctionner normalement.

Choisis un morceau **libre de droits** (ex. Pixabay Music, Free Music
Archive avec licence adaptée, ou une musique que tu as composée toi-même)
et vérifie sa licence avant de le mettre en ligne publiquement — je n'ai
pas ajouté de fichier ici pour éviter tout risque de droits d'auteur.
