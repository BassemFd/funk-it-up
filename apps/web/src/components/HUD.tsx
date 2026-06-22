import { useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import type { BeatRating } from "@funk-it-up/domain";

const RATING_COLORS: Record<BeatRating, string> = {
  PERFECT: "#f0e060",
  GOOD: "#40e0a0",
  MISS: "#e04060",
};

export function HUD() {
  const score = useGameStore((s) => s.score);
  const rhythm = useGameStore((s) => s.rhythm);
  const lastRating = useGameStore((s) => s.lastRating);
  const clearRating = useGameStore((s) => s.clearRating);

  // Track a key per rating flash to force CSS animation remount
  const ratingKeyRef = useRef(0);
  const displayedRating = useRef<BeatRating | null>(null);

  if (lastRating !== null) {
    displayedRating.current = lastRating;
    ratingKeyRef.current += 1;
  }

  useEffect(() => {
    if (!lastRating) return;
    const t = setTimeout(clearRating, 700);
    return () => clearTimeout(t);
  }, [lastRating, clearRating]);

  return (
    <div style={styles.hud}>
      {/* Score */}
      <div style={styles.score}>
        <span style={styles.points}>{score.points.toLocaleString()}</span>
        {score.combo > 1 && (
          <span style={styles.combo}>×{score.multiplier} COMBO {score.combo}</span>
        )}
      </div>

      {/* Rating flash */}
      {displayedRating.current && lastRating && (
        <div
          key={ratingKeyRef.current}
          style={{
            ...styles.ratingFlash,
            color: RATING_COLORS[displayedRating.current],
            textShadow: `0 0 20px ${RATING_COLORS[displayedRating.current]}`,
          }}
        >
          {displayedRating.current}
        </div>
      )}

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
  ratingFlash: {
    position: "absolute",
    top: "38%",
    left: "50%",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 4,
    animation: "ratingFade 0.7s ease-out forwards",
    pointerEvents: "none",
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
