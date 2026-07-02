import { describe, it, expect, beforeEach } from "vitest";
import { BeatEngine } from "../../src/engine/BeatEngine";

// Fixture: irregular real-world-shaped timestamps (lead-in silence, then
// beats with natural timing variance) — deliberately not a fixed interval,
// since that's exactly the assumption we're testing has been removed.
const BEATS_MS = [1000, 1600, 2100, 2650, 3150, 3700];

describe("Feature: BeatEngine", () => {
  describe("Given a real beatmap", () => {
    let engine: BeatEngine;

    beforeEach(() => {
      engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
    });

    it("should start before the first beat", () => {
      expect(engine.currentBeat).toBe(-1);
      expect(engine.elapsedMs).toBe(0);
    });

    it("should advance to beat 0 once elapsed time reaches the first real timestamp", () => {
      engine.tick(BEATS_MS[0]! + 1);

      expect(engine.currentBeat).toBe(0);
    });

    it("should advance to beat 4 once elapsed time reaches the 5th real timestamp", () => {
      engine.tick(BEATS_MS[4]! + 1);

      expect(engine.currentBeat).toBe(4);
    });

    it("should know the ms position of the next real beat", () => {
      expect(engine.nextBeatAt).toBe(BEATS_MS[0]!);
    });

    it("should update nextBeatAt after advancing", () => {
      engine.tick(BEATS_MS[0]! + 1);

      expect(engine.nextBeatAt).toBe(BEATS_MS[1]!);
    });

    it("should report Infinity past the last beat", () => {
      engine.tick(BEATS_MS[BEATS_MS.length - 1]! + 1);

      expect(engine.nextBeatAt).toBe(Infinity);
    });
  });

  describe("Given beat callbacks are registered", () => {
    it("should fire onBeat callback on each beat crossing", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
      const beats: number[] = [];

      engine.onBeat((beatNumber) => beats.push(beatNumber));
      engine.tick(BEATS_MS[1]! + 1); // crosses beats 0 and 1

      expect(beats).toContain(0);
      expect(beats).toContain(1);
    });

    it("should fire onDownbeat every 4 beats (the ONE)", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
      const downbeats: number[] = [];

      engine.onDownbeat((beat) => downbeats.push(beat));
      engine.tick(BEATS_MS[4]! + 1); // covers beats 0–4

      expect(downbeats).toHaveLength(1);
      expect(downbeats[0]).toBe(4);
    });
  });

  describe("Given a player jump is evaluated", () => {
    it("should rate a jump on beat as PERFECT (within 30ms)", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
      engine.tick(BEATS_MS[0]! - 20);

      const rating = engine.rateJump(BEATS_MS[0]!);

      expect(rating).toBe("PERFECT");
    });

    it("should rate a jump as GOOD (within 80ms)", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
      engine.tick(BEATS_MS[0]! - 20);

      const rating = engine.rateJump(BEATS_MS[0]! + 60);

      expect(rating).toBe("GOOD");
    });

    it("should rate a jump as MISS (beyond 80ms)", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });

      const rating = engine.rateJump(BEATS_MS[0]! - 300);

      expect(rating).toBe("MISS");
    });

    it("should resolve the nearest real beat index for scoring, not a formula", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
      engine.tick(BEATS_MS[2]! - 10);

      expect(engine.nearestBeatIndex(BEATS_MS[2]! + 5)).toBe(2);
    });
  });

  describe("Given the engine needs to reset", () => {
    it("should return to initial state after reset", () => {
      const engine = BeatEngine.create({ beatTimestampsMs: BEATS_MS });
      engine.tick(2000);
      engine.reset();

      expect(engine.currentBeat).toBe(-1);
      expect(engine.elapsedMs).toBe(0);
    });
  });
});
