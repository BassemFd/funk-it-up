import { BeatRating } from "@funk-it-up/domain";

const PERFECT_MS = 30;
const GOOD_MS = 80;

type BeatCallback = (beatNumber: number) => void;

interface BeatEngineOptions {
  bpm: number;
}

export class BeatEngine {
  readonly intervalMs: number;

  private _elapsedMs = 0;
  private _currentBeat = 0;
  private beatCallbacks: BeatCallback[] = [];
  private downbeatCallbacks: BeatCallback[] = [];

  private constructor(private readonly bpm: number) {
    this.intervalMs = (60 / bpm) * 1000;
  }

  static create(opts: BeatEngineOptions): BeatEngine {
    return new BeatEngine(opts.bpm);
  }

  get elapsedMs(): number {
    return this._elapsedMs;
  }

  get currentBeat(): number {
    return this._currentBeat;
  }

  get nextBeatAt(): number {
    return (this._currentBeat + 1) * this.intervalMs;
  }

  tick(newElapsedMs: number): void {
    const prevBeat = this._currentBeat;
    this._elapsedMs = newElapsedMs;
    this._currentBeat = Math.floor(newElapsedMs / this.intervalMs);

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

  rateJump(atMs: number): BeatRating {
    const nearestBeat = Math.round(atMs / this.intervalMs);
    const beatTs = nearestBeat * this.intervalMs;
    const distance = Math.abs(atMs - beatTs);

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
    this._currentBeat = 0;
  }
}
