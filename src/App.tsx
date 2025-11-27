import { useEffect, useState } from 'react'
import './App.css'
import './components/actions/Actions.css'

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

  const [spiderIndex, setSpiderIndex] = useState(1)

  const handleWebClick = () => {
    setSpiderIndex((prev) => (prev < 7 ? prev + 1 : 1))
  }

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
      <div className="layout-column left">
        <img src="/src/assets/images/actions/mad_seer.png" alt="Mad Seer" className="mad-seer-icon" />
      </div>

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

      <div className="layout-column right">
        <div className="web-wrapper" onClick={handleWebClick}>
          <img 
            src="/src/assets/images/actions/web.png" 
            alt="Web" 
            className="web-icon" 
          />
          <img 
            src={`/src/assets/images/actions/spiders/spider_${spiderIndex}.png`}
            alt="Spider"
            className="spider-icon"
            style={{ 
              width: `${40 + spiderIndex * 15}px`,
              top: `${10 + spiderIndex * 15}px`,
              right: `${10 + spiderIndex * 15}px`
            }}
          />
        </div>
        <img src="/src/assets/images/actions/frog_of_fate.png" alt="Frog of Fate" className="frog-of-fate-icon" />
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
