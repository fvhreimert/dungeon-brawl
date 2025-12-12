import { useState } from 'react'
import './App.css'

import { MainMenuScreen, type GameSettings } from '@/components/menu/MainMenuScreen'
import { Game } from '@/components/game/Game'
import { useGlobalClickSound } from '@/hooks/useGlobalClickSound'

type AppState = 'menu' | 'game'

function App() {
  useGlobalClickSound()
  
  const [appState, setAppState] = useState<AppState>('menu')
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings)
    setAppState('game')
  }

  if (appState === 'menu' || !gameSettings) {
    return <MainMenuScreen onStartGame={handleStartGame} />
  }

  return (
    <Game
      categories={gameSettings.categories}
      pointValues={gameSettings.pointValues}
      players={gameSettings.players}
      questionBank={gameSettings.questionBank}
    />
  )
}

export default App
