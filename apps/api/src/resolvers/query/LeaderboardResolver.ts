import { PlayerId } from "@funk-it-up/domain";
import { ILeaderboardRepository } from "../../repositories/ILeaderboardRepository";

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
  constructor(private readonly leaderboardRepo: ILeaderboardRepository) {}

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
}
