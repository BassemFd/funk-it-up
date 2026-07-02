# Funk It Up — Project Context

Portfolio project: a rhythmic auto-runner platformer themed on Jeroboam's
funk album. Purpose is to showcase TypeScript, DDD, GraphQL, Redis, React,
Three.js/react-three-fiber, and PWA in one coherent full-stack app.

Read this file before doing anything else in this repo. It exists so a new
session can pick up without re-deriving context that already cost real time
to figure out.

## Architecture — pnpm/turbo monorepo

```
funk-it-up/
├── packages/domain/   pure TypeScript game rules — zero framework deps
├── apps/api/          Apollo Server 4 (GraphQL + WS) + Redis
├── apps/web/          React + react-three-fiber game client
└── packages/ui/       empty — never started (Storybook design system, someday)
```

`packages/domain` is imported by both `api` and `web` as `@funk-it-up/domain`.
Game rules (Score, Rhythm, Leaderboard, GameSession, Player) live there once,
with no knowledge of GraphQL/Redis/React. Follows strict TDD (red→green→
refactor) and DDD (private constructors + static factories, immutable value
objects — see `packages/domain/src/score/Score.ts` for the canonical
pattern).

## Running it

```bash
docker compose up -d          # Redis (apps/api falls back to in-memory if this isn't running)
pnpm --filter @funk-it-up/api dev   # http://localhost:4000/graphql
pnpm --filter @funk-it-up/web dev   # http://localhost:5173
```

Or `pnpm dev` at the root runs everything via turbo. Tests: `pnpm test`
(root) or scoped with `--filter`. All three packages currently pass: domain
71 tests, api 32 tests, web 35 tests (138 total).

**Gotcha:** leftover `vite` processes from previous sessions squat on 5173
and cause the preview tool to serve a stale bundle (shows blank white page,
or a `CapsuleGeometry`-type runtime error that's actually just stale HMR
state, not a real bug). If the preview looks broken after an edit that
typechecks clean, do this before debugging further:
```bash
pkill -f "vite"; lsof -ti:5173 | xargs -r kill -9
```
then restart via the preview tool.

## What's built (as of the last session)

**Domain** (`packages/domain`): `Score` (combo/multiplier math), `Rhythm`
(lives/health), `BeatEngine`-adjacent `Beat`/`BPM`/`Timestamp`, `GameSession`
(aggregate root, emits domain events), `Player`, `Leaderboard` +
`LeaderboardEntry`.

**API** (`apps/api`): Apollo Server 4 + Express + `graphql-ws` over a shared
HTTP server. GraphQL schema in `src/schema/typeDefs.ts` — Query
(`leaderboard`, `playerRank`, `player`), Mutation (`registerPlayer`,
`loginPlayer`, `submitScore`, plus an older `createPlayer`/`startSession`/
`jump`/`gainRhythm`/`finishSession` session flow that the web client doesn't
actually use — see "Two competing designs" below), Subscription
(`leaderboardUpdated`).

- **Accounts**: `registerPlayer`/`loginPlayer` enforce unique display names
  (case-insensitive, atomic `SET NX` in Redis) and bcrypt-hashed passwords.
  `submitScore` takes a server-issued `token`, never a client-supplied
  playerId/displayName — identity is resolved from the token server-side so
  nobody can submit under someone else's name.
- **Leaderboard**: Redis sorted sets (`ZADD GT` for personal-best-only),
  pub/sub via `graphql-subscriptions`' `PubSub` for live updates. In-memory
  fallback repos mirror every Redis repo's interface for when Redis is down.
- Repos are behind interfaces (`IAccountRepository`, `ILeaderboardRepository`,
  etc.) with Redis + InMemory implementations, DI'd in `server.ts`.

**Web** (`apps/web`): the actual playable game.
- `store/gameStore.ts` — Zustand vanilla store, single source of truth for
  score/rhythm/character state. `registerJump` dedupes by beat number
  (`lastScoredBeat`) — this was a real exploit fix, see "Bugs fixed" below.
  Two distinct miss paths, don't conflate them: `registerJump("MISS", ...)`
  is a mistimed-but-real jump (combo shields it — shatters combo if one's
  active, else costs a rhythm point); `missGap()` is not jumping at all over
  a gap beat (always costs a rhythm point, no combo shield). Both require
  `character.isJumping` to be false to register — call `landCharacter()`
  between simulated jumps in tests, or nothing happens.
