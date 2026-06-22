import { useEffect, useCallback } from "react";
import { GameScene } from "./scene/GameScene";
import { HUD } from "./components/HUD";
import { StartScreen } from "./components/StartScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { useGameStore, gameStore } from "./store/useGameStore";
import { BeatEngine } from "./engine/BeatEngine";
import { useBeatEngine } from "./hooks/useBeatEngine";

const DEFAULT_BPM = 98;
const DEFAULT_TRACK = "jeroboam-funk-01";

export function App() {
  const status = useGameStore((s) => s.status);
  const bpm = useGameStore((s) => s.bpm) ?? DEFAULT_BPM;
  const engine: BeatEngine = useBeatEngine(bpm);

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
      registerJump(rating);
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
    </div>
  );
}
