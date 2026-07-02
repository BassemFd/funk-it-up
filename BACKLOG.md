# Backlog

What's left to do on Funk It Up, roughly ordered by priority within each
section. See `CLAUDE.md` for how the existing code actually works — this
file is just "what's next", not "how things work".

## 🟠 Prioritaire (dette / décisions en attente)

- **Vérifier le BPM de `04-sleepless-night`** (158.85 détecté) avant de
  jamais le brancher — probable erreur d'octave, le vrai tempo est peut-être
  ~79. Écouter le morceau et comparer avant d'utiliser cette valeur.
- **`GameSessionResolver` (API) à trancher** : implémente un flux de session
  complet côté serveur (`startSession`/`jump`/`gainRhythm`/`finishSession`)
  que le client web n'utilise pas du tout (il joue en local et n'appelle que
  `submitScore` une fois à la fin). Soit le supprimer, soit vraiment
  l'utiliser (ex: validation anti-triche côté serveur).

## 🟡 Fonctionnalités prévues

- **Niveaux par morceau** — permettre de jouer les 8 morceaux de l'album, pas
  juste `sweet-addiction`. Dépend du point "moteur de rythme" ci-dessus
  (chaque morceau a besoin de sa propre carte de temps). Implique un écran
  de sélection de morceau et un `BPM`/`trackId` dynamique au lieu des
  constantes fixes dans `App.tsx`.
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
