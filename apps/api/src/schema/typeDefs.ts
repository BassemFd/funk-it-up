export const typeDefs = `#graphql

  # ── Scalars ──────────────────────────────────────────────────────────────
  scalar DateTime

  # ── Enums ────────────────────────────────────────────────────────────────
  enum SessionStatus {
    WAITING
    PLAYING
    FINISHED
    GAME_OVER
  }

  enum BeatRating {
    PERFECT
    GOOD
    MISS
  }

  # ── Types ────────────────────────────────────────────────────────────────
  type Player {
    id: ID!
    displayName: String!
    spotifyId: String
    totalScore: Int!
  }

  type ScoreSnapshot {
    points: Int!
    combo: Int!
    maxCombo: Int!
    multiplier: Int!
  }

  type RhythmSnapshot {
    current: Int!
    max: Int!
    slots: [Boolean!]!
  }

  type Track {
    spotifyTrackId: String!
    title: String!
    artist: String!
    durationMs: Int!
    bpm: Float!
  }

  type GameSession {
    id: ID!
    player: Player!
    track: Track!
    status: SessionStatus!
    score: ScoreSnapshot!
    rhythm: RhythmSnapshot!
    startedAt: DateTime
    endedAt: DateTime
  }

  type LeaderboardEntry {
    rank: Int!
    player: Player!
    points: Int!
    maxCombo: Int!
    trackId: String!
  }

  type Leaderboard {
    trackId: String!
    entries: [LeaderboardEntry!]!
  }

  type JumpResult {
    rating: BeatRating!
    session: GameSession!
  }

  type AuthPayload {
    playerId: ID!
    displayName: String!
    token: String!
  }

  # ── Queries ───────────────────────────────────────────────────────────────
  type Query {
    # Leaderboard global pour une track
    leaderboard(trackId: String!): Leaderboard!

    # Rang d'un joueur pour une track
    playerRank(playerId: ID!, trackId: String!): Int

    # Détail d'un joueur
    player(id: ID!): Player

    # Session en cours
    gameSession(id: ID!): GameSession
  }

  # ── Mutations ─────────────────────────────────────────────────────────────
  type Mutation {
    # Crée un joueur (via Spotify OAuth)
    createPlayer(displayName: String!, spotifyId: String): Player!

    # Démarre une session de jeu
    startSession(playerId: ID!, spotifyTrackId: String!, bpm: Float!): GameSession!

    # Le joueur saute — retourne le résultat + session mise à jour
    jump(sessionId: ID!, atMs: Int!): JumpResult!

    # Le joueur ramasse un rythme (The One platform)
    gainRhythm(sessionId: ID!, atMs: Int!): GameSession!

    # Termine la session normalement (fin de track)
    finishSession(sessionId: ID!, atMs: Int!): GameSession!

    # Soumet un score final au leaderboard — l'identité vient du token, jamais
    # d'un playerId/displayName fourni par le client
    submitScore(
      token: String!
      trackId: String!
      points: Int!
      maxCombo: Int!
    ): LeaderboardEntry!

    # Crée un compte joueur avec un nom unique (rejeté si déjà pris)
    registerPlayer(displayName: String!, password: String!): AuthPayload!

    # Récupère l'accès à un compte existant
    loginPlayer(displayName: String!, password: String!): AuthPayload!
  }

  # ── Subscriptions ─────────────────────────────────────────────────────────
  type Subscription {
    # Leaderboard mis à jour en temps réel pour une track
    leaderboardUpdated(trackId: String!): Leaderboard!
  }
`;
