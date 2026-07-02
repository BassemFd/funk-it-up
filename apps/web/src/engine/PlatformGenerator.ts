export enum PlatformType {
  GROUND = "GROUND",
  GAP = "GAP",
  THE_ONE = "THE_ONE",
}

export interface Platform {
  type: PlatformType;
  x: number;
  y: number;
  width: number;
  height: number;
  beatNumber: number;
}

export interface BeatmapEntry {
  timeMs: number;
  energy: number;
}

interface GeneratorOptions {
  beatmap: BeatmapEntry[];
}

const UNIT_WIDTH = 3;
const PLATFORM_Y = 0;

// World units per second the whole scene scrolls at — deliberately NOT
// derived from bpm anymore (real tracks don't have one constant tempo).
// Character.tsx uses this same constant to move at exactly this speed, so
// platform position and character position are both pure functions of the
// same audio clock — they can never drift apart, by construction.
export const SCROLL_SPEED = 7.5;

// A GAP eats into the player's rhythm meter if they don't jump it — too
// many in a row is unfair, not "adaptive". Never place one right after
// another, and never as the very first platform (no context to react yet).
export class PlatformGenerator {
  private constructor(private readonly beatmap: BeatmapEntry[]) {}

  static create(opts: GeneratorOptions): PlatformGenerator {
    return new PlatformGenerator(opts.beatmap);
  }

  generate(): Platform[] {
    if (this.beatmap.length === 0) return [];

    const energies = [...this.beatmap.map((b) => b.energy)].sort((a, b) => a - b);
    // energies is non-empty here (guarded above), so this index is always valid
    const percentile = (p: number) => energies[Math.floor(p * (energies.length - 1))]!;
    // Beats at/above this energy are candidates for GAP (challenge); the
    // busiest beats overall (top ~10%) become THE_ONE (reward) instead.
    const gapThreshold = percentile(0.75);
    const theOneThreshold = percentile(0.9);

    const platforms: Platform[] = [];
    let prevWasGap = false;

    this.beatmap.forEach((entry, beatNumber) => {
      const x = SCROLL_SPEED * (entry.timeMs / 1000);

      let type: PlatformType;
      if (beatNumber === 0) {
        type = PlatformType.GROUND; // always land somewhere safe first
      } else if (entry.energy >= theOneThreshold) {
        type = PlatformType.THE_ONE;
      } else if (entry.energy >= gapThreshold && !prevWasGap) {
        type = PlatformType.GAP;
      } else {
        type = PlatformType.GROUND;
      }
      prevWasGap = type === PlatformType.GAP;

      platforms.push({
        type,
        x,
        y: type === PlatformType.GAP ? PLATFORM_Y - 2 : PLATFORM_Y,
        width: UNIT_WIDTH,
        height: 0.4,
        beatNumber,
      });
    });

    return platforms;
  }
}
