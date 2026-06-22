import { useRef, useEffect } from "react";
import { BeatEngine } from "../engine/BeatEngine";
import { gameStore } from "../store/useGameStore";

export function useBeatEngine(bpm: number) {
  const engineRef = useRef<BeatEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = BeatEngine.create({ bpm });
  }

  useEffect(() => {
    const engine = engineRef.current!;

    engine.onBeat(() => {
      const { status, advanceCharacter } = gameStore.getState();
      if (status === "PLAYING") {
        advanceCharacter({ deltaX: 1.5 });
      }
    });

    engine.onDownbeat(() => {
      // "The One" pulse — used by scene for visual feedback
    });

    return () => engine.reset();
  }, [bpm]);

  return engineRef.current;
}
