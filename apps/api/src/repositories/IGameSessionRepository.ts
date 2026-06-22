import { GameSession } from "@funk-it-up/domain";
import { GameSessionId } from "@funk-it-up/domain";

export interface IGameSessionRepository {
  save(session: GameSession): Promise<void>;
  findById(id: GameSessionId): Promise<GameSession | null>;
}
