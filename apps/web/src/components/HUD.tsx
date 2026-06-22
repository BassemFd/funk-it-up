import { useGameStore } from "../store/useGameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const rhythm = useGameStore((s) => s.rhythm);

  return (
    <div style={styles.hud}>
      {/* Score */}
      <div style={styles.score}>
        <span style={styles.points}>{score.points.toLocaleString()}</span>
        {score.combo > 1 && (
          <span style={styles.combo}>×{score.multiplier} COMBO {score.combo}</span>
        )}
      </div>

      {/* Rhythm slots */}
      <div style={styles.rhythmRow}>
        {rhythm.slots.map((alive, i) => (
          <div
            key={i}
            style={{
              ...styles.rhythmSlot,
              background: alive ? "#e040fb" : "#3a1060",
              boxShadow: alive ? "0 0 8px #e040fb" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    pointerEvents: "none",
    fontFamily: "monospace",
  },
  score: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  points: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f0e060",
    textShadow: "0 0 12px #f0c040",
    letterSpacing: 2,
  },
  combo: {
    fontSize: 14,
    color: "#e040fb",
    textShadow: "0 0 8px #e040fb",
    letterSpacing: 1,
  },
  rhythmRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  rhythmSlot: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid #6030a0",
    transition: "all 0.15s ease",
  },
};
