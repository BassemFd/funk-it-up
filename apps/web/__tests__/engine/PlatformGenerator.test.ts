import { describe, it, expect } from "vitest";
import { PlatformGenerator, PlatformType, SCROLL_SPEED } from "../../src/engine/PlatformGenerator";

// Fixture beatmap: energies deliberately spread so percentile thresholds
// land predictably — low energy (0-1) should stay GROUND, mid (2-3) is the
// GAP band, high (4+) is THE_ONE.
const BEATMAP = [
  { timeMs: 0, energy: 1 },
  { timeMs: 500, energy: 1 },
  { timeMs: 1000, energy: 4 }, // would be THE_ONE, but never on beat 0... this is beat 2
  { timeMs: 1500, energy: 3 }, // GAP candidate
  { timeMs: 2000, energy: 3 }, // GAP candidate, but follows a GAP -> forced GROUND
  { timeMs: 2500, energy: 0 },
  { timeMs: 3000, energy: 4 },
  { timeMs: 3500, energy: 1 },
];

describe("Feature: PlatformGenerator", () => {
  describe("Given a real beatmap", () => {
    const generator = PlatformGenerator.create({ beatmap: BEATMAP });

    it("should generate one platform per beat", () => {
      const platforms = generator.generate();

      expect(platforms).toHaveLength(BEATMAP.length);
    });

    it("should always place GROUND on beat 0, regardless of energy", () => {
      const platforms = generator.generate();

      expect(platforms[0]!.type).toBe(PlatformType.GROUND);
    });

    it("should place high-energy beats as THE_ONE", () => {
      const platforms = generator.generate();

      expect(platforms[6]!.type).toBe(PlatformType.THE_ONE); // energy 4
    });

    it("should place mid-energy beats as GAP", () => {
      const platforms = generator.generate();

      expect(platforms[3]!.type).toBe(PlatformType.GAP); // energy 3
    });

    it("should never place two GAPs back to back", () => {
      const platforms = generator.generate();

      for (let i = 1; i < platforms.length; i++) {
        const isDoubleGap = platforms[i]!.type === PlatformType.GAP && platforms[i - 1]!.type === PlatformType.GAP;
        expect(isDoubleGap).toBe(false);
      }
    });

    it("should place low-energy beats as GROUND", () => {
      const platforms = generator.generate();

      expect(platforms[5]!.type).toBe(PlatformType.GROUND); // energy 0
    });

    it("should position platforms by real time, scaled by SCROLL_SPEED", () => {
      const platforms = generator.generate();

      expect(platforms[1]!.x).toBeCloseTo(SCROLL_SPEED * (500 / 1000), 5);
      expect(platforms[4]!.x).toBeCloseTo(SCROLL_SPEED * (2000 / 1000), 5);
    });

    it("should keep x strictly increasing with beat number", () => {
      const platforms = generator.generate();
      const xs = platforms.map((p) => p.x);
      const sorted = [...xs].sort((a, b) => a - b);

      expect(xs).toEqual(sorted);
    });

    it("each platform should have a width, height and beatNumber matching its index", () => {
      const platforms = generator.generate();

      platforms.forEach((p, i) => {
        expect(p.width).toBeGreaterThan(0);
        expect(p.height).toBeGreaterThan(0);
        expect(p.beatNumber).toBe(i);
      });
    });

    it("should be deterministic — same beatmap always produces the same layout", () => {
      const gen2 = PlatformGenerator.create({ beatmap: BEATMAP });

      expect(gen2.generate()).toEqual(generator.generate());
    });
  });

  describe("Given an empty beatmap", () => {
    it("should return no platforms", () => {
      const generator = PlatformGenerator.create({ beatmap: [] });

      expect(generator.generate()).toEqual([]);
    });
  });
});
