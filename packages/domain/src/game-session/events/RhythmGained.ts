import { DomainEvent } from "./DomainEvent";

export interface RhythmGained extends DomainEvent {
  readonly name: "RhythmGained";
  readonly current: number;
}
