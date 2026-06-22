import { useStore } from "zustand/react";
import { createGameStore } from "./gameStore";

export const gameStore = createGameStore();

export function useGameStore<T>(selector: (s: ReturnType<typeof gameStore.getState>) => T): T {
  return useStore(gameStore, selector);
}
