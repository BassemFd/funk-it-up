import { describe, it, expect, beforeEach } from "vitest";
import { createGameStore } from "../../src/store/gameStore";

// Minimal beatmap fixture — flat energy keeps every platform GROUND so
// theOneBeats/gapBeats stay empty and don't interfere with score/rhythm tests.
const BEATMAP = [
  { timeMs: 0, energy: 1 },
  { timeMs: 500, energy: 1 },
  { timeMs: 1000, energy: 1 },
  { timeMs: 1500, energy: 1 },
];

describe("Feature: GameStore", () => {
  let store: ReturnType<typeof createGameStore>;

  beforeEach(() => {
    store = createGameStore();
  });

  describe("Given the game is idle", () => {
    it("should start in IDLE state", () => {
      expect(store.getState().status).toBe("IDLE");
    });

    it("should have zero score and full rhythm", () => {
      const { score, rhythm } = store.getState();

      expect(score.points).toBe(0);
      expect(score.combo).toBe(0);
      expect(rhythm.current).toBe(5);
    });

    it("should have the character at the origin", () => {
      const { character } = store.getState();

      expect(character.x).toBe(0);
      expect(character.isJumping).toBe(false);
    });
  });

  describe("Given the player starts the game", () => {
    it("should transition to PLAYING", () => {
      store.getState().startGame({ bpm: 98, trackId: "spotify:track:test", beatmap: BEATMAP });

      expect(store.getState().status).toBe("PLAYING");
    });

    it("should store the track info", () => {
      store.getState().startGame({ bpm: 98, trackId: "spotify:track:test", beatmap: BEATMAP });

      expect(store.getState().trackId).toBe("spotify:track:test");
      expect(store.getState().bpm).toBe(98);
    });
  });

  describe("Given the game is PLAYING", () => {
    beforeEach(() => {
      store.getState().startGame({ bpm: 98, trackId: "spotify:track:test", beatmap: BEATMAP });
    });

    it("should register a PERFECT jump and update score", () => {
      store.getState().registerJump("PERFECT");

      expect(store.getState().score.points).toBe(100);
      expect(store.getState().score.combo).toBe(1);
    });

    it("should register a GOOD jump and add 50 points", () => {
      store.getState().registerJump("GOOD");

      expect(store.getState().score.points).toBe(50);
    });

    it("should shatter combo on MISS when combo is active", () => {
      // registerJump always sets isJumping — a new jump can't register until
      // the previous one lands, same as real gameplay.
      store.getState().registerJump("PERFECT");
      store.getState().landCharacter();
      store.getState().registerJump("PERFECT");
      store.getState().landCharacter();
      store.getState().registerJump("MISS");

      expect(store.getState().score.combo).toBe(0);
      expect(store.getState().rhythm.current).toBe(5);
    });

    it("should lose a rythme on MISS without combo", () => {
      store.getState().registerJump("MISS");

      expect(store.getState().rhythm.current).toBe(4);
    });

    it("should transition to GAME_OVER after 5 rythmes lost", () => {
      for (let i = 0; i < 5; i++) {
        store.getState().registerJump("MISS");
        store.getState().landCharacter();
      }

      expect(store.getState().status).toBe("GAME_OVER");
    });

    it("should mark character as jumping when jump is registered", () => {
      store.getState().registerJump("PERFECT");

      expect(store.getState().character.isJumping).toBe(true);
    });

    it("should land the character after the jump resolves", () => {
      store.getState().registerJump("PERFECT");
      store.getState().landCharacter();

      expect(store.getState().character.isJumping).toBe(false);
    });

    it("should advance character x position on each beat", () => {
      const before = store.getState().character.x;
      store.getState().advanceCharacter({ deltaX: 1.5 });

      expect(store.getState().character.x).toBe(before + 1.5);
    });

    it("should gain a rythme when landing on The One platform", () => {
      store.getState().registerJump("MISS"); // lose one
      store.getState().gainRhythm();

      expect(store.getState().rhythm.current).toBe(5);
    });
  });

  describe("Given the game ends", () => {
    it("should expose final score on GAME_OVER", () => {
      store.getState().startGame({ bpm: 98, trackId: "t", beatmap: BEATMAP });
      store.getState().registerJump("PERFECT"); // 100pts, combo: 1
      store.getState().landCharacter();
      store.getState().registerJump("MISS"); // combo shield — rhythm intact
      store.getState().landCharacter();
      for (let i = 0; i < 5; i++) {
        store.getState().registerJump("MISS"); // 5 rythmes, undefended (no combo)
        store.getState().landCharacter();
      }

      const { score, status } = store.getState();
      expect(status).toBe("GAME_OVER");
      expect(score.points).toBe(100);
    });

    it("should reset to IDLE on restart", () => {
      store.getState().startGame({ bpm: 98, trackId: "t", beatmap: BEATMAP });
      for (let i = 0; i < 5; i++) {
        store.getState().registerJump("MISS");
        store.getState().landCharacter();
      }
      store.getState().reset();

      const state = store.getState();
      expect(state.status).toBe("IDLE");
      expect(state.score.points).toBe(0);
      expect(state.rhythm.current).toBe(5);
      expect(state.character.x).toBe(0);
    });
  });
});
