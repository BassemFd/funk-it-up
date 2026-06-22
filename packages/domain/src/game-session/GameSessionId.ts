export class GameSessionId {
  private constructor(readonly value: string) {}

  static generate(): GameSessionId {
    return new GameSessionId(globalThis.crypto.randomUUID());
  }

  static of(value: string): GameSessionId {
    return new GameSessionId(value);
  }
}
