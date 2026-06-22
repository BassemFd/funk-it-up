import { useRef, useEffect } from "react";
import { BeatEngine } from "../engine/BeatEngine";
import { PLATFORM_SPACING } from "../engine/PlatformGenerator";
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

      // Gap check BEFORE advancing: character is currently AT beatNumber's platform
      // beat%4===2 = GAP — must be airborne to cross it
      if (beatNumber % 4 === 2 && !state.character.isJumping) {
        gameStore.getState().registerJump("MISS");
      }

      gameStore.getState().advanceCharacter({ deltaX: PLATFORM_SPACING });
    });

    return () => {
      engine.clearCallbacks();
      engine.reset();
    };
  }, [bpm]);

  return engineRef.current;
}
