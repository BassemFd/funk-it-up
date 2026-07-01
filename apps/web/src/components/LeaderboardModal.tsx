import { Leaderboard } from "./Leaderboard";

interface Props {
  trackId: string;
  onClose: () => void;
}

export function LeaderboardModal({ trackId, onClose }: Props) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close leaderboard">
          ×
        </button>
        <h2 style={styles.title}>LEADERBOARD</h2>
        <Leaderboard trackId={trackId} limit={20} showTitle={false} />
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
    background: "rgba(10, 2, 24, 0.75)",
    fontFamily: "monospace",
    zIndex: 20,
  },
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "36px 48px",
    border: "2px solid #e040fb",
    borderRadius: 12,
    background: "rgba(40, 10, 80, 0.98)",
    boxShadow: "0 0 48px rgba(224, 64, 251, 0.35)",
    minWidth: 280,
    maxHeight: "80vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 12,
    background: "none",
    border: "none",
    color: "#e040fb",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    color: "#e040fb",
    textShadow: "0 0 16px #e040fb",
    letterSpacing: 4,
    margin: 0,
  },
};
