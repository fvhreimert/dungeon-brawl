import { useEffect } from 'react'
import './App.css'

import questionData from './data/questions.json'
import { GameBoard } from './components/game/GameBoard'
import { QuestionDialog } from './components/game/QuestionDialog'
import { Scoreboard } from './components/game/Scoreboard'
import { useJeopardyGame } from './hooks/useJeopardyGame'
import { gameConfig } from './config/gameConfig'
import type { QAItem } from './types/game'

function App() {
  const {
    tiles,
    players,
    activePlayerIndex,
    selectedTile,
    answerRevealed,
    handleTileClick,
    handleRevealAnswer,
    handleAnswer,
    handleCloseDialog,
    handleUndo,
  } = useJeopardyGame({
    categories: gameConfig.gameplay.categories,
    pointValues: gameConfig.gameplay.pointValues,
    players: gameConfig.players,
    questionBank: questionData as QAItem[],
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo])

  return (
    <div className="app">
      <div className="dungeon-frame">
        <header className="title-wrap relative">
          <h1 className="title">{gameConfig.meta.title}</h1>
        </header>

        <GameBoard
          categories={gameConfig.gameplay.categories}
          tiles={tiles}
          onTileSelect={handleTileClick}
        />

        <Scoreboard players={players} activePlayerIndex={activePlayerIndex} />
      </div>

      {selectedTile && (
        <QuestionDialog
          tile={selectedTile}
          answerRevealed={answerRevealed}
          onReveal={handleRevealAnswer}
          onAnswer={handleAnswer}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  )
}

export default App
