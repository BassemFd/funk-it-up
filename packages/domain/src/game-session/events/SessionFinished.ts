import { DomainEvent } from "./DomainEvent";
import { Timestamp } from "../../beat/Timestamp";
import { Score } from "../../score/Score";

export interface SessionFinished extends DomainEvent {
  readonly name: "SessionFinished";
  readonly at: Timestamp;
  readonly finalScore: Score;
}
