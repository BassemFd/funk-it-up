import { describe, it, expect, beforeEach } from "vitest";
import { LeaderboardResolver } from "../../src/resolvers/query/LeaderboardResolver";
import { InMemoryLeaderboardRepository } from "./helpers/InMemoryLeaderboardRepository";
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
  let resolver: LeaderboardResolver;

  beforeEach(() => {
    repo = new InMemoryLeaderboardRepository();
    resolver = new LeaderboardResolver(repo);
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
});
