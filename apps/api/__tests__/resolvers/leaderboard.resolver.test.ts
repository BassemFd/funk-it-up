import { describe, it, expect, beforeEach } from "vitest";
import { LeaderboardResolver } from "../../src/resolvers/query/LeaderboardResolver";
import { InMemoryLeaderboardRepository } from "./helpers/InMemoryLeaderboardRepository";
import { InMemoryAccountRepository } from "./helpers/InMemoryAccountRepository";
import { LeaderboardEntry, PlayerId } from "@funk-it-up/domain";

const TRACK_ID = "spotify:track:jeroboam_funk_01";

const makeEntry = (displayName: string, points: number) =>
  LeaderboardEntry.create({
    playerId: PlayerId.generate(),
    displayName,
    points,
    maxCombo: Math.floor(points / 100),
    trackId: TRACK_ID,
  });

describe("Resolver: Leaderboard", () => {
  let repo: InMemoryLeaderboardRepository;
  let accountRepo: InMemoryAccountRepository;
  let resolver: LeaderboardResolver;

  beforeEach(() => {
    repo = new InMemoryLeaderboardRepository();
    accountRepo = new InMemoryAccountRepository();
    resolver = new LeaderboardResolver(repo, accountRepo);
  });

  describe("Query: leaderboard", () => {
    it("should return an empty leaderboard for an unknown track", async () => {
      const board = await resolver.leaderboard({ trackId: TRACK_ID });

      expect(board.trackId).toBe(TRACK_ID);
      expect(board.entries).toHaveLength(0);
    });

    it("should return entries sorted by rank", async () => {
      await repo.submit(makeEntry("Player A", 500));
      await repo.submit(makeEntry("Player C", 1200));
      await repo.submit(makeEntry("Player B", 800));

      const board = await resolver.leaderboard({ trackId: TRACK_ID });

      expect(board.entries[0]?.player.displayName).toBe("Player C");
      expect(board.entries[0]?.rank).toBe(1);
      expect(board.entries[1]?.player.displayName).toBe("Player B");
    });
  });

  describe("Query: playerRank", () => {
    it("should return null for a player not in the leaderboard", async () => {
      const rank = await resolver.playerRank({
        playerId: "ghost",
        trackId: TRACK_ID,
      });

      expect(rank).toBeNull();
    });

    it("should return the correct rank for a player in the leaderboard", async () => {
      const entry = makeEntry("TopGroover", 9999);
      await repo.submit(entry);
      await repo.submit(makeEntry("Lower", 100));

      const rank = await resolver.playerRank({
        playerId: entry.playerId.value,
        trackId: TRACK_ID,
      });

      expect(rank).toBe(1);
    });
  });

  describe("Mutation: submitScore", () => {
    it("should reject an invalid or unknown token", async () => {
      await expect(
        resolver.submitScore({
          token: "not-a-real-token",
          trackId: TRACK_ID,
          points: 500,
          maxCombo: 5,
        }),
      ).rejects.toThrow(/invalid or expired session/i);
    });

    it("should submit under the identity resolved from the token, ignoring any client-claimed name", async () => {
      await accountRepo.register({
        playerId: "player-1",
        displayName: "RealName",
        passwordHash: "hash",
      });
      await accountRepo.saveToken("valid-token", "player-1");

      const result = await resolver.submitScore({
        token: "valid-token",
        trackId: TRACK_ID,
        points: 700,
        maxCombo: 7,
      });

      expect(result.player.displayName).toBe("RealName");
      expect(result.points).toBe(700);
      expect(result.rank).toBe(1);
    });
  });
});
