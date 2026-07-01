import { createStore } from "zustand/vanilla";
import { Score, Rhythm } from "@funk-it-up/domain";
import type { BeatRating } from "@funk-it-up/domain";
import { PlatformGenerator, PlatformType } from "../engine/PlatformGenerator";

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

export interface GameState {
  status: GameStatus;
  trackId: string | null;
  bpm: number | null;
  score: ScoreState;
  rhythm: RhythmState;
  character: CharacterState;
  lastRating: BeatRating | null;
  theOneBeats: Set<number>;

  startGame: (opts: { bpm: number; trackId: string }) => void;
  registerJump: (rating: BeatRating, beatNumber?: number) => void;
  missGap: () => void;
  gainRhythm: () => void;
  landCharacter: () => void;
  advanceCharacter: (opts: { deltaX: number }) => void;
  clearRating: () => void;
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
    lastRating: null,
    theOneBeats: new Set(),

    startGame({ bpm, trackId }) {
      const generator = PlatformGenerator.create({ bpm, seed: trackId });
      const platforms = generator.generate({ measures: 32 });
      const theOneBeats = new Set(
        platforms
          .filter((p) => p.type === PlatformType.THE_ONE)
          .map((p) => p.beatNumber),
      );
      set({
        status: "PLAYING",
        trackId,
        bpm,
        score: toScoreState(Score.empty()),
        rhythm: toRhythmState(Rhythm.full()),
        character: { x: 0, isJumping: false },
        lastRating: null,
        theOneBeats,
      });
    },

    registerJump(rating, beatNumber) {
      const state = get();
      if (state.status !== "PLAYING") return;
      if (state.character.isJumping) return; // already airborne

      // Character always jumps regardless of timing rating
      const updates: Partial<GameState> = {
        lastRating: rating,
        character: { ...state.character, isJumping: true },
      };

      if (rating !== "MISS") {
        const currentScore = rebuildScore(state.score);
        let newRhythm = rebuildRhythm(state.rhythm);
        if (beatNumber !== undefined && state.theOneBeats.has(beatNumber)) {
          newRhythm = newRhythm.gain();
        }
        Object.assign(updates, {
          score: toScoreState(currentScore.add(rating)),
          rhythm: toRhythmState(newRhythm),
        });
      }

      set(updates as GameState);
    },

    missGap() {
      const state = get();
      if (state.status !== "PLAYING") return;
      if (state.character.isJumping) return; // player cleared the gap

      const newRhythm = rebuildRhythm(state.rhythm).lose();
      set({
        lastRating: "MISS",
        rhythm: toRhythmState(newRhythm),
        status: newRhythm.isDead ? ("GAME_OVER" as GameStatus) : ("PLAYING" as GameStatus),
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

    clearRating() {
      set({ lastRating: null });
    },

    reset() {
      set({
        status: "IDLE",
        trackId: null,
        bpm: null,
        score: toScoreState(Score.empty()),
        rhythm: toRhythmState(Rhythm.full()),
        character: { x: 0, isJumping: false },
        lastRating: null,
        theOneBeats: new Set(),
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
