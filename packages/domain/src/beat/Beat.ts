import { BPM } from "./BPM";
import { BeatRating } from "./BeatRating";
import { Timestamp } from "./Timestamp";

const PERFECT_WINDOW_MS = 30;
const GOOD_WINDOW_MS = 80;

interface BeatProps {
  timestamp: Timestamp;
  beatNumber: number;
  bpm: BPM;
}

export class Beat {
  readonly timestamp: Timestamp;
  readonly beatNumber: number;
  readonly bpm: BPM;

  private constructor(props: BeatProps) {
    this.timestamp = props.timestamp;
    this.beatNumber = props.beatNumber;
    this.bpm = props.bpm;
  }

  static create(props: BeatProps): Beat {
    return new Beat(props);
  }

  isOnBeat(action: Timestamp): boolean {
    return this.timestamp.distanceTo(action) <= GOOD_WINDOW_MS;
  }

  rate(action: Timestamp): BeatRating {
    const distance = this.timestamp.distanceTo(action);
    if (distance <= PERFECT_WINDOW_MS) return BeatRating.PERFECT;
    if (distance <= GOOD_WINDOW_MS) return BeatRating.GOOD;
    return BeatRating.MISS;
  }
}
