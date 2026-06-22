import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();
export const LEADERBOARD_UPDATED = (trackId: string) =>
  `LEADERBOARD_UPDATED_${trackId}`;
