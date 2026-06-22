import { describe, it, expect } from "vitest";
import { GameSession } from "../../src/game-session/GameSession";
import { GameSessionId } from "../../src/game-session/GameSessionId";
import { Player } from "../../src/player/Player";
import { Track } from "../../src/game-session/Track";
import { BPM } from "../../src/beat/BPM";
import { Timestamp } from "../../src/beat/Timestamp";
import { PlayerJumped } from "../../src/game-session/events/PlayerJumped";

describe("Feature: GameSession — Rhythmic Platformer", () => {
  const makePlayer = () => Player.create({ displayName: "FunkPlayer" });

  const makeTrack = () =>
    Track.create({
      spotifyTrackId: "spotify:track:jeroboam_funk_01",
      title: "Groove Theory",
      artist: "Jeroboam",
      durationMs: 240_000,
      bpm: BPM.of(98),
    });

  describe("Given a player wants to start a game", () => {
    it("should create a new game session in WAITING state", () => {
      const session = GameSession.create({
        player: makePlayer(),
        track: makeTrack(),
      });

      expect(session.id).toBeInstanceOf(GameSessionId);
      expect(session.status).toBe("WAITING");
    });

    it("should not allow jumps before the session starts", () => {
      const session = GameSession.create({
        player: makePlayer(),
        track: makeTrack(),
      });

      expect(() =>
        session.registerJump({ at: Timestamp.of(0) })
      ).toThrow("Cannot register jump: session is not PLAYING");
    });
  });

  describe("Given a game session starts", () => {
    it("should transition to PLAYING state", () => {
      const session = GameSession.create({
        player: makePlayer(),
        track: makeTrack(),
      });

      const playing = session.start({ at: Timestamp.of(0) });

      expect(playing.status).toBe("PLAYING");
      expect(playing.startedAt?.ms).toBe(0);
    });

    it("should emit a SessionStarted domain event", () => {
      const session = GameSession.create({
        player: makePlayer(),
        track: makeTrack(),
      });

      const playing = session.start({ at: Timestamp.of(0) });

      expect(playing.domainEvents).toHaveLength(1);
      expect(playing.domainEvents[0]?.name).toBe("SessionStarted");
    });

    it("should not allow starting an already playing session", () => {
      const session = GameSession.create({
        player: makePlayer(),
        track: makeTrack(),
      }).start({ at: Timestamp.of(0) });

      expect(() =>
        session.start({ at: Timestamp.of(100) })
      ).toThrow("Session is already PLAYING");
    });
  });

  describe("Given a session is PLAYING", () => {
    const startedSession = () =>
      GameSession.create({
        player: makePlayer(),
        track: makeTrack(),
      }).start({ at: Timestamp.of(0) });

    it("should register a player jump and emit PlayerJumped event", () => {
      const session = startedSession().registerJump({
        at: Timestamp.of(612),
      });

      const jumpEvents = session.domainEvents.filter(
        (e): e is PlayerJumped => e.name === "PlayerJumped"
      );
      expect(jumpEvents).toHaveLength(1);
      expect(jumpEvents[0]?.at.ms).toBe(612);
    });

    it("should score a PERFECT jump when aligned with a beat", () => {
      const session = startedSession().registerJump({
        at: Timestamp.of(612),
      });

      expect(session.score.points).toBeGreaterThan(0);
    });

    it("should score 0 for a jump far from any beat", () => {
      const session = startedSession().registerJump({
        at: Timestamp.of(306),
      });

      expect(session.score.points).toBe(0);
    });

    it("should end the session when the track duration is reached", () => {
      const session = startedSession().finish({
        at: Timestamp.of(240_000),
      });

      expect(session.status).toBe("FINISHED");
      expect(session.endedAt?.ms).toBe(240_000);
    });

    it("should emit a SessionFinished event with final score", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(612) })
        .finish({ at: Timestamp.of(240_000) });

      const finishEvent = session.domainEvents.find(
        (e) => e.name === "SessionFinished"
      );
      expect(finishEvent).toBeDefined();
    });
  });
});
