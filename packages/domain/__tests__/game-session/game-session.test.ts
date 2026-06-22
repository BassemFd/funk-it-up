import { describe, it, expect } from "vitest";
import { GameSession } from "../../src/game-session/GameSession";
import { GameSessionId } from "../../src/game-session/GameSessionId";
import { Player } from "../../src/player/Player";
import { Track } from "../../src/game-session/Track";
import { BPM } from "../../src/beat/BPM";
import { Timestamp } from "../../src/beat/Timestamp";
import { PlayerJumped } from "../../src/game-session/events/PlayerJumped";
import { ComboShattered } from "../../src/game-session/events/ComboShattered";
import { RhythmLost } from "../../src/game-session/events/RhythmLost";
import { RhythmGained } from "../../src/game-session/events/RhythmGained";
import { GameOver } from "../../src/game-session/events/GameOver";

// Helpers
const makePlayer = () => Player.create({ displayName: "FunkPlayer" });

// Jeroboam-style track à 98 BPM
// intervalMs ≈ 612ms — beat timestamps: 0, 612, 1224, 1836, 2449 …
const makeTrack = () =>
  Track.create({
    spotifyTrackId: "spotify:track:jeroboam_funk_01",
    title: "Groove Theory",
    artist: "Jeroboam",
    durationMs: 240_000,
    bpm: BPM.of(98),
  });

const startedSession = () =>
  GameSession.create({ player: makePlayer(), track: makeTrack() }).start({
    at: Timestamp.of(0),
  });

// ─── State Machine ────────────────────────────────────────────────────────────

describe("Feature: GameSession — state machine", () => {
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
      const session = startedSession();

      expect(session.status).toBe("PLAYING");
      expect(session.startedAt?.ms).toBe(0);
    });

    it("should emit a SessionStarted domain event", () => {
      const session = startedSession();

      expect(session.domainEvents).toHaveLength(1);
      expect(session.domainEvents[0]?.name).toBe("SessionStarted");
    });

    it("should not allow starting an already playing session", () => {
      expect(() =>
        startedSession().start({ at: Timestamp.of(100) })
      ).toThrow("Session is already PLAYING");
    });

    it("should initialize rhythm at full capacity", () => {
      const session = startedSession();

      expect(session.rhythm.current).toBe(5);
      expect(session.rhythm.isAlive).toBe(true);
    });
  });

  describe("Given the track ends normally", () => {
    it("should transition to FINISHED state", () => {
      const session = startedSession().finish({ at: Timestamp.of(240_000) });

      expect(session.status).toBe("FINISHED");
      expect(session.endedAt?.ms).toBe(240_000);
    });

    it("should emit a SessionFinished event with final score", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(612) })
        .finish({ at: Timestamp.of(240_000) });

      const event = session.domainEvents.find(
        (e) => e.name === "SessionFinished"
      );
      expect(event).toBeDefined();
    });
  });
});

// ─── Jump + Scoring ───────────────────────────────────────────────────────────

describe("Feature: GameSession — jump & scoring", () => {
  describe("Given the session is PLAYING", () => {
    it("should register a jump and emit PlayerJumped event", () => {
      const session = startedSession().registerJump({
        at: Timestamp.of(612),
      });

      const jumps = session.domainEvents.filter(
        (e): e is PlayerJumped => e.name === "PlayerJumped"
      );
      expect(jumps).toHaveLength(1);
      expect(jumps[0]?.at.ms).toBe(612);
    });

    it("should score points for a jump aligned with a beat", () => {
      const session = startedSession().registerJump({
        at: Timestamp.of(612),
      });

      expect(session.score.points).toBeGreaterThan(0);
    });

    it("should score 0 for a jump far from any beat", () => {
      // 306ms = halfway between beat 0 and beat 1 → MISS
      const session = startedSession().registerJump({
        at: Timestamp.of(306),
      });

      expect(session.score.points).toBe(0);
    });
  });
});

// ─── Miss Routing (combo-shield mechanic) ─────────────────────────────────────

