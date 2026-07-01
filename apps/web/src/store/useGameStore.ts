import { useStore } from "zustand/react";
import { createGameStore } from "./gameStore";

export const gameStore = createGameStore();

if (import.meta.env.DEV) {
  (globalThis as unknown as { __gameStore: typeof gameStore }).__gameStore = gameStore;
}

export function useGameStore<T>(selector: (s: ReturnType<typeof gameStore.getState>) => T): T {
  return useStore(gameStore, selector);
}
