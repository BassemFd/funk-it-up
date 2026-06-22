import { Leaderboard, LeaderboardEntry } from "@funk-it-up/domain";
import { ILeaderboardRepository } from "./ILeaderboardRepository.js";
import { LEADERBOARD_UPDATED } from "../pubsub.js";

interface Publisher {
  publish(channel: string, payload: unknown): Promise<unknown>;
}

export class InMemoryLeaderboardRepository implements ILeaderboardRepository {
  private readonly store = new Map<string, Leaderboard>();

  constructor(private readonly pubsub: Publisher) {}

  async getByTrackId(trackId: string): Promise<Leaderboard> {
    return this.store.get(trackId) ?? Leaderboard.empty(trackId);
  }

  async submit(entry: LeaderboardEntry): Promise<Leaderboard> {
    const current = await this.getByTrackId(entry.trackId);
    const updated = current.submit(entry);
    this.store.set(entry.trackId, updated);
    await this.pubsub.publish(LEADERBOARD_UPDATED(entry.trackId), {
      leaderboardUpdated: updated,
    });
    return updated;
  }
}
