import { describe, it, expect } from "vitest";
import { Beat } from "../../src/beat/Beat";
import { BPM } from "../../src/beat/BPM";
import { Timestamp } from "../../src/beat/Timestamp";

describe("Feature: Beat", () => {
  describe("Given a track has a BPM", () => {
    it("should create a valid BPM value object", () => {
      const bpm = BPM.of(98);

      expect(bpm.value).toBe(98);
    });

    it("should reject BPM below 40", () => {
      expect(() => BPM.of(39)).toThrow("BPM must be between 40 and 220");
    });

    it("should reject BPM above 220", () => {
      expect(() => BPM.of(221)).toThrow("BPM must be between 40 and 220");
    });

    it("should compute the interval between beats in milliseconds", () => {
      const bpm = BPM.of(120);

      expect(bpm.intervalMs).toBe(500);
    });

    it("should compute beat interval for Jeroboam-style funk tempo (98 BPM)", () => {
      const bpm = BPM.of(98);

      expect(bpm.intervalMs).toBeCloseTo(612.24, 1);
    });
  });

  describe("Given a beat occurs at a specific moment", () => {
    it("should create a beat with a timestamp and beat number", () => {
      const beat = Beat.create({
        timestamp: Timestamp.of(4000),
        beatNumber: 5,
        bpm: BPM.of(120),
      });

      expect(beat.timestamp.ms).toBe(4000);
      expect(beat.beatNumber).toBe(5);
    });

    it("should know if a player action is on-beat (within tolerance window)", () => {
      const beat = Beat.create({
        timestamp: Timestamp.of(4000),
        beatNumber: 5,
        bpm: BPM.of(120),
      });

      expect(beat.isOnBeat(Timestamp.of(4000))).toBe(true);
      expect(beat.isOnBeat(Timestamp.of(4060))).toBe(true);
      expect(beat.isOnBeat(Timestamp.of(3960))).toBe(true);
    });

    it("should miss the beat when action is outside the tolerance window", () => {
      const beat = Beat.create({
        timestamp: Timestamp.of(4000),
        beatNumber: 5,
        bpm: BPM.of(120),
      });

      expect(beat.isOnBeat(Timestamp.of(4200))).toBe(false);
      expect(beat.isOnBeat(Timestamp.of(3800))).toBe(false);
    });

    it("should rate the action as PERFECT when within 30ms of beat", () => {
      const beat = Beat.create({
        timestamp: Timestamp.of(4000),
        beatNumber: 5,
        bpm: BPM.of(120),
      });

      expect(beat.rate(Timestamp.of(4020))).toBe("PERFECT");
    });

    it("should rate the action as GOOD when within 30–80ms of beat", () => {
      const beat = Beat.create({
        timestamp: Timestamp.of(4000),
        beatNumber: 5,
        bpm: BPM.of(120),
      });

      expect(beat.rate(Timestamp.of(4055))).toBe("GOOD");
    });

    it("should rate the action as MISS when outside tolerance", () => {
      const beat = Beat.create({
        timestamp: Timestamp.of(4000),
        beatNumber: 5,
        bpm: BPM.of(120),
      });

      expect(beat.rate(Timestamp.of(4300))).toBe("MISS");
    });
  });
});
