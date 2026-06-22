import { GraphQLScalarType, Kind } from "graphql";
import { GameSessionResolver } from "./mutation/GameSessionResolver.js";
import { PlayerResolver } from "./mutation/PlayerResolver.js";
import { LeaderboardResolver } from "./query/LeaderboardResolver.js";
import { IPlayerRepository } from "../repositories/IPlayerRepository.js";
import { IGameSessionRepository } from "../repositories/IGameSessionRepository.js";
import { ILeaderboardRepository } from "../repositories/ILeaderboardRepository.js";
import { pubsub, LEADERBOARD_UPDATED } from "../pubsub.js";

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  serialize: (v) => (v instanceof Date ? v.getTime() : v),
  parseValue: (v) => v,
  parseLiteral: (ast) => (ast.kind === Kind.INT ? parseInt(ast.value, 10) : null),
});

export function buildResolvers(
  playerRepo: IPlayerRepository,
  sessionRepo: IGameSessionRepository,
  leaderboardRepo: ILeaderboardRepository,
) {
  const playerRes = new PlayerResolver(playerRepo);
  const sessionRes = new GameSessionResolver(sessionRepo, playerRepo, leaderboardRepo);
  const leaderboardRes = new LeaderboardResolver(leaderboardRepo);

  return {
    DateTime: DateTimeScalar,

    Query: {
      leaderboard: (_: unknown, args: { trackId: string }) =>
        leaderboardRes.leaderboard(args),
      playerRank: (_: unknown, args: { playerId: string; trackId: string }) =>
        leaderboardRes.playerRank(args),
      player: (_: unknown, args: { id: string }) => playerRes.player(args),
      gameSession: () => null,
    },

    Mutation: {
      createPlayer: (
        _: unknown,
        args: { displayName: string; spotifyId?: string },
      ) => playerRes.createPlayer(args),
      startSession: (
        _: unknown,
        args: { playerId: string; spotifyTrackId: string; bpm: number },
      ) => sessionRes.startSession(args),
      jump: (_: unknown, args: { sessionId: string; atMs: number }) =>
        sessionRes.jump(args),
      gainRhythm: (_: unknown, args: { sessionId: string; atMs: number }) =>
        sessionRes.gainRhythm(args),
      finishSession: (_: unknown, args: { sessionId: string; atMs: number }) =>
        sessionRes.finishSession(args),
    },

    Subscription: {
      leaderboardUpdated: {
        subscribe: (_: unknown, { trackId }: { trackId: string }) =>
          pubsub.asyncIterableIterator(LEADERBOARD_UPDATED(trackId)),
        resolve: (payload: { leaderboardUpdated: unknown }) =>
          payload.leaderboardUpdated,
      },
    },
  };
}
