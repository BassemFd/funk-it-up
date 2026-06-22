import { PlayerId } from "./PlayerId";

interface CreateProps {
  displayName: string;
  spotifyId?: string;
}

interface ReconstituteProps {
  id: PlayerId;
  displayName: string;
  spotifyId: string | null;
  totalScore: number;
}

export class Player {
  readonly id: PlayerId;
  readonly displayName: string;
  readonly spotifyId: string | null;
  readonly totalScore: number;

  private constructor(props: ReconstituteProps) {
    this.id = props.id;
    this.displayName = props.displayName;
    this.spotifyId = props.spotifyId;
    this.totalScore = props.totalScore;
  }

  static create(props: CreateProps): Player {
    if (props.displayName.length < 2) {
      throw new Error("Display name must be at least 2 characters");
    }
    if (props.displayName.length > 30) {
      throw new Error("Display name must be at most 30 characters");
    }
    return new Player({
      id: PlayerId.generate(),
      displayName: props.displayName,
      spotifyId: props.spotifyId ?? null,
      totalScore: 0,
    });
  }

  static reconstitute(props: ReconstituteProps): Player {
    return new Player(props);
  }
}
