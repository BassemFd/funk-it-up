import { BeatRating } from "../beat/BeatRating";

const POINTS: Record<BeatRating, number> = {
  PERFECT: 100,
  GOOD: 50,
  MISS: 0,
};

// x2 kicks in ON the 5th hit (after 4 completed), x3 on 8th, x4 on 16th
const MULTIPLIER_THRESHOLDS: Array<[number, number]> = [
  [16, 4],
  [8, 3],
  [5, 2],
  [0, 1],
];

function multiplierFor(combo: number): number {
  for (const [threshold, multiplier] of MULTIPLIER_THRESHOLDS) {
    if (combo >= threshold) return multiplier;
  }
  return 1;
}

interface ScoreState {
  points: number;
  combo: number;
  maxCombo: number;
}

export class Score {
  readonly points: number;
  readonly combo: number;
  readonly maxCombo: number;

  private constructor(state: ScoreState) {
    this.points = state.points;
    this.combo = state.combo;
    this.maxCombo = state.maxCombo;
  }

  static empty(): Score {
    return new Score({ points: 0, combo: 0, maxCombo: 0 });
  }

  get multiplier(): number {
    return multiplierFor(this.combo);
  }

  get hasActiveCombo(): boolean {
    return this.combo > 0;
  }

  add(rating: BeatRating): Score {
    if (rating === BeatRating.MISS) {
      return new Score({
        points: this.points,
        combo: 0,
        maxCombo: this.maxCombo,
      });
    }

    const newCombo = this.combo + 1;
    const earned = POINTS[rating] * multiplierFor(newCombo);

    return new Score({
      points: this.points + earned,
      combo: newCombo,
      maxCombo: Math.max(this.maxCombo, newCombo),
    });
  }
}
