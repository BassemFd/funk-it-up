import { useEffect, useCallback, useMemo, useState } from "react";
import { GameScene } from "./scene/GameScene";
import { HUD } from "./components/HUD";
import { StartScreen } from "./components/StartScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { CameraTiltControls } from "./components/CameraTiltControls";
import { useGameStore, gameStore } from "./store/useGameStore";
import { BeatEngine } from "./engine/BeatEngine";
import { BeatmapEntry } from "./engine/PlatformGenerator";
import { useBeatEngine } from "./hooks/useBeatEngine";
import { musicPlayer } from "./audio/MusicPlayer";

// BPM measured with `aubio tempo` (no Spotify audio-features endpoint for
// new apps anymore — see CLAUDE.md "Real audio — not Spotify"). Kept only
// for display/gait-animation purposes now — actual beat timing/platform
// placement comes from the real beatmap below, not this average value.
const DEFAULT_BPM = 113;
const DEFAULT_TRACK = "sweet-addiction";
const TRACK_URL = "/audio/01-sweet-addiction.mp3";
const BEATMAP_URL = "/beatmaps/sweet-addiction.json";

const EMPTY_BEATMAP: BeatmapEntry[] = [];

export function App() {
  const status = useGameStore((s) => s.status);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const [beatmap, setBeatmap] = useState<BeatmapEntry[]>(EMPTY_BEATMAP);

  // Memoized so this array reference only changes when beatmap itself does
  // (i.e. once, on load) — useBeatEngine recreates the engine whenever this
  // reference changes, so a fresh array every render would silently wipe
  // BeatEngine's progress on every unrelated re-render.
  const beatTimestampsMs = useMemo(() => beatmap.map((b) => b.timeMs), [beatmap]);
  const engine: BeatEngine = useBeatEngine(beatTimestampsMs);
  const trackReady = musicReady && beatmap !== EMPTY_BEATMAP;

  useEffect(() => {
    musicPlayer
      .load(TRACK_URL)
      .then(() => setMusicReady(true))
      .catch((err) => console.error("Failed to load track:", err));

    fetch(BEATMAP_URL)
      .then((res) => res.json())
      .then((data: { beats: BeatmapEntry[] }) => setBeatmap(data.beats))
      .catch((err) => console.error("Failed to load beatmap:", err));
  }, []);

  const startGame = useCallback(() => {
    engine.reset();
    musicPlayer.play();
    gameStore.getState().startGame({
      bpm: DEFAULT_BPM,
      trackId: DEFAULT_TRACK,
      beatmap,
    });
  }, [engine, beatmap]);

  // Keyboard & touch input
  useEffect(() => {
    const handleJump = () => {
      const { status, registerJump } = gameStore.getState();
      if (status !== "PLAYING") return;

      const atMs = engine.elapsedMs;
      const rating = engine.rateJump(atMs);
      const beatNumber = engine.nearestBeatIndex(atMs);
      registerJump(rating, beatNumber);
    };

    const onKey = (e: KeyboardEvent) => {
      // Arrow keys now drive the camera (see CameraTiltControls) — only
      // Space triggers a jump.
      if (e.code === "Space") {
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
      <GameScene engine={engine} beatmap={beatmap} />

      {status === "PLAYING" && <HUD />}
      {status === "IDLE" && <StartScreen onStart={startGame} musicReady={trackReady} />}
      {status === "GAME_OVER" && <GameOverScreen />}

      <button
        style={styles.leaderboardBtn}
        onClick={() => setShowLeaderboard(true)}
        onTouchStart={(e) => e.stopPropagation()}
      >
        🏆 LEADERBOARD
      </button>

      <CameraTiltControls />

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
