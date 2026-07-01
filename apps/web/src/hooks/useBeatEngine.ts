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

      // beat%4===2 = GAP — player must be airborne; missGap() is a no-op if already jumping
      if (beatNumber % 4 === 2) {
        gameStore.getState().missGap();
      }
      // No advanceCharacter here — character moves continuously in Character.useFrame
    });

    return () => {
      engine.clearCallbacks();
      engine.reset();
    };
  }, [bpm]);

  return engineRef.current;
}
