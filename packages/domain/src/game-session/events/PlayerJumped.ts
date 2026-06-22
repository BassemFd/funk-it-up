import { DomainEvent } from "./DomainEvent";
import { Timestamp } from "../../beat/Timestamp";
import { BeatRating } from "../../beat/BeatRating";

export interface PlayerJumped extends DomainEvent {
  readonly name: "PlayerJumped";
  readonly at: Timestamp;
  readonly rating: BeatRating;
}
