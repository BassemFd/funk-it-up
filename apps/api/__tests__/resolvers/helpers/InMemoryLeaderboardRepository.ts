import { Leaderboard, LeaderboardEntry } from "@funk-it-up/domain";
import { ILeaderboardRepository } from "../../../src/repositories/ILeaderboardRepository";

export class InMemoryLeaderboardRepository implements ILeaderboardRepository {
  private store = new Map<string, Leaderboard>();

  async getByTrackId(trackId: string): Promise<Leaderboard> {
    return this.store.get(trackId) ?? Leaderboard.empty(trackId);
  }

  async submit(entry: LeaderboardEntry): Promise<Leaderboard> {
    const current = await this.getByTrackId(entry.trackId);
    const updated = current.submit(entry);
    this.store.set(entry.trackId, updated);
    return updated;
  }
}
