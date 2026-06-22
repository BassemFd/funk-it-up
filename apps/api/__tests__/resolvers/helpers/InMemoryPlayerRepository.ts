import { Player, PlayerId } from "@funk-it-up/domain";
import { IPlayerRepository } from "../../../src/repositories/IPlayerRepository";

export class InMemoryPlayerRepository implements IPlayerRepository {
  private store = new Map<string, Player>();

  async save(player: Player): Promise<void> {
    this.store.set(player.id.value, player);
  }

  async findById(id: PlayerId): Promise<Player | null> {
    return this.store.get(id.value) ?? null;
  }

  async findBySpotifyId(spotifyId: string): Promise<Player | null> {
    for (const player of this.store.values()) {
      if (player.spotifyId === spotifyId) return player;
    }
    return null;
  }
}
