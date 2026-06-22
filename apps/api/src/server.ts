import http from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { typeDefs } from "./schema/typeDefs.js";
import { buildResolvers } from "./resolvers/index.js";
import { InMemoryPlayerRepository } from "./repositories/InMemoryPlayerRepository.js";
import { InMemoryGameSessionRepository } from "./repositories/InMemoryGameSessionRepository.js";
import { InMemoryLeaderboardRepository } from "./repositories/InMemoryLeaderboardRepository.js";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function main() {
  const playerRepo = new InMemoryPlayerRepository();
  const sessionRepo = new InMemoryGameSessionRepository();
  const leaderboardRepo = new InMemoryLeaderboardRepository();

  const resolvers = buildResolvers(playerRepo, sessionRepo, leaderboardRepo);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

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
    res.json({ status: "ok", service: "funk-it-up-api" });
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
