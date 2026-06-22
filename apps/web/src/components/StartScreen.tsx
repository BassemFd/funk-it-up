interface Props {
  onStart: () => void;
}

export function StartScreen({ onStart }: Props) {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>FUNK IT UP</h1>
        <p style={styles.sub}>A rhythmic platformer</p>
        <p style={styles.hint}>Jump on the beat · Keep the groove alive</p>
        <button style={styles.btn} onClick={onStart}>
          PRESS TO PLAY
        </button>
        <p style={styles.controls}>
          <kbd style={styles.kbd}>SPACE</kbd> or tap to jump
        </p>
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
    background: "rgba(26, 5, 51, 0.92)",
    fontFamily: "monospace",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "48px 64px",
    border: "2px solid #6030a0",
    borderRadius: 12,
    background: "rgba(40, 10, 80, 0.95)",
  },
  title: {
    fontSize: 56,
    fontWeight: 900,
    color: "#f0e060",
    textShadow: "0 0 24px #f0c040, 0 0 48px #f08000",
    letterSpacing: 8,
  },
  sub: {
    fontSize: 16,
    color: "#e040fb",
    textShadow: "0 0 8px #e040fb",
    letterSpacing: 3,
  },
  hint: {
    fontSize: 13,
    color: "#9060c0",
    letterSpacing: 1,
  },
  btn: {
    marginTop: 16,
    padding: "14px 40px",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 3,
    background: "#e040fb",
    color: "#1a0533",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    boxShadow: "0 0 24px #e040fb",
    transition: "transform 0.1s",
  },
  controls: {
    fontSize: 12,
    color: "#6030a0",
    marginTop: 8,
  },
  kbd: {
    background: "#3a1060",
    border: "1px solid #6030a0",
    borderRadius: 4,
    padding: "2px 8px",
    color: "#e040fb",
  },
};
