import { PlayerId } from "../player/PlayerId";

interface EntryProps {
  playerId: PlayerId;
  displayName: string;
  points: number;
  maxCombo: number;
  trackId: string;
}

export class LeaderboardEntry {
  readonly playerId: PlayerId;
  readonly displayName: string;
  readonly points: number;
  readonly maxCombo: number;
  readonly trackId: string;
  rank: number = 0;

  private constructor(props: EntryProps) {
    this.playerId = props.playerId;
    this.displayName = props.displayName;
    this.points = props.points;
    this.maxCombo = props.maxCombo;
    this.trackId = props.trackId;
  }

  static create(props: EntryProps): LeaderboardEntry {
    return new LeaderboardEntry(props);
  }
}
