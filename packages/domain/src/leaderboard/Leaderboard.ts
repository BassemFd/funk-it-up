import { PlayerId } from "../player/PlayerId";
import { LeaderboardEntry } from "./LeaderboardEntry";

const MAX_ENTRIES = 100;

export class Leaderboard {
  readonly trackId: string;
  readonly entries: LeaderboardEntry[];

  private constructor(trackId: string, entries: LeaderboardEntry[]) {
    this.trackId = trackId;
    this.entries = entries;
  }

  static empty(trackId: string): Leaderboard {
    return new Leaderboard(trackId, []);
  }

  submit(entry: LeaderboardEntry): Leaderboard {
    const existing = this.entries.find((e) =>
      e.playerId.equals(entry.playerId)
    );

    let updated: LeaderboardEntry[];

    if (existing) {
      if (entry.points <= existing.points) return this;
      updated = this.entries.filter((e) => !e.playerId.equals(entry.playerId));
      updated.push(entry);
    } else {
      updated = [...this.entries, entry];
    }

    const sorted = updated
      .sort((a, b) => b.points - a.points)
      .slice(0, MAX_ENTRIES);

    sorted.forEach((e, i) => {
      e.rank = i + 1;
    });

    return new Leaderboard(this.trackId, sorted);
  }

  rankOf(playerId: PlayerId): number | null {
    const entry = this.entries.find((e) => e.playerId.equals(playerId));
    return entry?.rank ?? null;
  }
}
