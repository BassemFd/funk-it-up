import { describe, it, expect } from "vitest";
import { Score } from "../../src/score/Score";
import { BeatRating } from "../../src/beat/BeatRating";

describe("Feature: Score", () => {
  describe("Given a player starts with no score", () => {
    it("should initialize at zero with no combo", () => {
      const score = Score.empty();

      expect(score.points).toBe(0);
      expect(score.combo).toBe(0);
      expect(score.maxCombo).toBe(0);
      expect(score.multiplier).toBe(1);
    });
  });

  describe("Given a player hits beats in sequence", () => {
    it("should add 100 points for a PERFECT hit", () => {
      const score = Score.empty().add(BeatRating.PERFECT);

      expect(score.points).toBe(100);
    });

    it("should add 50 points for a GOOD hit", () => {
      const score = Score.empty().add(BeatRating.GOOD);

      expect(score.points).toBe(50);
    });

    it("should build a combo with consecutive non-miss hits", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.GOOD)
        .add(BeatRating.PERFECT);

      expect(score.combo).toBe(3);
    });

    it("should apply a x2 multiplier after 4 consecutive hits", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT) // 100 x1
        .add(BeatRating.PERFECT) // 100 x1
        .add(BeatRating.PERFECT) // 100 x1
        .add(BeatRating.PERFECT) // 100 x1
        .add(BeatRating.PERFECT); // 100 x2

      expect(score.multiplier).toBe(2);
      expect(score.points).toBe(100 + 100 + 100 + 100 + 200);
    });

    it("should apply a x3 multiplier after 8 consecutive hits", () => {
      let score = Score.empty();
      for (let i = 0; i < 8; i++) score = score.add(BeatRating.PERFECT);

      expect(score.multiplier).toBe(3);
    });

    it("should apply a x4 multiplier after 16 consecutive hits", () => {
      let score = Score.empty();
      for (let i = 0; i < 16; i++) score = score.add(BeatRating.PERFECT);

      expect(score.multiplier).toBe(4);
    });
  });

  describe("Given a player misses a beat", () => {
    it("should reset combo to 0 on MISS", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.MISS);

      expect(score.combo).toBe(0);
      expect(score.multiplier).toBe(1);
    });

    it("should not add points on MISS", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.MISS);

      expect(score.points).toBe(100);
    });

    it("should preserve points earned before the MISS", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.MISS);

      expect(score.points).toBe(200);
    });

    it("should track the max combo reached before the MISS", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.MISS)
        .add(BeatRating.PERFECT);

      expect(score.maxCombo).toBe(2);
      expect(score.combo).toBe(1);
    });

    it("should know if a combo was active before the miss (for GameSession miss routing)", () => {
      const withCombo = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT);

      const withoutCombo = Score.empty();

      expect(withCombo.hasActiveCombo).toBe(true);
      expect(withoutCombo.hasActiveCombo).toBe(false);
    });
  });
});
