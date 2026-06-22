export class Timestamp {
  private constructor(readonly ms: number) {}

  static of(ms: number): Timestamp {
    return new Timestamp(ms);
  }

  distanceTo(other: Timestamp): number {
    return Math.abs(this.ms - other.ms);
  }
}
