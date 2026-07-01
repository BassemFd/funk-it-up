import { useEffect, useCallback, useState } from "react";
import { GameScene } from "./scene/GameScene";
import { HUD } from "./components/HUD";
import { StartScreen } from "./components/StartScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { useGameStore, gameStore } from "./store/useGameStore";
import { BeatEngine } from "./engine/BeatEngine";
import { useBeatEngine } from "./hooks/useBeatEngine";

const DEFAULT_BPM = 98;
const DEFAULT_TRACK = "jeroboam-funk-01";

export function App() {
  const status = useGameStore((s) => s.status);
  const bpm = useGameStore((s) => s.bpm) ?? DEFAULT_BPM;
  const engine: BeatEngine = useBeatEngine(bpm);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const startGame = useCallback(() => {
    engine.reset();
    gameStore.getState().startGame({
      bpm: DEFAULT_BPM,
      trackId: DEFAULT_TRACK,
    });
  }, [engine]);

  // Keyboard & touch input
  useEffect(() => {
    const handleJump = () => {
      const { status, registerJump } = gameStore.getState();
      if (status !== "PLAYING") return;

      const rating = engine.rateJump(engine.elapsedMs);
      const beatNumber = Math.round(engine.elapsedMs / engine.intervalMs);
      registerJump(rating, beatNumber);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      }
    };

    const onTouch = () => handleJump();

    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [engine]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Three.js canvas always mounted to keep context alive */}
      <GameScene engine={engine} bpm={bpm} trackId={DEFAULT_TRACK} />

      {status === "PLAYING" && <HUD />}
      {status === "IDLE" && <StartScreen onStart={startGame} />}
      {status === "GAME_OVER" && <GameOverScreen />}

      <button
        style={styles.leaderboardBtn}
        onClick={() => setShowLeaderboard(true)}
        onTouchStart={(e) => e.stopPropagation()}
      >
        🏆 LEADERBOARD
      </button>

      {showLeaderboard && (
        <LeaderboardModal trackId={DEFAULT_TRACK} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  leaderboardBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 1,
    background: "rgba(40, 10, 80, 0.9)",
    color: "#e0c0f0",
    border: "1px solid #6030a0",
    borderRadius: 6,
    cursor: "pointer",
    zIndex: 10,
  },
};
