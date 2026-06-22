import {
  BPM,
  GameSession,
  GameSessionId,
  LeaderboardEntry,
  PlayerId,
  Timestamp,
  Track,
} from "@funk-it-up/domain";
import { IGameSessionRepository } from "../../repositories/IGameSessionRepository";
import { ILeaderboardRepository } from "../../repositories/ILeaderboardRepository";
import { IPlayerRepository } from "../../repositories/IPlayerRepository";

interface SessionDTO {
  id: string;
  status: string;
  score: { points: number; combo: number; maxCombo: number; multiplier: number };
  rhythm: { current: number; max: number; slots: boolean[] };
  startedAt: number | null;
  endedAt: number | null;
}

interface JumpResultDTO {
  rating: string;
  session: SessionDTO;
}

function toSessionDTO(session: GameSession): SessionDTO {
  return {
    id: session.id.value,
    status: session.status,
    score: {
      points: session.score.points,
      combo: session.score.combo,
      maxCombo: session.score.maxCombo,
      multiplier: session.score.multiplier,
    },
    rhythm: {
      current: session.rhythm.current,
      max: session.rhythm.max,
      slots: session.rhythm.asSlots(),
    },
    startedAt: session.startedAt?.ms ?? null,
    endedAt: session.endedAt?.ms ?? null,
  };
}

export class GameSessionResolver {
  constructor(
    private readonly sessionRepo: IGameSessionRepository,
    private readonly playerRepo: IPlayerRepository,
    private readonly leaderboardRepo: ILeaderboardRepository
  ) {}

  async startSession(args: {
    playerId: string;
    spotifyTrackId: string;
    bpm: number;
  }): Promise<SessionDTO> {
    const player = await this.playerRepo.findById(PlayerId.of(args.playerId));
    if (!player) throw new Error("Player not found");

    const track = Track.create({
      spotifyTrackId: args.spotifyTrackId,
      title: "Unknown",
      artist: "Unknown",
      durationMs: 0,
      bpm: BPM.of(args.bpm),
    });

    const session = GameSession.create({ player, track }).start({
      at: Timestamp.of(0),
    });

    await this.sessionRepo.save(session);
    return toSessionDTO(session);
  }

  async jump(args: { sessionId: string; atMs: number }): Promise<JumpResultDTO> {
    const session = await this.sessionRepo.findById(
      GameSessionId.of(args.sessionId)
    );
    if (!session) throw new Error("Session not found");

    const updated = session.registerJump({ at: Timestamp.of(args.atMs) });
    await this.sessionRepo.save(updated);

    const jumpEvent = updated.domainEvents.find((e) => e.name === "PlayerJumped");
    const rating = (jumpEvent as { rating?: string })?.rating ?? "MISS";

    return { rating, session: toSessionDTO(updated) };
  }

  async gainRhythm(args: {
    sessionId: string;
    atMs: number;
  }): Promise<SessionDTO> {
    const session = await this.sessionRepo.findById(
      GameSessionId.of(args.sessionId)
    );
    if (!session) throw new Error("Session not found");

    const updated = session.gainRhythm({ at: Timestamp.of(args.atMs) });
    await this.sessionRepo.save(updated);
    return toSessionDTO(updated);
  }

  async finishSession(args: {
    sessionId: string;
    atMs: number;
  }): Promise<SessionDTO> {
    const session = await this.sessionRepo.findById(
      GameSessionId.of(args.sessionId)
    );
    if (!session) throw new Error("Session not found");

    const finished = session.finish({ at: Timestamp.of(args.atMs) });
    await this.sessionRepo.save(finished);

    await this.submitToLeaderboard(finished);

    return toSessionDTO(finished);
  }

  private async submitToLeaderboard(session: GameSession): Promise<void> {
    const entry = LeaderboardEntry.create({
      playerId: session.player.id,
      displayName: session.player.displayName,
      points: session.score.points,
      maxCombo: session.score.maxCombo,
      trackId: session.track.spotifyTrackId,
    });

    await this.leaderboardRepo.submit(entry);
  }
}