describe("Feature: GameSession — miss routing (combo-shield)", () => {
  describe("When a player misses WITH an active combo", () => {
    it("should shatter the combo and NOT lose a rythme", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(612) })   // PERFECT — combo: 1
        .registerJump({ at: Timestamp.of(1224) })  // PERFECT — combo: 2
        .registerJump({ at: Timestamp.of(306) });  // MISS    — combo shield

      expect(session.score.combo).toBe(0);
      expect(session.rhythm.current).toBe(5); // rythmes intacts
    });

    it("should emit ComboShattered event", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(612) })
        .registerJump({ at: Timestamp.of(306) }); // MISS avec combo

      const event = session.domainEvents.find(
        (e): e is ComboShattered => e.name === "ComboShattered"
      );
      expect(event).toBeDefined();
      expect(event?.comboLost).toBe(1);
    });
  });

  describe("When a player misses WITHOUT a combo", () => {
    it("should lose one rythme", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(306) }); // MISS sans combo

      expect(session.rhythm.current).toBe(4);
    });

    it("should emit RhythmLost event", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(306) }); // MISS sans combo

      const event = session.domainEvents.find(
        (e): e is RhythmLost => e.name === "RhythmLost"
      );
      expect(event).toBeDefined();
      expect(event?.remaining).toBe(4);
    });

    it("should not emit ComboShattered when there was no combo", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(306) }); // MISS sans combo

      const shattered = session.domainEvents.find(
        (e) => e.name === "ComboShattered"
      );
      expect(shattered).toBeUndefined();
    });

    it("should survive multiple misses as long as rythmes remain", () => {
      let session = startedSession();
      for (let i = 0; i < 4; i++) {
        session = session.registerJump({ at: Timestamp.of(306 + i * 612) });
      }

      expect(session.rhythm.current).toBe(1);
      expect(session.status).toBe("PLAYING");
    });
  });

  describe("When the last rythme is lost", () => {
    it("should emit GameOver event", () => {
      let session = startedSession();
      // 5 misses sans combo → 5 rythmes perdus
      for (let i = 0; i < 5; i++) {
        session = session.registerJump({ at: Timestamp.of(306 + i * 2000) });
      }

      const event = session.domainEvents.find(
        (e): e is GameOver => e.name === "GameOver"
      );
      expect(event).toBeDefined();
    });

    it("should transition to GAME_OVER status", () => {
      let session = startedSession();
      for (let i = 0; i < 5; i++) {
        session = session.registerJump({ at: Timestamp.of(306 + i * 2000) });
      }

      expect(session.status).toBe("GAME_OVER");
    });

    it("should freeze the score at the moment of game over", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(612) })   // PERFECT → 100pts
        .registerJump({ at: Timestamp.of(306) })   // MISS → perd combo (pas de rythme)
        .registerJump({ at: Timestamp.of(2306) })  // MISS → rythme 4
        .registerJump({ at: Timestamp.of(4306) })  // MISS → rythme 3
        .registerJump({ at: Timestamp.of(6306) })  // MISS → rythme 2
        .registerJump({ at: Timestamp.of(8306) })  // MISS → rythme 1
        .registerJump({ at: Timestamp.of(10306) }); // MISS → game over

      expect(session.score.points).toBe(100);
      expect(session.status).toBe("GAME_OVER");
    });

    it("should not allow jumps after game over", () => {
      let session = startedSession();
      for (let i = 0; i < 5; i++) {
        session = session.registerJump({ at: Timestamp.of(306 + i * 2000) });
      }

      expect(() =>
        session.registerJump({ at: Timestamp.of(99_000) })
      ).toThrow("Cannot register jump: session is not PLAYING");
    });
  });
});

// ─── Rhythm Gain ─────────────────────────────────────────────────────────────

describe("Feature: GameSession — regain a rythme", () => {
  describe("When a player lands on a 'The One' platform", () => {
    it("should gain one rythme if below max", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(306) })   // MISS → rythme 4
        .gainRhythm({ at: Timestamp.of(1224) });   // "The One" pickup

      expect(session.rhythm.current).toBe(5);
    });

    it("should emit RhythmGained event", () => {
      const session = startedSession()
        .registerJump({ at: Timestamp.of(306) })
        .gainRhythm({ at: Timestamp.of(1224) });

      const event = session.domainEvents.find(
        (e): e is RhythmGained => e.name === "RhythmGained"
      );
      expect(event).toBeDefined();
      expect(event?.current).toBe(5);
    });

    it("should not exceed max rythmes when gaining", () => {
      const session = startedSession()
        .gainRhythm({ at: Timestamp.of(612) }); // déjà à 5

      expect(session.rhythm.current).toBe(5);
    });
  });
});
