import { createStore } from "zustand/vanilla";
import { Score, Rhythm } from "@funk-it-up/domain";
import type { BeatRating } from "@funk-it-up/domain";

type GameStatus = "IDLE" | "PLAYING" | "GAME_OVER";

interface CharacterState {
  x: number;
  isJumping: boolean;
}

interface ScoreState {
  points: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
}

interface RhythmState {
  current: number;
  max: number;
  slots: boolean[];
}

interface GameState {
  status: GameStatus;
  trackId: string | null;
  bpm: number | null;
  score: ScoreState;
  rhythm: RhythmState;
  character: CharacterState;

  startGame: (opts: { bpm: number; trackId: string }) => void;
  registerJump: (rating: BeatRating) => void;
  gainRhythm: () => void;
  landCharacter: () => void;
  advanceCharacter: (opts: { deltaX: number }) => void;
  reset: () => void;
}

function toScoreState(score: Score): ScoreState {
  return {
    points: score.points,
    combo: score.combo,
    maxCombo: score.maxCombo,
    multiplier: score.multiplier,
  };
}

function toRhythmState(rhythm: Rhythm): RhythmState {
  return {
    current: rhythm.current,
    max: rhythm.max,
    slots: rhythm.asSlots(),
  };
}

const initialScore = Score.empty();
const initialRhythm = Rhythm.full();

export function createGameStore() {
  return createStore<GameState>((set, get) => ({
    status: "IDLE",
    trackId: null,
    bpm: null,
    score: toScoreState(initialScore),
    rhythm: toRhythmState(initialRhythm),
    character: { x: 0, isJumping: false },

    startGame({ bpm, trackId }) {
      set({
        status: "PLAYING",
        trackId,
        bpm,
        score: toScoreState(Score.empty()),
        rhythm: toRhythmState(Rhythm.full()),
        character: { x: 0, isJumping: false },
      });
    },

    registerJump(rating) {
      const state = get();
      if (state.status !== "PLAYING") return;

      const currentScore = rebuildScore(state.score);
      const currentRhythm = rebuildRhythm(state.rhythm);

      if (rating === "MISS") {
        if (currentScore.hasActiveCombo) {
          // combo shield — shatter combo, rythmes intacts
          set({ score: toScoreState(currentScore.add("MISS")) });
        } else {
          const newRhythm = currentRhythm.lose();
          const newStatus = newRhythm.isDead ? "GAME_OVER" : "PLAYING";
          set({
            rhythm: toRhythmState(newRhythm),
            status: newStatus,
          });
        }
        return;
      }

      set({
        score: toScoreState(currentScore.add(rating)),
        character: { ...state.character, isJumping: true },
      });
    },

    gainRhythm() {
      const state = get();
      const newRhythm = rebuildRhythm(state.rhythm).gain();
      set({ rhythm: toRhythmState(newRhythm) });
    },

    landCharacter() {
      set((state) => ({
        character: { ...state.character, isJumping: false },
      }));
    },

    advanceCharacter({ deltaX }) {
      set((state) => ({
        character: { ...state.character, x: state.character.x + deltaX },
      }));
    },

    reset() {
      set({
        status: "IDLE",
        trackId: null,
        bpm: null,
        score: toScoreState(Score.empty()),
        rhythm: toRhythmState(Rhythm.full()),
        character: { x: 0, isJumping: false },
      });
    },
  }));
}

// Rebuild domain objects from serialized state for computation
function rebuildScore(s: ScoreState): Score {
  let score = Score.empty();
  // Approximate reconstruction: replay combo additions to get the right multiplier state
  // In practice, store holds the domain object reference — this is a test-friendly approach
  for (let i = 0; i < s.combo; i++) score = score.add("PERFECT");
  // Adjust points: the replay above might not match exactly, so we patch
  return patchScore(score, s);
}

function patchScore(score: Score, target: ScoreState): Score {
  // Return a Score that reflects the actual target state
  // We use a lightweight wrapper trick: reconstruct only combo/multiplier correctly
  // The real points are what matter — use combo count for multiplier accuracy
  return Object.assign(Object.create(Object.getPrototypeOf(score)), {
    ...score,
    points: target.points,
    combo: target.combo,
    maxCombo: target.maxCombo,
  }) as Score;
}

function rebuildRhythm(r: RhythmState): Rhythm {
  let rhythm = Rhythm.withMax(r.max);
  const losses = r.max - r.current;
  for (let i = 0; i < losses; i++) rhythm = rhythm.lose();
  return rhythm;
}
