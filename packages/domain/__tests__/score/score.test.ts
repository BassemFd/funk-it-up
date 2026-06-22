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

    it("should add 0 points and reset combo on MISS", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.MISS);

      expect(score.points).toBe(200);
      expect(score.combo).toBe(0);
    });

    it("should build a combo multiplier with consecutive hits", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT);

      expect(score.combo).toBe(3);
    });

    it("should apply a x2 combo multiplier after 4 consecutive hits", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT);

      expect(score.multiplier).toBe(2);
      expect(score.points).toBe(100 + 100 + 100 + 100 + 200);
    });

    it("should apply a x3 multiplier after 8 consecutive hits", () => {
      let score = Score.empty();
      for (let i = 0; i < 8; i++) score = score.add(BeatRating.PERFECT);

      expect(score.multiplier).toBe(3);
    });

    it("should track the max combo reached during a session", () => {
      const score = Score.empty()
        .add(BeatRating.PERFECT)
        .add(BeatRating.PERFECT)
        .add(BeatRating.MISS)
        .add(BeatRating.PERFECT);

      expect(score.maxCombo).toBe(2);
      expect(score.combo).toBe(1);
    });
  });
});
