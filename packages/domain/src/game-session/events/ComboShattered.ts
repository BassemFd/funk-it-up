import { DomainEvent } from "./DomainEvent";

export interface ComboShattered extends DomainEvent {
  readonly name: "ComboShattered";
  readonly comboLost: number;
}
