import { BeatRating } from "@funk-it-up/domain";

const PERFECT_MS = 30;
const GOOD_MS = 80;

type BeatCallback = (beatNumber: number) => void;

interface BeatEngineOptions {
  // Real, measured beat timestamps (ms) from the actual track — see
  // scripts/generate-beatmap.mjs. Index in this array = "beat number"
  // everywhere else in the game (gameStore, PlatformGenerator, ...).
  beatTimestampsMs: number[];
}

export class BeatEngine {
  private _elapsedMs = 0;
  private _currentBeat = -1; // -1 = before the first real beat
  private beatCallbacks: BeatCallback[] = [];
  private downbeatCallbacks: BeatCallback[] = [];

  private constructor(private readonly beatTimestampsMs: number[]) {}

  static create(opts: BeatEngineOptions): BeatEngine {
    return new BeatEngine(opts.beatTimestampsMs);
  }

  get elapsedMs(): number {
    return this._elapsedMs;
  }

  get currentBeat(): number {
    return this._currentBeat;
  }

  get beatCount(): number {
    return this.beatTimestampsMs.length;
  }

  get nextBeatAt(): number {
    return this.beatTimestampsMs[this._currentBeat + 1] ?? Infinity;
  }

  tick(newElapsedMs: number): void {
    const prevBeat = this._currentBeat;
    this._elapsedMs = newElapsedMs;

    while (this._currentBeat + 1 < this.beatTimestampsMs.length) {
      const next = this.beatTimestampsMs[this._currentBeat + 1]!; // bounds just checked
      if (newElapsedMs < next) break;
      this._currentBeat++;
    }

    for (let b = prevBeat + 1; b <= this._currentBeat; b++) {
      this.beatCallbacks.forEach((cb) => cb(b));
      if (b % 4 === 0 && b > 0) {
        this.downbeatCallbacks.forEach((cb) => cb(b));
      }
    }
  }

  onBeat(cb: BeatCallback): void {
    this.beatCallbacks.push(cb);
  }

  onDownbeat(cb: BeatCallback): void {
    this.downbeatCallbacks.push(cb);
  }

  // Index of the real beat timestamp closest to atMs. Only checks around
  // _currentBeat rather than scanning the whole array — rateJump is always
  // called near "now", so the answer is always currentBeat or its neighbor.
  nearestBeatIndex(atMs: number): number {
    const candidates = [this._currentBeat, this._currentBeat + 1].filter(
      (i) => i >= 0 && i < this.beatTimestampsMs.length,
    );
    if (candidates.length === 0) return 0;
    return candidates.reduce((best, i) =>
      Math.abs(atMs - this.beatTimestampsMs[i]!) < Math.abs(atMs - this.beatTimestampsMs[best]!) ? i : best,
    );
  }

  rateJump(atMs: number): BeatRating {
    if (this.beatTimestampsMs.length === 0) return "MISS";

    const idx = this.nearestBeatIndex(atMs);
    const distance = Math.abs(atMs - this.beatTimestampsMs[idx]!);

    if (distance <= PERFECT_MS) return "PERFECT";
    if (distance <= GOOD_MS) return "GOOD";
    return "MISS";
  }

  clearCallbacks(): void {
    this.beatCallbacks = [];
    this.downbeatCallbacks = [];
  }

  reset(): void {
    this._elapsedMs = 0;
    this._currentBeat = -1;
  }
}
