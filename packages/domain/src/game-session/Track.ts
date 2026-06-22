import { BPM } from "../beat/BPM";

interface TrackProps {
  spotifyTrackId: string;
  title: string;
  artist: string;
  durationMs: number;
  bpm: BPM;
}

export class Track {
  readonly spotifyTrackId: string;
  readonly title: string;
  readonly artist: string;
  readonly durationMs: number;
  readonly bpm: BPM;

  private constructor(props: TrackProps) {
    this.spotifyTrackId = props.spotifyTrackId;
    this.title = props.title;
    this.artist = props.artist;
    this.durationMs = props.durationMs;
    this.bpm = props.bpm;
  }

  static create(props: TrackProps): Track {
    return new Track(props);
  }
}
