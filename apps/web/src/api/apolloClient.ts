import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";
const WS_URL = API_URL.replace(/^http/, "ws");

const httpLink = new HttpLink({ uri: API_URL });

const wsLink = new GraphQLWsLink(createClient({ url: WS_URL }));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink,
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
