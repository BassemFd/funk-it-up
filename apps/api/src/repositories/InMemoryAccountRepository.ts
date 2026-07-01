import { AccountRecord, IAccountRepository } from "./IAccountRepository.js";

export class InMemoryAccountRepository implements IAccountRepository {
  private readonly byName = new Map<string, AccountRecord>();
  private readonly byPlayerId = new Map<string, AccountRecord>();
  private readonly tokens = new Map<string, string>();

  async register(record: AccountRecord): Promise<boolean> {
    const key = record.displayName.toLowerCase();
    if (this.byName.has(key)) return false;
    this.byName.set(key, record);
    this.byPlayerId.set(record.playerId, record);
    return true;
  }

  async findByName(displayName: string): Promise<AccountRecord | null> {
    return this.byName.get(displayName.toLowerCase()) ?? null;
  }

  async saveToken(token: string, playerId: string): Promise<void> {
    this.tokens.set(token, playerId);
  }

  async resolveToken(token: string): Promise<AccountRecord | null> {
    const playerId = this.tokens.get(token);
    if (!playerId) return null;
    return this.byPlayerId.get(playerId) ?? null;
  }
}
