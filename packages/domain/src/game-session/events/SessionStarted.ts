import { DomainEvent } from "./DomainEvent";
import { Timestamp } from "../../beat/Timestamp";

export interface SessionStarted extends DomainEvent {
  readonly name: "SessionStarted";
  readonly at: Timestamp;
}