- `engine/BeatEngine.ts` — tick-based beat clock, `engine.rateJump()` grades
  PERFECT/GOOD/MISS by proximity to the nearest beat.
- `engine/PlatformGenerator.ts` — deterministic seeded platform layout.
- `scene/components/Character.tsx` — the character model and all its
  animation. **This file has eaten the most iteration this session** — see
  below before touching it.
- `scene/components/FollowCamera.tsx` + `scene/cameraOrbit.ts` +
  `components/CameraTiltControls.tsx` — orbiting "camera on a leash" system,
  controllable via an on-screen D-pad or arrow keys, R to reset.
- Auth: `api/auth.ts` (localStorage token/playerId/displayName),
  `components/StartScreen.tsx` has the register/login form.

## Character.tsx — read this before editing it

The body is built from primitive geometry (boxes + spheres for joints, no
imported 3D asset). Structure, outside-in:
```
meshRef (position — X follows characterVisualX, Y = platform height + jump arc)
  squashRef (dynamic squash/stretch scale, pivoted at the feet)
    facing group (rotation.y = 90°, scale = BASE_SCALE — body modeled facing local +Z, rotated to face world +X)
      hip -> thigh -> knee -> shin -> foot   (×2, left/right)
      pelvis, chest (tapered torso, two boxes not one capsule)
      shoulder -> upper arm -> elbow -> forearm -> hand   (×2, left/right)
      neck -> jaw -> cranium, shades, afro
```

