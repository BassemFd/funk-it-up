import { gql } from "@apollo/client";

export const SUBMIT_SCORE = gql`
  mutation SubmitScore(
    $token: String!
    $trackId: String!
    $points: Int!
    $maxCombo: Int!
  ) {
    submitScore(
      token: $token
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

export const REGISTER_PLAYER = gql`
  mutation RegisterPlayer($displayName: String!, $password: String!) {
    registerPlayer(displayName: $displayName, password: $password) {
      playerId
      displayName
      token
    }
  }
`;

export const LOGIN_PLAYER = gql`
  mutation LoginPlayer($displayName: String!, $password: String!) {
    loginPlayer(displayName: $displayName, password: $password) {
      playerId
      displayName
      token
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
