import { GraphQLError } from "graphql";
import { LeaderboardEntry, PlayerId } from "@funk-it-up/domain";
import { ILeaderboardRepository } from "../../repositories/ILeaderboardRepository";
import { IAccountRepository } from "../../repositories/IAccountRepository.js";

interface LeaderboardEntryDTO {
  rank: number;
  player: { id: string; displayName: string; spotifyId: null; totalScore: number };
  points: number;
  maxCombo: number;
  trackId: string;
}

interface LeaderboardDTO {
  trackId: string;
  entries: LeaderboardEntryDTO[];
}

export class LeaderboardResolver {
  constructor(
    private readonly leaderboardRepo: ILeaderboardRepository,
    private readonly accountRepo: IAccountRepository,
  ) {}

  async leaderboard(args: { trackId: string }): Promise<LeaderboardDTO> {
    const board = await this.leaderboardRepo.getByTrackId(args.trackId);
    return {
      trackId: board.trackId,
      entries: board.entries.map((e) => ({
        rank: e.rank,
        player: {
          id: e.playerId.value,
          displayName: e.displayName,
          spotifyId: null,
          totalScore: 0,
        },
        points: e.points,
        maxCombo: e.maxCombo,
        trackId: e.trackId,
      })),
    };
  }

  async playerRank(args: {
    playerId: string;
    trackId: string;
  }): Promise<number | null> {
    const board = await this.leaderboardRepo.getByTrackId(args.trackId);
    return board.rankOf(PlayerId.of(args.playerId));
  }

  async submitScore(args: {
    token: string;
    trackId: string;
    points: number;
    maxCombo: number;
  }): Promise<LeaderboardEntryDTO> {
    // Identity comes from the server-verified token, never from client-supplied
    // playerId/displayName — otherwise anyone could submit scores under someone
    // else's name.
    const account = await this.accountRepo.resolveToken(args.token);
    if (!account) {
      throw new GraphQLError("Invalid or expired session — please log in again", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const entry = LeaderboardEntry.create({
      playerId: PlayerId.of(account.playerId),
      displayName: account.displayName,
      points: args.points,
      maxCombo: args.maxCombo,
      trackId: args.trackId,
    });

    const board = await this.leaderboardRepo.submit(entry);
    const saved = board.entries.find((e) => e.playerId.equals(entry.playerId));
    if (!saved) throw new Error("Failed to submit score");

    return {
      rank: saved.rank,
      player: {
        id: saved.playerId.value,
        displayName: saved.displayName,
        spotifyId: null,
        totalScore: 0,
      },
      points: saved.points,
      maxCombo: saved.maxCombo,
      trackId: saved.trackId,
    };
  }
}
