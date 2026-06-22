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

interface GeneratorOptions {
  bpm: number;
  seed: string;
}

// Deterministic seeded pseudo-random (mulberry32)
function seededRng(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
  }
  let s = h >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Beat role in a 4/4 funk measure:
// beat 0 (THE ONE) → THE_ONE (rhythm pickup, occasional)
// beat 1 → GROUND
// beat 2 → GAP (backbeat obstacle)
// beat 3 → GROUND
const UNIT_WIDTH = 3;
const PLATFORM_Y = 0;
export const PLATFORM_SPACING = 4; // world units between beats

export class PlatformGenerator {
  private readonly intervalMs: number;
  private readonly rng: () => number;

  private constructor(private readonly bpm: number, seed: string) {
    this.intervalMs = (60 / bpm) * 1000;
    this.rng = seededRng(seed);
  }

  static create(opts: GeneratorOptions): PlatformGenerator {
    return new PlatformGenerator(opts.bpm, opts.seed);
  }

  generate(opts: { measures: number }): Platform[] {
    const platforms: Platform[] = [];
    const beatsPerMeasure = 4;
    const totalBeats = opts.measures * beatsPerMeasure;

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatInMeasure = beat % beatsPerMeasure;
      const x = beat * PLATFORM_SPACING;

      if (beatInMeasure === 0) {
        // The ONE — rhythm pickup appears ~30% of the time
        const isTheOne = this.rng() < 0.3;
        platforms.push({
          type: isTheOne ? PlatformType.THE_ONE : PlatformType.GROUND,
          x,
          y: PLATFORM_Y,
          width: UNIT_WIDTH,
          height: 0.4,
          beatNumber: beat,
        });
      } else if (beatInMeasure === 1) {
        // Beat 2 → GROUND
        platforms.push({
          type: PlatformType.GROUND,
          x,
          y: PLATFORM_Y,
          width: UNIT_WIDTH,
          height: 0.4,
          beatNumber: beat,
        });
      } else if (beatInMeasure === 2) {
        // Beat 3 → GAP (must jump)
        platforms.push({
          type: PlatformType.GAP,
          x,
          y: PLATFORM_Y - 2,
          width: UNIT_WIDTH,
          height: 0.4,
          beatNumber: beat,
        });
      } else {
        // Beat 4 → GROUND
        platforms.push({
          type: PlatformType.GROUND,
          x,
          y: PLATFORM_Y,
          width: UNIT_WIDTH,
          height: 0.4,
          beatNumber: beat,
        });
      }
    }

    return platforms;
  }
}
