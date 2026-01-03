import type { SavedGameState } from '@/types/game'

const STORAGE_KEY = 'dungeon_brawl_game_save'

/**
 * Interface for game state storage operations.
 * Implemented by both web (localStorage) and Tauri (filesystem) storage.
 */
export interface GameStateStorageService {
  hasSavedGame(): Promise<boolean>
  loadSavedGame(): Promise<SavedGameState | null>
  saveGame(state: SavedGameState): Promise<void>
  clearSavedGame(): Promise<void>
}

/**
 * Check if running in Tauri desktop environment.
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Web storage implementation using localStorage.
 */
class WebGameStateStorage implements GameStateStorageService {
  async hasSavedGame(): Promise<boolean> {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null
    } catch {
      return false
    }
  }

  async loadSavedGame(): Promise<SavedGameState | null> {
    try {
      const savedStr = localStorage.getItem(STORAGE_KEY)
      if (!savedStr) {
        return null
      }
      return JSON.parse(savedStr) as SavedGameState
    } catch (error) {
      console.error('Failed to load saved game:', error)
      return null
    }
  }

  async saveGame(state: SavedGameState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save game:', error)
      // Don't throw - we don't want to interrupt gameplay
    }
  }

  async clearSavedGame(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear saved game:', error)
    }
  }
}

/**
 * Tauri storage implementation using filesystem.
 * Falls back to web storage if Tauri APIs are not available.
 */
class TauriGameStateStorage implements GameStateStorageService {
  private webFallback = new WebGameStateStorage()
  private initialized = false
  private saveDir: string | null = null

  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) {
      return this.saveDir !== null
    }

    try {
      // Dynamic import to avoid bundling issues in web builds
      const { appDataDir, join } = await import('@tauri-apps/api/path')
      const { exists, mkdir } = await import('@tauri-apps/plugin-fs')

      const appData = await appDataDir()
      this.saveDir = await join(appData, 'saves')

      if (!(await exists(this.saveDir))) {
        await mkdir(this.saveDir, { recursive: true })
      }

      this.initialized = true
      return true
    } catch (error) {
      console.warn('Tauri fs not available, falling back to localStorage:', error)
      this.initialized = true
      this.saveDir = null
      return false
    }
  }

  async hasSavedGame(): Promise<boolean> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.hasSavedGame()
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { exists } = await import('@tauri-apps/plugin-fs')

      const savePath = await join(this.saveDir!, 'game_save.json')
      return await exists(savePath)
    } catch (error) {
      console.error('Failed to check for saved game:', error)
      return false
    }
  }

  async loadSavedGame(): Promise<SavedGameState | null> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.loadSavedGame()
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { exists, readTextFile } = await import('@tauri-apps/plugin-fs')

      const savePath = await join(this.saveDir!, 'game_save.json')

      if (!(await exists(savePath))) {
        return null
      }

      const saveStr = await readTextFile(savePath)
      return JSON.parse(saveStr) as SavedGameState
    } catch (error) {
      console.error('Failed to load saved game from filesystem:', error)
      return null
    }
  }

  async saveGame(state: SavedGameState): Promise<void> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.saveGame(state)
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')

      const savePath = await join(this.saveDir!, 'game_save.json')
      await writeTextFile(savePath, JSON.stringify(state, null, 2))
    } catch (error) {
      console.error('Failed to save game to filesystem:', error)
      // Don't throw - we don't want to interrupt gameplay
    }
  }

  async clearSavedGame(): Promise<void> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.clearSavedGame()
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { remove, exists } = await import('@tauri-apps/plugin-fs')

      const savePath = await join(this.saveDir!, 'game_save.json')

      if (await exists(savePath)) {
        await remove(savePath)
      }
    } catch (error) {
      console.error('Failed to clear saved game from filesystem:', error)
    }
  }
}

// Singleton instance
let storageInstance: GameStateStorageService | null = null

/**
 * Get the appropriate storage service for the current platform.
 */
export function getGameStateStorage(): GameStateStorageService {
  if (!storageInstance) {
    storageInstance = isTauri() ? new TauriGameStateStorage() : new WebGameStateStorage()
  }
  return storageInstance
}

/**
 * Reset the storage instance (useful for testing).
 */
export function resetGameStateStorage(): void {
  storageInstance = null
}
