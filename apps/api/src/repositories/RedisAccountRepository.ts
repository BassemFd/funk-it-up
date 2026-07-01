import Redis from "ioredis";
import { AccountRecord, IAccountRepository } from "./IAccountRepository.js";

// Key schema:
//   account:name:{lowercase(displayName)} → playerId   (SET NX — atomic uniqueness)
//   account:player:{playerId}             → hash { displayName, passwordHash }
//   account:token:{token}                 → playerId
const NAME_KEY = (name: string) => `account:name:${name.toLowerCase()}`;
const PLAYER_KEY = (playerId: string) => `account:player:${playerId}`;
const TOKEN_KEY = (token: string) => `account:token:${token}`;

export class RedisAccountRepository implements IAccountRepository {
  constructor(private readonly redis: Redis) {}

  async register(record: AccountRecord): Promise<boolean> {
    const reserved = await this.redis.set(
      NAME_KEY(record.displayName),
      record.playerId,
      "NX",
    );
    if (reserved !== "OK") return false;

    await this.redis.hset(PLAYER_KEY(record.playerId), {
      displayName: record.displayName,
      passwordHash: record.passwordHash,
    });
    return true;
  }

  async findByName(displayName: string): Promise<AccountRecord | null> {
    const playerId = await this.redis.get(NAME_KEY(displayName));
    if (!playerId) return null;
    return this.loadByPlayerId(playerId);
  }

  async saveToken(token: string, playerId: string): Promise<void> {
    await this.redis.set(TOKEN_KEY(token), playerId);
  }

  async resolveToken(token: string): Promise<AccountRecord | null> {
    const playerId = await this.redis.get(TOKEN_KEY(token));
    if (!playerId) return null;
    return this.loadByPlayerId(playerId);
  }

  private async loadByPlayerId(playerId: string): Promise<AccountRecord | null> {
    const data = await this.redis.hgetall(PLAYER_KEY(playerId));
    if (!data?.displayName) return null;
    return { playerId, displayName: data.displayName, passwordHash: data.passwordHash };
  }
}
