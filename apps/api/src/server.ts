import http from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";
import Redis from "ioredis";
import { typeDefs } from "./schema/typeDefs.js";
import { buildResolvers } from "./resolvers/index.js";
import { InMemoryPlayerRepository } from "./repositories/InMemoryPlayerRepository.js";
import { InMemoryGameSessionRepository } from "./repositories/InMemoryGameSessionRepository.js";
import { InMemoryLeaderboardRepository } from "./repositories/InMemoryLeaderboardRepository.js";
import { RedisLeaderboardRepository } from "./repositories/RedisLeaderboardRepository.js";
import type { ILeaderboardRepository } from "./repositories/ILeaderboardRepository.js";

const PORT = parseInt(process.env.PORT ?? "4000", 10);
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

async function main() {
  const pubsub = new PubSub();

  // ── Repositories ────────────────────────────────────────────────────────────
  const playerRepo = new InMemoryPlayerRepository();
  const sessionRepo = new InMemoryGameSessionRepository();

  let leaderboardRepo: ILeaderboardRepository;
  let redis: Redis | null = null;

  try {
    redis = new Redis(REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    await redis.connect();
    leaderboardRepo = new RedisLeaderboardRepository(redis, pubsub);
    console.log("📦  Redis leaderboard connected →", REDIS_URL);
  } catch {
    console.warn("⚠️   Redis unavailable — falling back to in-memory leaderboard");
    leaderboardRepo = new InMemoryLeaderboardRepository(pubsub);
  }

  // ── Schema ──────────────────────────────────────────────────────────────────
  const resolvers = buildResolvers(playerRepo, sessionRepo, leaderboardRepo, pubsub);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // ── HTTP + WS servers ───────────────────────────────────────────────────────
  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const wsCleanup = useServer({ schema }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
              await redis?.quit();
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ origin: "*" }),
    express.json(),
    expressMiddleware(apolloServer),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "funk-it-up-api", redis: redis !== null });
  });

  httpServer.listen(PORT, () => {
    console.log(`🎸  API → http://localhost:${PORT}/graphql`);
    console.log(`🔌  WS  → ws://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
