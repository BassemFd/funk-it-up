export class BPM {
  private constructor(readonly value: number) {}

  static of(value: number): BPM {
    if (value < 40 || value > 220) {
      throw new Error("BPM must be between 40 and 220");
    }
    return new BPM(value);
  }

  get intervalMs(): number {
    return (60 / this.value) * 1000;
  }
}
