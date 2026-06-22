import { describe, it, expect, beforeEach } from "vitest";
import { PlayerResolver } from "../../src/resolvers/mutation/PlayerResolver";
import { InMemoryPlayerRepository } from "./helpers/InMemoryPlayerRepository";

describe("Resolver: Player", () => {
  let repo: InMemoryPlayerRepository;
  let resolver: PlayerResolver;

  beforeEach(() => {
    repo = new InMemoryPlayerRepository();
    resolver = new PlayerResolver(repo);
  });

  describe("Mutation: createPlayer", () => {
    it("should create and persist a player", async () => {
      const player = await resolver.createPlayer({
        displayName: "FunkMaster",
      });

      expect(player.id).toBeDefined();
      expect(player.displayName).toBe("FunkMaster");
      expect(player.totalScore).toBe(0);
    });

    it("should persist the player so it can be found", async () => {
      const created = await resolver.createPlayer({ displayName: "GrooveLord" });
      const found = await resolver.player({ id: created.id });

      expect(found?.displayName).toBe("GrooveLord");
    });

    it("should create a player with a Spotify ID", async () => {
      const player = await resolver.createPlayer({
        displayName: "SpotifyFunk",
        spotifyId: "spotify:user:abc123",
      });

      expect(player.spotifyId).toBe("spotify:user:abc123");
    });

    it("should throw if display name is too short", async () => {
      await expect(
        resolver.createPlayer({ displayName: "X" })
      ).rejects.toThrow("Display name must be at least 2 characters");
    });
  });

  describe("Query: player", () => {
    it("should return null for unknown player", async () => {
      const result = await resolver.player({ id: "unknown-id" });

      expect(result).toBeNull();
    });

    it("should return the player by id", async () => {
      const created = await resolver.createPlayer({ displayName: "BassHead" });
      const found = await resolver.player({ id: created.id });

      expect(found?.id).toBe(created.id);
    });
  });
});
