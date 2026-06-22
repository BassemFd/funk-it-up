import { DomainEvent } from "./DomainEvent";

export interface RhythmLost extends DomainEvent {
  readonly name: "RhythmLost";
  readonly remaining: number;
}
