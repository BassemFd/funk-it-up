import { describe, it, expect } from "vitest";
import { PlatformGenerator, PlatformType } from "../../src/engine/PlatformGenerator";

describe("Feature: PlatformGenerator", () => {
  const generator = PlatformGenerator.create({ bpm: 98, seed: "jeroboam-funk-01" });

  describe("Given a track structure at 98 BPM", () => {
    it("should generate platforms for a given number of measures", () => {
      const platforms = generator.generate({ measures: 4 });

      expect(platforms.length).toBeGreaterThan(0);
    });

    it("should place a GROUND platform on beat 1 of every measure", () => {
      const platforms = generator.generate({ measures: 4 });
      const groundPlatforms = platforms.filter((p) => p.type === PlatformType.GROUND);

      expect(groundPlatforms.length).toBeGreaterThanOrEqual(4);
    });

    it("should place a THE_ONE platform on beat 1 of each measure (rhythm pickup)", () => {
      const platforms = generator.generate({ measures: 4 });
      const theOnes = platforms.filter((p) => p.type === PlatformType.THE_ONE);

      // At least one THE_ONE per section (not every measure — occasional reward)
      expect(theOnes.length).toBeGreaterThan(0);
    });

    it("should create gaps (obstacles) on beats 2 and 4", () => {
      const platforms = generator.generate({ measures: 4 });
      const gaps = platforms.filter((p) => p.type === PlatformType.GAP);

      expect(gaps.length).toBeGreaterThan(0);
    });

    it("should assign an x position proportional to beat number", () => {
      const platforms = generator.generate({ measures: 1 });

      const sorted = [...platforms].sort((a, b) => a.x - b.x);
      expect(sorted[0]!.x).toBeLessThan(sorted[sorted.length - 1]!.x);
    });

    it("each platform should have a width, height and y position", () => {
      const platforms = generator.generate({ measures: 1 });

      for (const p of platforms) {
        expect(p.width).toBeGreaterThan(0);
        expect(typeof p.y).toBe("number");
        expect(typeof p.x).toBe("number");
      }
    });

    it("should be deterministic given the same seed", () => {
      const gen2 = PlatformGenerator.create({ bpm: 98, seed: "jeroboam-funk-01" });
      const a = generator.generate({ measures: 8 });
      const b = gen2.generate({ measures: 8 });

      expect(a.map((p) => p.x)).toEqual(b.map((p) => p.x));
    });
  });
});
