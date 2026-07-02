import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BeatEngine } from "../../engine/BeatEngine";
import { gameStore } from "../../store/useGameStore";
import { musicPlayer } from "../../audio/MusicPlayer";

interface Props {
  engine: BeatEngine;
}

export function BeatLoop({ engine }: Props) {
  const prevStatusRef = useRef<string>("IDLE");

  useFrame(() => {
    const { status } = gameStore.getState();

    if (prevStatusRef.current !== "PLAYING" && status === "PLAYING") {
      engine.reset();
    }
    if (prevStatusRef.current === "PLAYING" && status !== "PLAYING") {
      musicPlayer.stop();
    }
    prevStatusRef.current = status;

    if (status !== "PLAYING") return;

    // musicPlayer.getElapsedMs() is the single source of truth for game
    // time — see MusicPlayer.ts for why this replaced Three.js's clock.
    engine.tick(musicPlayer.getElapsedMs());
  });

  return null;
}
