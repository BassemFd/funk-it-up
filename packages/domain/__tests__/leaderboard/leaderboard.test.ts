import { describe, it, expect } from "vitest";
import { Leaderboard } from "../../src/leaderboard/Leaderboard";
import { LeaderboardEntry } from "../../src/leaderboard/LeaderboardEntry";
import { PlayerId } from "../../src/player/PlayerId";

describe("Feature: Leaderboard", () => {
  const entry = (displayName: string, points: number): LeaderboardEntry =>
    LeaderboardEntry.create({
      playerId: PlayerId.generate(),
      displayName,
      points,
      maxCombo: Math.floor(points / 100),
      trackId: "spotify:track:jeroboam_funk_01",
    });

  describe("Given no one has played yet", () => {
    it("should return an empty leaderboard", () => {
      const board = Leaderboard.empty("spotify:track:jeroboam_funk_01");

      expect(board.entries).toHaveLength(0);
    });
  });

  describe("Given players submit scores", () => {
    it("should rank players by points descending", () => {
      const board = Leaderboard.empty("spotify:track:jeroboam_funk_01")
        .submit(entry("Player A", 500))
        .submit(entry("Player C", 1200))
        .submit(entry("Player B", 800));

      expect(board.entries[0]?.displayName).toBe("Player C");
      expect(board.entries[1]?.displayName).toBe("Player B");
      expect(board.entries[2]?.displayName).toBe("Player A");
    });

    it("should assign rank 1 to the top player", () => {
      const board = Leaderboard.empty("spotify:track:jeroboam_funk_01")
        .submit(entry("TopGroover", 9999));

      expect(board.entries[0]?.rank).toBe(1);
    });

    it("should keep only the top 100 entries", () => {
      let board = Leaderboard.empty("spotify:track:jeroboam_funk_01");
      for (let i = 0; i < 105; i++) {
        board = board.submit(entry(`Player${i}`, i * 10));
      }

      expect(board.entries).toHaveLength(100);
      expect(board.entries[0]?.points).toBe(1040);
    });

    it("should update an existing player's score if the new score is higher", () => {
      const playerId = PlayerId.generate();
      const first = LeaderboardEntry.create({
        playerId,
        displayName: "FunkLord",
        points: 500,
        maxCombo: 5,
        trackId: "spotify:track:jeroboam_funk_01",
      });
      const better = LeaderboardEntry.create({
        playerId,
        displayName: "FunkLord",
        points: 1000,
        maxCombo: 10,
        trackId: "spotify:track:jeroboam_funk_01",
      });

      const board = Leaderboard.empty("spotify:track:jeroboam_funk_01")
        .submit(first)
        .submit(better);

      const playerEntries = board.entries.filter(
        (e) => e.playerId.equals(playerId)
      );
      expect(playerEntries).toHaveLength(1);
      expect(playerEntries[0]?.points).toBe(1000);
    });

    it("should NOT update a player's score if the new score is lower", () => {
      const playerId = PlayerId.generate();
      const first = LeaderboardEntry.create({
        playerId,
        displayName: "FunkLord",
        points: 1000,
        maxCombo: 10,
        trackId: "spotify:track:jeroboam_funk_01",
      });
      const worse = LeaderboardEntry.create({
        playerId,
        displayName: "FunkLord",
        points: 200,
        maxCombo: 2,
        trackId: "spotify:track:jeroboam_funk_01",
      });

      const board = Leaderboard.empty("spotify:track:jeroboam_funk_01")
        .submit(first)
        .submit(worse);

      expect(board.entries[0]?.points).toBe(1000);
    });

    it("should find a player's current rank", () => {
      const playerId = PlayerId.generate();
      const myEntry = LeaderboardEntry.create({
        playerId,
        displayName: "Me",
        points: 750,
        maxCombo: 7,
        trackId: "spotify:track:jeroboam_funk_01",
      });

      const board = Leaderboard.empty("spotify:track:jeroboam_funk_01")
        .submit(entry("Better", 900))
        .submit(myEntry)
        .submit(entry("Worse", 400));

      expect(board.rankOf(playerId)).toBe(2);
    });
  });
});
