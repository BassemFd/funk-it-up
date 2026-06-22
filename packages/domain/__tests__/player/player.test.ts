import { describe, it, expect } from "vitest";
import { Player } from "../../src/player/Player";
import { PlayerId } from "../../src/player/PlayerId";

describe("Feature: Player", () => {
  describe("Given I want to create a player", () => {
    it("should create a player with a unique id and a display name", () => {
      const player = Player.create({ displayName: "BassLine_Bass" });

      expect(player.id).toBeInstanceOf(PlayerId);
      expect(player.displayName).toBe("BassLine_Bass");
    });

    it("should reject a display name shorter than 2 characters", () => {
      expect(() => Player.create({ displayName: "B" })).toThrow(
        "Display name must be at least 2 characters"
      );
    });

    it("should reject a display name longer than 30 characters", () => {
      expect(() =>
        Player.create({ displayName: "A".repeat(31) })
      ).toThrow("Display name must be at most 30 characters");
    });

    it("should create a player with a Spotify account linked", () => {
      const spotifyId = "spotify:user:jeroboam_fan";
      const player = Player.create({
        displayName: "FunkMaster",
        spotifyId,
      });

      expect(player.spotifyId).toBe(spotifyId);
    });

    it("should create a player with zero total score initially", () => {
      const player = Player.create({ displayName: "FunkMaster" });

      expect(player.totalScore).toBe(0);
    });
  });

  describe("Given a player exists", () => {
    it("should allow reconstituting a player from persistence", () => {
      const id = PlayerId.generate();
      const player = Player.reconstitute({
        id,
        displayName: "GrooveKing",
        spotifyId: null,
        totalScore: 1500,
      });

      expect(player.id).toBe(id);
      expect(player.totalScore).toBe(1500);
    });
  });
});
