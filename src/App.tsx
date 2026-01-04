import { useCallback, useState } from 'react'
import './App.css'

import { MainMenuScreen, type GameSettings } from '@/components/menu/MainMenuScreen'
import { Game } from '@/components/game/Game'
import { useGlobalClickSound } from '@/hooks/useGlobalClickSound'
import { RuntimeConfigProvider, gameplaySettingsToRuntimeConfig, type RuntimeGameConfig } from '@/config/runtimeConfig'
import { useGameSave } from '@/hooks/useGameSave'
import type { SavedGameState, ResumedGameState } from '@/types/game'
import type { GameplaySettings } from '@/components/menu/GameSettingsScreen'
import { useAssetPreloader } from '@/hooks/useAssetPreloader'

type AppState = 'menu' | 'game'

function App() {
  useGlobalClickSound()
  useAssetPreloader() // Preload assets in background
  const { saveGame, clearSave } = useGameSave()

  const [appState, setAppState] = useState<AppState>('menu')
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)
  const [resumedGameState, setResumedGameState] = useState<ResumedGameState | null>(null)
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeGameConfig | null>(null)

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings)
    setResumedGameState(null)
    setRuntimeConfig(gameplaySettingsToRuntimeConfig(settings.gameplaySettings))
    setAppState('game')
  }

  const handleResumeGame = (savedState: SavedGameState) => {
    // Reconstruct game settings from saved state
    const quiz = {
      displayName: savedState.gameSettings.quizDisplayName,
      categories: savedState.gameSettings.quizCategories,
    }
    const settings: GameSettings = {
      quiz,
      categories: savedState.gameSettings.categories,
      pointValues: savedState.gameSettings.pointValues,
      questionBank: savedState.gameSettings.questionBank,
      players: savedState.gameSettings.players,
      gameplaySettings: savedState.gameSettings.gameplaySettings as GameplaySettings,
    }

    setGameSettings(settings)
    setResumedGameState(savedState.gameState)
    setRuntimeConfig(gameplaySettingsToRuntimeConfig(settings.gameplaySettings))
    setAppState('game')
  }

  const handleTurnEnd = useCallback((state: ResumedGameState) => {
    if (!gameSettings) return

    // Create a SavedGameState from current state
    const savedState: SavedGameState = {
      gameSettings: {
        quizDisplayName: gameSettings.quiz.displayName,
        quizCategories: gameSettings.quiz.categories,
        categories: gameSettings.categories,
        pointValues: gameSettings.pointValues,
        questionBank: gameSettings.questionBank,
        players: gameSettings.players,
        gameplaySettings: gameSettings.gameplaySettings as Record<string, unknown>,
      },
      gameState: state,
      savedAt: Date.now(),
    }

    saveGame(savedState)
  }, [gameSettings, saveGame])

  const handleGameEnd = useCallback(() => {
    clearSave()
  }, [clearSave])

  if (appState === 'menu' || !gameSettings || !runtimeConfig) {
    return (
      <MainMenuScreen
        onStartGame={handleStartGame}
        onResumeGame={handleResumeGame}
      />
    )
  }

  return (
    <RuntimeConfigProvider config={runtimeConfig}>
      <Game
        categories={gameSettings.categories}
        pointValues={gameSettings.pointValues}
        players={gameSettings.players}
        questionBank={gameSettings.questionBank}
        resumedState={resumedGameState ?? undefined}
        onTurnEnd={handleTurnEnd}
        onGameEnd={handleGameEnd}
      />
    </RuntimeConfigProvider>
  )
}

export default App
