import { gql } from "@apollo/client";

export const SUBMIT_SCORE = gql`
  mutation SubmitScore(
    $playerId: ID!
    $displayName: String!
    $trackId: String!
    $points: Int!
    $maxCombo: Int!
  ) {
    submitScore(
      playerId: $playerId
      displayName: $displayName
      trackId: $trackId
      points: $points
      maxCombo: $maxCombo
    ) {
      rank
      points
      maxCombo
      player {
        id
        displayName
      }
    }
  }
`;

export const LEADERBOARD_QUERY = gql`
  query Leaderboard($trackId: String!) {
    leaderboard(trackId: $trackId) {
      trackId
      entries {
        rank
        points
        maxCombo
        player {
          id
          displayName
        }
      }
    }
  }
`;

export const LEADERBOARD_SUBSCRIPTION = gql`
  subscription LeaderboardUpdated($trackId: String!) {
    leaderboardUpdated(trackId: $trackId) {
      trackId
      entries {
        rank
        points
        maxCombo
        player {
          id
          displayName
        }
      }
    }
  }
`;
