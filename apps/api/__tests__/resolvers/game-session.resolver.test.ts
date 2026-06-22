import { describe, it, expect, beforeEach } from "vitest";
import { GameSessionResolver } from "../../src/resolvers/mutation/GameSessionResolver";
import { InMemoryPlayerRepository } from "./helpers/InMemoryPlayerRepository";
import { InMemoryGameSessionRepository } from "./helpers/InMemoryGameSessionRepository";
import { InMemoryLeaderboardRepository } from "./helpers/InMemoryLeaderboardRepository";
import { Player } from "@funk-it-up/domain";

const TRACK_ID = "spotify:track:jeroboam_funk_01";
const BPM = 98;

describe("Resolver: GameSession", () => {
  let playerRepo: InMemoryPlayerRepository;
  let sessionRepo: InMemoryGameSessionRepository;
  let leaderboardRepo: InMemoryLeaderboardRepository;
  let resolver: GameSessionResolver;
  let playerId: string;

  beforeEach(async () => {
    playerRepo = new InMemoryPlayerRepository();
    sessionRepo = new InMemoryGameSessionRepository();
    leaderboardRepo = new InMemoryLeaderboardRepository();
    resolver = new GameSessionResolver(sessionRepo, playerRepo, leaderboardRepo);

    const player = Player.create({ displayName: "FunkPlayer" });
    await playerRepo.save(player);
    playerId = player.id.value;
  });

  describe("Mutation: startSession", () => {
    it("should create a PLAYING session", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe("PLAYING");
    });

    it("should return full rhythm (5 rythmes) on start", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      expect(session.rhythm.current).toBe(5);
      expect(session.rhythm.slots).toEqual([true, true, true, true, true]);
    });

    it("should throw if player does not exist", async () => {
      await expect(
        resolver.startSession({
          playerId: "ghost-player",
          spotifyTrackId: TRACK_ID,
          bpm: BPM,
        })
      ).rejects.toThrow("Player not found");
    });
  });

  describe("Mutation: jump", () => {
    it("should return PERFECT rating when jump aligns with a beat", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      // beat 1 at 98 BPM ≈ 612ms
      const result = await resolver.jump({
        sessionId: session.id,
        atMs: 612,
      });

      expect(result.rating).toBe("PERFECT");
      expect(result.session.score.points).toBe(100);
    });

    it("should return MISS and not add points for a jump off-beat", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      const result = await resolver.jump({
        sessionId: session.id,
        atMs: 306, // midpoint → MISS
      });

      expect(result.rating).toBe("MISS");
      expect(result.session.score.points).toBe(0);
    });

    it("should shatter combo on MISS with active combo", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      await resolver.jump({ sessionId: session.id, atMs: 612 });  // PERFECT → combo: 1
      const result = await resolver.jump({ sessionId: session.id, atMs: 306 }); // MISS

      expect(result.session.score.combo).toBe(0);
      expect(result.session.rhythm.current).toBe(5); // rythmes intacts
    });

    it("should lose a rythme on MISS without combo", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      const result = await resolver.jump({ sessionId: session.id, atMs: 306 });

      expect(result.session.rhythm.current).toBe(4);
    });

    it("should transition to GAME_OVER after 5 rythmes lost", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      let current = session;
      for (let i = 0; i < 5; i++) {
        const r = await resolver.jump({
          sessionId: current.id,
          atMs: 306 + i * 612,
        });
        current = r.session;
      }

      expect(current.status).toBe("GAME_OVER");
    });

    it("should throw if session does not exist", async () => {
      await expect(
        resolver.jump({ sessionId: "ghost-session", atMs: 612 })
      ).rejects.toThrow("Session not found");
    });
  });

  describe("Mutation: gainRhythm", () => {
    it("should restore one rythme if below max", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      // Lose one rythme first
      await resolver.jump({ sessionId: session.id, atMs: 306 });

      const updated = await resolver.gainRhythm({
        sessionId: session.id,
        atMs: 612,
      });

      expect(updated.rhythm.current).toBe(5);
    });
  });

  describe("Mutation: finishSession", () => {
    it("should transition session to FINISHED", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      const finished = await resolver.finishSession({
        sessionId: session.id,
        atMs: 240_000,
      });

      expect(finished.status).toBe("FINISHED");
    });

    it("should submit score to leaderboard on finish", async () => {
      const session = await resolver.startSession({
        playerId,
        spotifyTrackId: TRACK_ID,
        bpm: BPM,
      });

      await resolver.jump({ sessionId: session.id, atMs: 612 }); // 100pts
      await resolver.finishSession({ sessionId: session.id, atMs: 240_000 });

      const board = await leaderboardRepo.getByTrackId(TRACK_ID);
      expect(board.entries).toHaveLength(1);
      expect(board.entries[0]?.points).toBe(100);
    });
  });
});
