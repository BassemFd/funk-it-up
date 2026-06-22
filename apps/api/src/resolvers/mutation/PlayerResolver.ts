import { Player, PlayerId } from "@funk-it-up/domain";
import { IPlayerRepository } from "../../repositories/IPlayerRepository";

interface CreatePlayerArgs {
  displayName: string;
  spotifyId?: string;
}

interface PlayerDTO {
  id: string;
  displayName: string;
  spotifyId: string | null;
  totalScore: number;
}

function toDTO(player: Player): PlayerDTO {
  return {
    id: player.id.value,
    displayName: player.displayName,
    spotifyId: player.spotifyId,
    totalScore: player.totalScore,
  };
}

export class PlayerResolver {
  constructor(private readonly playerRepo: IPlayerRepository) {}

  async createPlayer(args: CreatePlayerArgs): Promise<PlayerDTO> {
    const player = Player.create({
      displayName: args.displayName,
      spotifyId: args.spotifyId,
    });
    await this.playerRepo.save(player);
    return toDTO(player);
  }

  async player(args: { id: string }): Promise<PlayerDTO | null> {
    const found = await this.playerRepo.findById(PlayerId.of(args.id));
    return found ? toDTO(found) : null;
  }
}
