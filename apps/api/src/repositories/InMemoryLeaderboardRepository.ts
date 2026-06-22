import { Leaderboard, LeaderboardEntry } from "@funk-it-up/domain";
import { ILeaderboardRepository } from "./ILeaderboardRepository.js";
import { pubsub, LEADERBOARD_UPDATED } from "../pubsub.js";

export class InMemoryLeaderboardRepository implements ILeaderboardRepository {
  private readonly store = new Map<string, Leaderboard>();

  async getByTrackId(trackId: string): Promise<Leaderboard> {
    return this.store.get(trackId) ?? Leaderboard.empty(trackId);
  }

  async submit(entry: LeaderboardEntry): Promise<Leaderboard> {
    const current = await this.getByTrackId(entry.trackId);
    const updated = current.submit(entry);
    this.store.set(entry.trackId, updated);
    await pubsub.publish(LEADERBOARD_UPDATED(entry.trackId), { leaderboardUpdated: updated });
    return updated;
  }
}
