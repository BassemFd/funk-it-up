import { Leaderboard } from "@funk-it-up/domain";
import { LeaderboardEntry } from "@funk-it-up/domain";

export interface ILeaderboardRepository {
  getByTrackId(trackId: string): Promise<Leaderboard>;
  submit(entry: LeaderboardEntry): Promise<Leaderboard>;
}
