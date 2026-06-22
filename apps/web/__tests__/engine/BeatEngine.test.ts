import { describe, it, expect, beforeEach, vi } from "vitest";
import { BeatEngine } from "../../src/engine/BeatEngine";

describe("Feature: BeatEngine", () => {
  describe("Given a track at 98 BPM", () => {
    let engine: BeatEngine;

    beforeEach(() => {
      engine = BeatEngine.create({ bpm: 98 });
    });

    it("should compute the beat interval in ms", () => {
      expect(engine.intervalMs).toBeCloseTo(612.24, 1);
    });

    it("should start at beat 0 with position 0", () => {
      expect(engine.currentBeat).toBe(0);
      expect(engine.elapsedMs).toBe(0);
    });

    it("should advance to beat 1 after one interval", () => {
      engine.tick(613);

      expect(engine.currentBeat).toBe(1);
    });

    it("should advance to beat 4 after 4 intervals", () => {
      engine.tick(2449); // ≈ 4 * 612.24

      expect(engine.currentBeat).toBe(4);
    });

    it("should know the ms position of the next beat", () => {
      expect(engine.nextBeatAt).toBeCloseTo(612.24, 1);
    });

    it("should update nextBeatAt after advancing", () => {
      engine.tick(613);

      expect(engine.nextBeatAt).toBeCloseTo(1224.49, 1);
    });
  });

  describe("Given beat callbacks are registered", () => {
    it("should fire onBeat callback on each beat crossing", () => {
      const engine = BeatEngine.create({ bpm: 98 });
      const beats: number[] = [];

      engine.onBeat((beatNumber) => beats.push(beatNumber));
      engine.tick(1300); // crosses beats 1 and 2

      expect(beats).toContain(1);
      expect(beats).toContain(2);
    });

    it("should fire onDownbeat every 4 beats (the ONE)", () => {
      const engine = BeatEngine.create({ bpm: 98 });
      const downbeats: number[] = [];

      engine.onDownbeat((beat) => downbeats.push(beat));
      engine.tick(2500); // covers beats 0-4

      expect(downbeats).toHaveLength(1);
      expect(downbeats[0]).toBe(4);
    });
  });

  describe("Given a player jump is evaluated", () => {
    it("should rate a jump on beat as PERFECT (within 30ms)", () => {
      const engine = BeatEngine.create({ bpm: 98 });
      engine.tick(600); // just before beat 1 at 612ms

      const rating = engine.rateJump(612);

      expect(rating).toBe("PERFECT");
    });

    it("should rate a jump as GOOD (within 80ms)", () => {
      const engine = BeatEngine.create({ bpm: 98 });
      engine.tick(600);

      const rating = engine.rateJump(660);

      expect(rating).toBe("GOOD");
    });

    it("should rate a jump as MISS (beyond 80ms)", () => {
      const engine = BeatEngine.create({ bpm: 98 });

      const rating = engine.rateJump(306);

      expect(rating).toBe("MISS");
    });
  });

  describe("Given the engine needs to reset", () => {
    it("should return to initial state after reset", () => {
      const engine = BeatEngine.create({ bpm: 98 });
      engine.tick(2000);
      engine.reset();

      expect(engine.currentBeat).toBe(0);
      expect(engine.elapsedMs).toBe(0);
    });
  });
});
