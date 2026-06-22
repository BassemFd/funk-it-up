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
    engine.clearCallbacks();

    engine.onBeat((beatNumber) => {
      const state = gameStore.getState();
      if (state.status !== "PLAYING") return;

      const wasJumping = state.character.isJumping;
      state.advanceCharacter({ deltaX: 1.5 });

      // Beat 2 of every measure = GAP — if not airborne, auto-MISS
      if (beatNumber % 4 === 2 && !wasJumping) {
        gameStore.getState().registerJump("MISS");
      }
    });

    return () => {
      engine.clearCallbacks();
      engine.reset();
    };
  }, [bpm]);

  return engineRef.current;
}
