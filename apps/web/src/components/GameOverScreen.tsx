import { useEffect, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { useGameStore } from "../store/useGameStore";
import { gameStore } from "../store/useGameStore";
import { SUBMIT_SCORE, LEADERBOARD_QUERY } from "../api/queries";
import { getOrCreatePlayerId, getDisplayName } from "../api/playerIdentity";
import { Leaderboard } from "./Leaderboard";

export function GameOverScreen() {
  const score = useGameStore((s) => s.score);
  const trackId = useGameStore((s) => s.trackId);
  const [submitScore] = useMutation(SUBMIT_SCORE);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current || !trackId) return;
    submittedRef.current = true;

    // Explicit refetch: the leaderboard subscription's WebSocket handshake is
    // slower than this HTTP mutation, so it can miss the publish event fired
    // from the mutation resolver. Refetching the query guarantees the UI
    // reflects the just-submitted score even if the subscription missed it.
    submitScore({
      variables: {
        playerId: getOrCreatePlayerId(),
        displayName: getDisplayName(),
        trackId,
        points: score.points,
        maxCombo: score.maxCombo,
      },
      refetchQueries: [{ query: LEADERBOARD_QUERY, variables: { trackId } }],
    }).catch((err) => console.warn("Failed to submit score:", err));
  }, [submitScore, trackId, score.points, score.maxCombo]);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>GAME OVER</h2>
        <div style={styles.scoreBlock}>
          <span style={styles.label}>SCORE</span>
          <span style={styles.points}>{score.points.toLocaleString()}</span>
          <span style={styles.label}>MAX COMBO</span>
          <span style={styles.combo}>{score.maxCombo}</span>
        </div>
        {trackId && <Leaderboard trackId={trackId} />}
        <button
          style={styles.btn}
          onClick={() => gameStore.getState().reset()}
        >
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(26, 5, 51, 0.95)",
    fontFamily: "monospace",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: "48px 64px",
    border: "2px solid #e040fb",
    borderRadius: 12,
    background: "rgba(40, 10, 80, 0.95)",
    boxShadow: "0 0 48px rgba(224, 64, 251, 0.3)",
  },
  title: {
    fontSize: 48,
    fontWeight: 900,
    color: "#e040fb",
    textShadow: "0 0 24px #e040fb",
    letterSpacing: 6,
  },
  scoreBlock: {
    display: "grid",
    gridTemplateColumns: "auto auto",
    gap: "8px 24px",
    alignItems: "baseline",
  },
  label: {
    fontSize: 11,
    color: "#9060c0",
    letterSpacing: 2,
    textAlign: "right",
  },
  points: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#f0e060",
    textShadow: "0 0 12px #f0c040",
  },
  combo: {
    fontSize: 28,
    color: "#e040fb",
  },
  btn: {
    marginTop: 8,
    padding: "14px 40px",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 3,
    background: "transparent",
    color: "#e040fb",
    border: "2px solid #e040fb",
    borderRadius: 6,
    cursor: "pointer",
    boxShadow: "0 0 12px rgba(224, 64, 251, 0.4)",
    transition: "all 0.15s",
  },
};
