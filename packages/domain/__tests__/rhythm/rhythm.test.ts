import { describe, it, expect } from "vitest";
import { Rhythm } from "../../src/rhythm/Rhythm";

describe("Feature: Rhythm (vies du joueur)", () => {
  describe("Given a session starts", () => {
    it("should initialize with 5 rythmes at full capacity", () => {
      const rhythm = Rhythm.full();

      expect(rhythm.current).toBe(5);
      expect(rhythm.max).toBe(5);
      expect(rhythm.isAlive).toBe(true);
    });

    it("should support a custom max rythmes", () => {
      const rhythm = Rhythm.withMax(3);

      expect(rhythm.current).toBe(3);
      expect(rhythm.max).toBe(3);
    });

    it("should reject a max below 1", () => {
      expect(() => Rhythm.withMax(0)).toThrow(
        "Rhythm max must be at least 1"
      );
    });
  });

  describe("Given a player misses without a combo", () => {
    it("should lose one rythme", () => {
      const rhythm = Rhythm.full().lose();

      expect(rhythm.current).toBe(4);
    });

    it("should not go below 0", () => {
      const rhythm = Rhythm.withMax(1).lose().lose();

      expect(rhythm.current).toBe(0);
    });

    it("should be dead when current reaches 0", () => {
      const rhythm = Rhythm.withMax(1).lose();

      expect(rhythm.isAlive).toBe(false);
      expect(rhythm.isDead).toBe(true);
    });

    it("should track how many rythmes were lost", () => {
      const rhythm = Rhythm.full().lose().lose().lose();

      expect(rhythm.current).toBe(2);
    });
  });

  describe("Given a player regains a rythme", () => {
    it("should gain one rythme", () => {
      const rhythm = Rhythm.full().lose().lose().gain();

      expect(rhythm.current).toBe(4);
    });

    it("should not exceed max rythmes", () => {
      const rhythm = Rhythm.full().gain();

      expect(rhythm.current).toBe(5);
    });

    it("should come back alive after gaining a rythme from zero", () => {
      const rhythm = Rhythm.withMax(1).lose().gain();

      expect(rhythm.isAlive).toBe(true);
    });
  });

  describe("Given I need to display the rhythm state", () => {
    it("should expose rythmes as an array of booleans for the HUD", () => {
      const rhythm = Rhythm.full().lose().lose();

      expect(rhythm.asSlots()).toEqual([true, true, true, false, false]);
    });
  });
});
