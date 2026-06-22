import Redis from "ioredis";
import { Leaderboard, LeaderboardEntry, PlayerId } from "@funk-it-up/domain";
import { ILeaderboardRepository } from "./ILeaderboardRepository.js";

// Key schema:
//   lb:{trackId}:scores    → sorted set  member=playerId  score=points
//   lb:{trackId}:meta:{id} → hash        displayName, maxCombo, trackId
const SCORES_KEY = (trackId: string) => `lb:${trackId}:scores`;
const META_KEY = (trackId: string, playerId: string) =>
  `lb:${trackId}:meta:${playerId}`;
const MAX_ENTRIES = 100;

interface RedisPublisher {
  publish(channel: string, payload: { leaderboardUpdated: unknown }): Promise<void>;
}

export class RedisLeaderboardRepository implements ILeaderboardRepository {
  constructor(
    private readonly redis: Redis,
    private readonly publisher: RedisPublisher,
  ) {}

  async submit(entry: LeaderboardEntry): Promise<Leaderboard> {
    const scoresKey = SCORES_KEY(entry.trackId);
    const metaKey = META_KEY(entry.trackId, entry.playerId.value);

    // Keep only personal best (NX = only add, GT = update if higher)
    await this.redis.zadd(scoresKey, "GT", entry.points, entry.playerId.value);

    // Store display metadata
    await this.redis.hset(metaKey, {
      displayName: entry.displayName,
      maxCombo: entry.maxCombo,
      trackId: entry.trackId,
    });

    const board = await this.getByTrackId(entry.trackId);
    await this.publisher.publish(`LEADERBOARD_UPDATED_${entry.trackId}`, {
      leaderboardUpdated: board,
    });
    return board;
  }

  async getByTrackId(trackId: string): Promise<Leaderboard> {
    const scoresKey = SCORES_KEY(trackId);

    // ZREVRANGE with scores — top MAX_ENTRIES
    const raw = await this.redis.zrevrangebyscore(
      scoresKey,
      "+inf",
      "-inf",
      "WITHSCORES",
      "LIMIT",
      0,
      MAX_ENTRIES,
    );

    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < raw.length; i += 2) {
      const playerId = raw[i];
      const points = parseInt(raw[i + 1], 10);
      const meta = await this.redis.hgetall(META_KEY(trackId, playerId));
      if (!meta?.displayName) continue;

      const e = LeaderboardEntry.create({
        playerId: PlayerId.of(playerId),
        displayName: meta.displayName,
        points,
        maxCombo: parseInt(meta.maxCombo ?? "0", 10),
        trackId,
      });
      e.rank = entries.length + 1;
      entries.push(e);
    }

    // Rebuild Leaderboard domain object with sorted entries
    let board = Leaderboard.empty(trackId);
    // Submit in reverse order so highest score ends up rank 1
    for (const e of [...entries].reverse()) {
      board = board.submit(e);
    }
    return board;
  }
}
