import type { Character } from './types';

const SAVE_KEY = 'lifesim_save_v18';

export interface SaveData {
  character: Character;
  firedOnce: string[];
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save game:', err);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch (err) {
    console.error('Failed to load save:', err);
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error('Failed to clear save:', err);
  }
}

const LIVES_LIVED_KEY = 'lifesim_lives_lived';

// Total number of lives ever started, across all characters and saves.
export function getLivesLived(): number {
  try {
    return parseInt(localStorage.getItem(LIVES_LIVED_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementLivesLived(): number {
  const next = getLivesLived() + 1;
  try {
    localStorage.setItem(LIVES_LIVED_KEY, String(next));
  } catch {
    // localStorage unavailable; the counter just won't persist.
  }
  return next;
}
