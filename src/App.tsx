import './App.css'

import questionData from './data/questions.json'
import { GameBoard } from './components/game/GameBoard'
import { QuestionDialog } from './components/game/QuestionDialog'
import { Scoreboard } from './components/game/Scoreboard'
import { useJeopardyGame } from './hooks/useJeopardyGame'
import type { Player, QAItem } from './types/game'

const categories = ['Arcana', 'Relics', 'Beasts', 'Lore', 'Traps']
const pointValues = [100, 200, 300, 400, 500]
const initialPlayers: Player[] = [
  { name: 'Rogue', score: 1200 },
  { name: 'Mage', score: 900 },
  { name: 'Paladin', score: 700 },
  { name: 'Necro', score: 300 },
]

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
  } = useJeopardyGame({
    categories,
    pointValues,
    players: initialPlayers,
    questionBank: questionData as QAItem[],
  })

  return (
    <div className="app">
      <div className="dungeon-frame">
        <header className="title-wrap">
          <h1 className="title">Dungeon Brawl</h1>
        </header>

        <GameBoard
          categories={categories}
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
