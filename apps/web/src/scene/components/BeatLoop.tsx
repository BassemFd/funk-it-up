import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BeatEngine } from "../../engine/BeatEngine";
import { gameStore } from "../../store/useGameStore";

interface Props {
  engine: BeatEngine;
}

export function BeatLoop({ engine }: Props) {
  const startTimeRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const { status } = gameStore.getState();
    if (status !== "PLAYING") return;

    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime;
    }

    const elapsedMs = (clock.elapsedTime - startTimeRef.current) * 1000;
    engine.tick(elapsedMs);
  });

  return null;
}
