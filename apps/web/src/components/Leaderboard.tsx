import { useQuery, useSubscription } from "@apollo/client/react";
import { LEADERBOARD_QUERY, LEADERBOARD_SUBSCRIPTION } from "../api/queries";
import { getOrCreatePlayerId } from "../api/playerIdentity";

interface Entry {
  rank: number;
  points: number;
  maxCombo: number;
  player: { id: string; displayName: string };
}

interface LeaderboardData {
  leaderboard: { trackId: string; entries: Entry[] };
}

interface Props {
  trackId: string;
}

export function Leaderboard({ trackId }: Props) {
  const { data, loading } = useQuery<LeaderboardData>(LEADERBOARD_QUERY, {
    variables: { trackId },
  });

  const { data: liveData } = useSubscription<LeaderboardData>(
    LEADERBOARD_SUBSCRIPTION,
    { variables: { trackId } },
  );

  const entries = liveData?.leaderboard.entries ?? data?.leaderboard.entries ?? [];
  const myId = getOrCreatePlayerId();

  if (loading && entries.length === 0) {
    return <p style={styles.hint}>Loading leaderboard…</p>;
  }

  if (entries.length === 0) {
    return <p style={styles.hint}>No scores yet — be the first!</p>;
  }

  return (
    <div style={styles.wrapper}>
      <span style={styles.title}>LEADERBOARD</span>
      <ol style={styles.list}>
        {entries.slice(0, 5).map((e) => (
          <li
            key={e.player.id}
            style={{
              ...styles.row,
              color: e.player.id === myId ? "#f0e060" : "#e0c0f0",
            }}
          >
            <span style={styles.rank}>#{e.rank}</span>
            <span style={styles.name}>{e.player.displayName}</span>
            <span style={styles.points}>{e.points.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    marginTop: 8,
    minWidth: 240,
  },
  title: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#9060c0",
    textAlign: "center",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "32px 1fr auto",
    gap: 8,
    fontSize: 13,
  },
  rank: { color: "#6030a0" },
  name: { textAlign: "left" },
  points: { fontWeight: "bold" },
  hint: {
    fontSize: 12,
    color: "#6030a0",
    textAlign: "center",
    marginTop: 8,
  },
};
