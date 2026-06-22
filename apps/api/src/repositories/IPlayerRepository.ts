import { Player } from "@funk-it-up/domain";
import { PlayerId } from "@funk-it-up/domain";

export interface IPlayerRepository {
  save(player: Player): Promise<void>;
  findById(id: PlayerId): Promise<Player | null>;
  findBySpotifyId(spotifyId: string): Promise<Player | null>;
}
