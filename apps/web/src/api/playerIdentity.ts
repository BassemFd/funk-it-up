const PLAYER_ID_KEY = "funk-it-up:playerId";
const DISPLAY_NAME_KEY = "funk-it-up:displayName";

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = globalThis.crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  const stored = localStorage.getItem(DISPLAY_NAME_KEY);
  if (stored) return stored;

  // Distinct default per player so first-time users don't all show as "Funker"
  const suffix = getOrCreatePlayerId().slice(0, 4).toUpperCase();
  const name = `Funker-${suffix}`;
  localStorage.setItem(DISPLAY_NAME_KEY, name);
  return name;
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}
