import { useCallback, useEffect, useState } from 'react'
import { getGameStateStorage } from '@/services/gameStateStorageService'
import type { SavedGameState } from '@/types/game'

/**
 * Hook to manage game save/load operations.
 */
export function useGameSave() {
  const [hasSavedGame, setHasSavedGame] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for saved game on mount
  useEffect(() => {
    const checkSave = async () => {
      const storage = getGameStateStorage()
      const exists = await storage.hasSavedGame()
      setHasSavedGame(exists)
      setIsLoading(false)
    }
    checkSave()
  }, [])

  const saveGame = useCallback(async (state: SavedGameState) => {
    const storage = getGameStateStorage()
    await storage.saveGame(state)
    setHasSavedGame(true)
  }, [])

  const loadSavedGame = useCallback(async (): Promise<SavedGameState | null> => {
    const storage = getGameStateStorage()
    return await storage.loadSavedGame()
  }, [])

  const clearSave = useCallback(async () => {
    const storage = getGameStateStorage()
    await storage.clearSavedGame()
    setHasSavedGame(false)
  }, [])

  return {
    hasSavedGame,
    isLoading,
    saveGame,
    loadSavedGame,
    clearSave,
  }
}
