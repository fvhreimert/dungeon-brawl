// Display preferences that persist across games (not part of per-game settings).

const CRT_KEY = 'dungeon-brawl:crt-enabled'

export function getCrtEnabled(): boolean {
  try {
    return localStorage.getItem(CRT_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setCrtEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CRT_KEY, String(enabled))
  } catch {
    // Storage unavailable — preference just won't persist.
  }
}

const VOLUME_KEY = 'dungeon-brawl:sound-volume'

/** Master sound volume, 0–100. */
export function getSoundVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    const value = raw === null ? 100 : Number(raw)
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 100
  } catch {
    return 100
  }
}

export function setSoundVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume))
  } catch {
    // Storage unavailable — preference just won't persist.
  }
}
