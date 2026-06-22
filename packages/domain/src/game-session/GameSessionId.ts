import { randomUUID } from "crypto";

export class GameSessionId {
  private constructor(readonly value: string) {}

  static generate(): GameSessionId {
    return new GameSessionId(randomUUID());
  }

  static of(value: string): GameSessionId {
    return new GameSessionId(value);
  }
}
