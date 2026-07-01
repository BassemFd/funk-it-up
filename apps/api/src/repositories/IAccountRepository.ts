export interface AccountRecord {
  playerId: string;
  displayName: string;
  passwordHash: string;
}

export interface IAccountRepository {
  /** Atomically reserves the name. Returns false if already taken. */
  register(record: AccountRecord): Promise<boolean>;
  findByName(displayName: string): Promise<AccountRecord | null>;
  saveToken(token: string, playerId: string): Promise<void>;
  resolveToken(token: string): Promise<AccountRecord | null>;
}
