import { GameSession, GameSessionId } from "@funk-it-up/domain";
import { IGameSessionRepository } from "./IGameSessionRepository.js";

export class InMemoryGameSessionRepository implements IGameSessionRepository {
  private readonly store = new Map<string, GameSession>();

  async save(session: GameSession): Promise<void> {
    this.store.set(session.id.value, session);
  }

  async findById(id: GameSessionId): Promise<GameSession | null> {
    return this.store.get(id.value) ?? null;
  }
}
