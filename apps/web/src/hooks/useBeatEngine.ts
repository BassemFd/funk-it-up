import { useRef, useEffect } from "react";
import { BeatEngine } from "../engine/BeatEngine";
import { gameStore } from "../store/useGameStore";

export function useBeatEngine(beatTimestampsMs: number[]) {
  const engineRef = useRef<BeatEngine | null>(null);
  const prevBeatmapRef = useRef<number[] | null>(null);

  // Recreate the engine whenever the real beatmap changes (e.g. placeholder
  // [] -> the actual loaded track) — BeatEngine's timestamps are fixed at
  // construction, unlike the old bpm-only version which had nothing to swap.
  if (engineRef.current === null || prevBeatmapRef.current !== beatTimestampsMs) {
    engineRef.current = BeatEngine.create({ beatTimestampsMs });
    prevBeatmapRef.current = beatTimestampsMs;
  }

  useEffect(() => {
    const engine = engineRef.current!;
    engine.clearCallbacks();

    engine.onBeat((beatNumber) => {
      const state = gameStore.getState();
      if (state.status !== "PLAYING") return;

      // GAP positions come from the actual generated platform layout
      // (energy-driven, not a fixed modulo pattern) — missGap() is a no-op
      // if the player is already airborne, i.e. cleared it.
      if (state.gapBeats.has(beatNumber)) {
        gameStore.getState().missGap();
      }
    });

    return () => {
      engine.clearCallbacks();
      engine.reset();
    };
  }, [beatTimestampsMs]);

  return engineRef.current;
}
