import { randomUUID } from "crypto";

export class PlayerId {
  private constructor(readonly value: string) {}

  static generate(): PlayerId {
    return new PlayerId(randomUUID());
  }

  static of(value: string): PlayerId {
    return new PlayerId(value);
  }

  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
