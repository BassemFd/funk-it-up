# Backlog

What's left to do on Funk It Up, roughly ordered by priority within each
section. See `CLAUDE.md` for how the existing code actually works — this
file is just "what's next", not "how things work".

## 🟠 Prioritaire (dette / décisions en attente)

- **Trancher le tempo de `04-sleepless-night` à l'oreille.** L'erreur
  d'octave est maintenant quasi certaine : `aubio tempo` dit 158.85, mais la
  grille `aubio beat` du beatmap généré donne un intervalle médian de 343ms
  (≈ 174.6 BPM effectifs) — le tempo ressenti est probablement ~87. Le
  morceau est sélectionnable dans le jeu mais sa grille est deux fois trop
  dense (un temps tous les 343ms). Après vérification à l'oreille : soit
  régénérer le beatmap en ne gardant qu'un temps sur deux (downsample dans
  `scripts/generate-beatmap.mjs`), soit accepter la densité comme "niveau
  difficile".
- **`GameSessionResolver` (API) à trancher** : implémente un flux de session
  complet côté serveur (`startSession`/`jump`/`gainRhythm`/`finishSession`)
  que le client web n'utilise pas du tout (il joue en local et n'appelle que
  `submitScore` une fois à la fin). Soit le supprimer, soit vraiment
  l'utiliser (ex: validation anti-triche côté serveur).

## 🟡 Fonctionnalités prévues

- **PWA icônes/manifest** — polish, pas fonctionnel actuellement.
- **CI** — aucun pipeline configuré.
- **`packages/ui`** — design system Storybook, mentionné en tout début de
  projet, jamais commencé.
- **Persistence durable (Prisma/PostgreSQL)** — actuellement tout est en
  Redis + in-memory. Envisagé puis abandonné car Redis couvre déjà tout ce
  qui est réellement utilisé (comptes + leaderboard) ; à reconsidérer
  seulement si un vrai besoin de données relationnelles apparaît.

## 🟢 Bonus / idées mises de côté

- **Mix dynamique inspiré de Sackboy: A Big Adventure.** Dans le niveau
  "Uptown Funk" de Sackboy, le mix se réarrange en temps réel selon l'état
  du joueur (pistes séparées : batterie/basse/mélodie/voix, réagencées
  live). Impossible à reproduire à l'identique — on n'a que le mp3 final
  mixé de Jéroboam, pas les pistes séparées du studio (séparation de
  sources = outil lourd type Demucs, pas adapté à "rester simple").
  **Reformulation adaptée à notre jeu** (auto-runner, pas de vrai "arrêt" du
  joueur) : moduler un simple filtre passe-bas (`BiquadFilterNode`) selon le
  combo/rythme actuel — son net quand tu enchaînes les PERFECT, étouffé
  quand tu rates. Pas besoin de pistes séparées, juste un filtre sur l'état
  qu'on a déjà. Volontairement mis de côté pour après la synchro.