**Local Y=0 is the character's feet**, not the hips. This exists specifically
because the character used to clip into platforms — its origin had no
defined relationship to `PLATFORM_TOP_Y` (which must stay in sync with
`Platforms.tsx`'s `PLATFORM_Y + height/2`, currently `0.2`). Don't reintroduce
a floating magic-number baseline; keep the feet-at-origin invariant.

**Joint rotation sign convention** — this bit us twice (knees, then elbows):
because the body is rotated 90° around Y to face its direction of travel,
**positive `rotation.x` on any limb pivot bends it toward world −X
(backward)**, negative bends it forward. It's not intuitive from the numbers
alone — if you add a new joint and it looks like it's bending the wrong way,
this is almost certainly why. Check `KNEE_BEND`/`ELBOW_BEND` usage in
`useFrame` for the reference sign.

The running gait is one full stride per beat (`bpm / 60` Hz), hips/shoulders
swing in counter-phase, knees bend only during that leg's forward-swing half
of the cycle (never while planted/backward — that inversion is exactly what
made it look like walking backward before the fix).

Jump uses a `sin(π·t)` arc; squash/stretch is velocity-driven (stretched at
takeoff/landing, neutral at apex) plus a damped-cosine landing-impact squash
triggered on the `isJumping: true→false` edge.

## Camera

`FollowCamera.tsx` computes position from spherical coordinates (yaw, pitch)
around the character at a fixed radius (`cameraOrbit.ts` holds the shared
mutable state — same cross-boundary pattern as `characterVisualX.ts`, since
DOM buttons/keyboard live outside the R3F `<Canvas>` but the camera reads the
values every frame inside it). **No lerp on any axis** — the character moves
at constant velocity with no sudden jumps, so lerping toward a continuously
moving target just produces permanent steady-state lag (this was a real bug:
the character sat visibly off-center for exactly this reason). Default
yaw/pitch = pure Mario-style side view.

## Bugs fixed this session (don't reintroduce)

1. **Score-per-beat exploit**: mashing the jump key faster than the beat
   interval but slower than the jump animation let multiple PERFECT/GOOD
   ratings land against the same beat. Fixed via `lastScoredBeat` dedup in
   `gameStore.registerJump`.
2. **Leaderboard identity spoofing**: `submitScore` used to trust a client-
   supplied `playerId`/`displayName` directly. Now resolved server-side from
   a bcrypt-backed account token.
3. **`pubsub.asyncIterableIterator is not a function`**: the correct method
   on `graphql-subscriptions`' `PubSub` (v2) is `asyncIterator`. Silent
   failure otherwise — every subscriber got a GraphQL error with no obvious
   cause.
4. **Camera lag / off-center character**: see Camera section above.
5. **Character sinking into platforms**: see Character.tsx section above.
6. **Knees/elbows bending backward**: sign convention issue, see Character.tsx.
7. **Combo-shield regression**: the score-per-beat exploit fix (#1) accidentally
   dropped the "MISS shatters combo, or costs a rhythm point if no combo is
   active" logic entirely when `registerJump` was refactored — it stopped
   touching score/rhythm at all for MISS ratings. Caught because it broke 4
   existing tests in `__tests__/store/gameStore.test.ts` that were still
   written against the old contract (and needed `landCharacter()` calls added
   between chained jumps, since the exploit fix also made `registerJump` a
   no-op while `character.isJumping` is true). Restored in `registerJump`,
   distinct from `missGap()` — see the gameStore.ts note above.

## Two competing designs in the API (unresolved, worth knowing about)

`GameSessionResolver` implements a full server-authoritative session flow
(`startSession`/`jump`/`gainRhythm`/`finishSession`, mutating a `GameSession`
aggregate server-side) — but the actual web client **doesn't use any of it**.
The client runs gameplay locally in real time (rhythm games can't round-trip
to a server per beat) and only calls the simpler `submitScore` mutation once,
at game over. The session-flow resolver and its tests are still there,
presumably from an earlier design before this constraint became clear. Not
broken, just dead weight from the client's perspective — worth deciding
whether to delete it or actually wire something up to it (e.g. server-side
score validation/anti-cheat) if this comes up again.

## Known-empty / not started

- `packages/ui` — Storybook design system, mentioned early on, never begun.
- Prisma/PostgreSQL — Player/GameSession persistence is Redis + in-memory
  only; a durable relational store was floated but Redis ended up covering
  everything actually needed (accounts + leaderboard) so it never happened.
- PWA icons/manifest polish.
- No CI pipeline configured.

## Real audio — not Spotify (deliberately ruled out)

Spotify integration was seriously considered and explicitly rejected: the
Web Playback SDK requires every listener to have full Spotify Premium (not
Lite/Mini), and since Feb 2026 a new Development Mode app is capped at 5
authorized users total with no clear path out for a portfolio project —
plus the `audio-features` endpoint (the only way to get a track's real BPM
from Spotify) has been fully deprecated for new apps since Nov 2024, no
waitlist, no exceptions. None of that is viable for something meant to be
played by anyone visiting a public portfolio. Don't redo this research
without a strong reason to believe those constraints changed.

Instead, the game plays real tracks from Jéroboam's actual album ("Favorite",
Favorite Recordings) via the Web Audio API directly (`AudioContext` +
`AudioBufferSourceNode`, not an `<audio>` element) — no streaming API, no
OAuth, no premium requirement for anyone.

**`apps/web/src/audio/MusicPlayer.ts` is the game's authoritative clock.**
`BeatLoop.tsx` used to drive `BeatEngine` off Three.js's render clock
(`useFrame`'s `clock.elapsedTime`), which is tied to `requestAnimationFrame`
and can jitter. Now it reads `musicPlayer.getElapsedMs()` every frame instead
— `AudioContext.currentTime` is a hardware audio clock, so the beat grid
can never drift from what's actually audible. `musicPlayer.play()` must be
called synchronously from a user-gesture handler (autoplay policy) — it's
called from `App.tsx`'s `startGame`, not reactively from inside the Canvas.
`window.__musicPlayer` is exposed in dev builds, same pattern as
`window.__gameStore`.

**These audio files are gitignored on purpose (`apps/web/public/audio/` and
`press-kit/` in `.gitignore`) — do not remove that ignore rule.** They're the
album's actual commercial masters plus a real press kit (cover art, press
release, a 288MB live-performance video), licensed for press/media coverage,
not for redistribution via a public git repo — and the video alone is past
GitHub's 100MB/file hard limit regardless. **On a fresh clone, both
directories will be missing** and the game won't have audio to play until
someone places the files back:
- `apps/web/public/audio/01-sweet-addiction.mp3` through `08-the-game.mp3`
  (exact filenames — the game will reference these directly)
- `press-kit/jeroboam-favorite/` — reference material only, not read by the
  app at runtime, safe to skip if you just need the game working

BPM per track needs to be supplied manually (no API for this anymore — see
above). Ask whoever has the files, or estimate it by ear/tooling.

## Verifying changes

For anything touching `apps/web`, actually run it and look — screenshots
alone at the default zoom don't show enough detail to judge the character
model or animation; you often need to force a specific game/jump state via
the dev-only `window.__gameStore` (exposed when `import.meta.env.DEV`) rather
than waiting on real gameplay timing, e.g.:
```js
window.__gameStore.getState().reset();
window.__gameStore.getState().startGame({ bpm: 98, trackId: "jeroboam-funk-01" });
window.__gameStore.getState().registerJump("PERFECT", 1); // force a jump pose
```
