import { DomainEvent } from "./DomainEvent";
import { Score } from "../../score/Score";

export interface GameOver extends DomainEvent {
  readonly name: "GameOver";
  readonly finalScore: Score;
}
