import { Beat } from "../beat/Beat";
import { BeatRating } from "../beat/BeatRating";
import { Timestamp } from "../beat/Timestamp";
import { Player } from "../player/Player";
import { Rhythm } from "../rhythm/Rhythm";
import { Score } from "../score/Score";
import { ComboShattered } from "./events/ComboShattered";
import { DomainEvent } from "./events/DomainEvent";
import { GameOver } from "./events/GameOver";
import { PlayerJumped } from "./events/PlayerJumped";
import { RhythmGained } from "./events/RhythmGained";
import { RhythmLost } from "./events/RhythmLost";
import { SessionFinished } from "./events/SessionFinished";
import { SessionStarted } from "./events/SessionStarted";
import { GameSessionId } from "./GameSessionId";
import { Track } from "./Track";

export type SessionStatus = "WAITING" | "PLAYING" | "FINISHED" | "GAME_OVER";

interface SessionState {
  id: GameSessionId;
  player: Player;
  track: Track;
  status: SessionStatus;
  score: Score;
  rhythm: Rhythm;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  domainEvents: DomainEvent[];
}

export class GameSession {
  readonly id: GameSessionId;
  readonly player: Player;
  readonly track: Track;
  readonly status: SessionStatus;
  readonly score: Score;
  readonly rhythm: Rhythm;
  readonly startedAt: Timestamp | null;
  readonly endedAt: Timestamp | null;
  readonly domainEvents: DomainEvent[];

  private constructor(state: SessionState) {
    this.id = state.id;
    this.player = state.player;
    this.track = state.track;
    this.status = state.status;
    this.score = state.score;
    this.rhythm = state.rhythm;
    this.startedAt = state.startedAt;
    this.endedAt = state.endedAt;
    this.domainEvents = state.domainEvents;
  }

  static create(props: { player: Player; track: Track }): GameSession {
    return new GameSession({
      id: GameSessionId.generate(),
      player: props.player,
      track: props.track,
      status: "WAITING",
      score: Score.empty(),
      rhythm: Rhythm.full(),
      startedAt: null,
      endedAt: null,
      domainEvents: [],
    });
  }

  start(props: { at: Timestamp }): GameSession {
    if (this.status === "PLAYING") {
      throw new Error("Session is already PLAYING");
    }

    const event: SessionStarted = { name: "SessionStarted", at: props.at };

    return this.with({
      status: "PLAYING",
      startedAt: props.at,
      domainEvents: [event],
    });
  }

  registerJump(props: { at: Timestamp }): GameSession {
    if (this.status !== "PLAYING") {
      throw new Error("Cannot register jump: session is not PLAYING");
    }

    const beat = this.nearestBeat(props.at);
    const rating = beat.rate(props.at);

    const jumpEvent: PlayerJumped = {
      name: "PlayerJumped",
      at: props.at,
      rating,
    };

    if (rating === BeatRating.MISS) {
      return this.handleMiss(jumpEvent);
    }

    return this.with({
      score: this.score.add(rating),
      domainEvents: [jumpEvent],
    });
  }

  gainRhythm(props: { at: Timestamp }): GameSession {
    const newRhythm = this.rhythm.gain();

    if (newRhythm.current === this.rhythm.current) {
      return this;
    }

    const event: RhythmGained = {
      name: "RhythmGained",
      current: newRhythm.current,
    };

    return this.with({ rhythm: newRhythm, domainEvents: [event] });
  }

  finish(props: { at: Timestamp }): GameSession {
    const event: SessionFinished = {
      name: "SessionFinished",
      at: props.at,
      finalScore: this.score,
    };

    return this.with({
      status: "FINISHED",
      endedAt: props.at,
      domainEvents: [event],
    });
  }

  private handleMiss(jumpEvent: PlayerJumped): GameSession {
    const events: DomainEvent[] = [jumpEvent];

    if (this.score.hasActiveCombo) {
      const comboLost = this.score.combo;
      const shattered: ComboShattered = { name: "ComboShattered", comboLost };
      return this.with({
        score: this.score.add(BeatRating.MISS),
        domainEvents: [...events, shattered],
      });
    }

    const newRhythm = this.rhythm.lose();
    const rhythmLost: RhythmLost = {
      name: "RhythmLost",
      remaining: newRhythm.current,
    };
    events.push(rhythmLost);

    if (newRhythm.isDead) {
      const gameOver: GameOver = { name: "GameOver", finalScore: this.score };
      return this.with({
        rhythm: newRhythm,
        status: "GAME_OVER",
        domainEvents: [...events, gameOver],
      });
    }

    return this.with({ rhythm: newRhythm, domainEvents: events });
  }

  private nearestBeat(action: Timestamp): Beat {
    const intervalMs = this.track.bpm.intervalMs;
    const offsetMs = this.startedAt ? action.ms - this.startedAt.ms : action.ms;
    const nearestBeatNumber = Math.round(offsetMs / intervalMs);
    const beatTimestampMs = (this.startedAt?.ms ?? 0) + nearestBeatNumber * intervalMs;

    return Beat.create({
      timestamp: Timestamp.of(beatTimestampMs),
      beatNumber: nearestBeatNumber,
      bpm: this.track.bpm,
    });
  }

  private with(overrides: Partial<SessionState>): GameSession {
    return new GameSession({
      id: this.id,
      player: this.player,
      track: this.track,
      status: this.status,
      score: this.score,
      rhythm: this.rhythm,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      domainEvents: [],
      ...overrides,
    });
  }
}
