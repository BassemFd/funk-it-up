export class Rhythm {
  readonly current: number;
  readonly max: number;

  private constructor(current: number, max: number) {
    this.current = current;
    this.max = max;
  }

  static full(): Rhythm {
    return new Rhythm(5, 5);
  }

  static withMax(max: number): Rhythm {
    if (max < 1) throw new Error("Rhythm max must be at least 1");
    return new Rhythm(max, max);
  }

  get isAlive(): boolean {
    return this.current > 0;
  }

  get isDead(): boolean {
    return this.current === 0;
  }

  lose(): Rhythm {
    return new Rhythm(Math.max(0, this.current - 1), this.max);
  }

  gain(): Rhythm {
    return new Rhythm(Math.min(this.max, this.current + 1), this.max);
  }

  asSlots(): boolean[] {
    return Array.from({ length: this.max }, (_, i) => i < this.current);
  }
}
