import { useState } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { getAvailableQuizzes, loadQuiz, quizToQAItems, getQuizCategories, inferPointValues } from '@/utils/quizLoader'
import { ALL_PORTRAITS } from '@/utils/portraits'
import type { Quiz, QuizFile } from '@/types/quiz'
import type { PlayerConfig, QAItem } from '@/types/game'
import './MainMenuScreen.css'

type MenuState = 'main' | 'quiz-select' | 'player-setup'

export type GameSettings = {
  quiz: Quiz
  categories: string[]
  pointValues: number[]
  questionBank: QAItem[]
  players: PlayerConfig[]
}

type MainMenuScreenProps = {
  onStartGame: (settings: GameSettings) => void
}

type PlayerSetupData = {
  name: string
  portrait: string
}

const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4']

export function MainMenuScreen({ onStartGame }: MainMenuScreenProps) {
  const [menuState, setMenuState] = useState<MenuState>('main')
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [playerCount, setPlayerCount] = useState(4)
  const [playerSetups, setPlayerSetups] = useState<PlayerSetupData[]>(() =>
    DEFAULT_PLAYER_NAMES.map((name, i) => ({
      name,
      portrait: ALL_PORTRAITS[i] ?? ALL_PORTRAITS[0],
    }))
  )
  const [portraitPickerIndex, setPortraitPickerIndex] = useState<number | null>(null)

  const quizFiles = getAvailableQuizzes()

  const handleQuizFromFile = () => {
    setMenuState('quiz-select')
  }

  const handleQuizSelect = (quizFile: QuizFile) => {
    const quiz = loadQuiz(quizFile.fileName)
    if (quiz) {
      setSelectedQuiz(quiz)
      setMenuState('player-setup')
    }
  }

  const handleBackToMain = () => {
    setMenuState('main')
    setSelectedQuiz(null)
  }

  const handleBackToQuizSelect = () => {
    setMenuState('quiz-select')
  }

  const handlePlayerCountChange = (delta: number) => {
    const newCount = Math.max(2, Math.min(8, playerCount + delta))
    setPlayerCount(newCount)
    // Ensure playerSetups array has enough entries
    setPlayerSetups((prev) => {
      const updated = [...prev]
      while (updated.length < newCount) {
        const idx = updated.length
        updated.push({
          name: `Player ${idx + 1}`,
          portrait: ALL_PORTRAITS[idx % ALL_PORTRAITS.length],
        })
      }
      return updated
    })
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayerSetups((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], name }
      return updated
    })
  }

  const handlePortraitSelect = (portrait: string) => {
    if (portraitPickerIndex === null) return
    setPlayerSetups((prev) => {
      const updated = [...prev]
      updated[portraitPickerIndex] = { ...updated[portraitPickerIndex], portrait }
      return updated
    })
    setPortraitPickerIndex(null)
  }

  const handleStartGame = () => {
    if (!selectedQuiz) return
    const pointValues = inferPointValues(selectedQuiz)
    const questionBank = quizToQAItems(selectedQuiz, pointValues)
    const categories = getQuizCategories(selectedQuiz)
    
    const players: PlayerConfig[] = playerSetups.slice(0, playerCount).map((p) => ({
      name: p.name || 'Unnamed',
      score: 0,
      inventory: [],
      portrait: p.portrait,
    }))

    onStartGame({
      quiz: selectedQuiz,
      categories,
      pointValues,
      questionBank,
      players,
    })
  }

  // Check if any selected portraits are used by other players
  const getUsedPortraits = () => {
    const used = new Set<string>()
    playerSetups.slice(0, playerCount).forEach((p, i) => {
      if (i !== portraitPickerIndex) {
        used.add(p.portrait)
      }
    })
    return used
  }

  return (
    <div className="main-menu-screen">
      <div className="main-menu-container">
        {menuState === 'main' && (
          <>
            <h1 className="main-menu-title-standalone">DUNGEON BRAWL</h1>
            <div className="main-menu-content">
              <div className="main-menu-buttons">
                <RetroButton
                  font="retro"
                  className="menu-button"
                  onClick={handleQuizFromFile}
                >
                  Quiz from File
                </RetroButton>
                <RetroButton
                  font="retro"
                  className="menu-button"
                  variant="secondary"
                  disabled
                >
                  Generate Quiz
                </RetroButton>
              </div>
            </div>
          </>
        )}

        {menuState === 'quiz-select' && (
          <>
            <h1 className="main-menu-title-standalone">Select Quiz</h1>
            <div className="quiz-select-content">
              <div className="quiz-list">
                {quizFiles.map((quiz) => (
                  <RetroButton
                    key={quiz.fileName}
                    font="retro"
                    variant="secondary"
                    className="quiz-item"
                    onClick={() => handleQuizSelect(quiz)}
                  >
                    {quiz.displayName}
                  </RetroButton>
                ))}
              </div>
              <RetroButton
                font="retro"
                variant="destructive"
                className="back-button"
                onClick={handleBackToMain}
              >
                Back
              </RetroButton>
            </div>
          </>
        )}

        {menuState === 'player-setup' && (
          <>
            <h1 className="main-menu-title-standalone">Player Setup</h1>
            {selectedQuiz && (
              <div className="selected-quiz-name">{selectedQuiz.displayName}</div>
            )}
            <div className="player-setup-content">
              <div className="player-count-row">
                <span className="player-count-label">Players:</span>
                <div className="player-count-controls">
                  <RetroButton
                    font="retro"
                    variant="secondary"
                    className="count-btn"
                    onClick={() => handlePlayerCountChange(-1)}
                    disabled={playerCount <= 2}
                  >
                    -
                  </RetroButton>
                  <span className="player-count-value">{playerCount}</span>
                  <RetroButton
                    font="retro"
                    variant="secondary"
                    className="count-btn"
                    onClick={() => handlePlayerCountChange(1)}
                    disabled={playerCount >= 8}
                  >
                    +
                  </RetroButton>
                </div>
              </div>

              <div className="player-list">
                {playerSetups.slice(0, playerCount).map((player, index) => (
                  <div key={index} className="player-row">
                    <div
                      className="player-portrait-btn"
                      onClick={() => setPortraitPickerIndex(index)}
                    >
                      <img
                        src={player.portrait}
                        alt={`Player ${index + 1} portrait`}
                        className="player-portrait"
                      />
                    </div>
                    <input
                      type="text"
                      className="player-name-input"
                      value={player.name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="player-setup-actions">
                <RetroButton
                  font="retro"
                  className="start-game-btn"
                  onClick={handleStartGame}
                >
                  Start Game
                </RetroButton>
                <RetroButton
                  font="retro"
                  variant="destructive"
                  className="back-button"
                  onClick={handleBackToQuizSelect}
                >
                  Back
                </RetroButton>
              </div>
            </div>
          </>
        )}

        {/* Portrait Picker Modal */}
        {portraitPickerIndex !== null && (
          <div className="portrait-picker-backdrop" onClick={() => setPortraitPickerIndex(null)}>
            <div className="portrait-picker-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="portrait-picker-title">Select Portrait</div>
              <div className="portrait-grid">
                {ALL_PORTRAITS.map((portrait, idx) => {
                  const isUsed = getUsedPortraits().has(portrait)
                  const isSelected = playerSetups[portraitPickerIndex]?.portrait === portrait
                  return (
                    <div
                      key={idx}
                      className={`portrait-option ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`}
                      onClick={() => !isUsed && handlePortraitSelect(portrait)}
                    >
                      <img src={portrait} alt={`Portrait ${idx + 1}`} />
                    </div>
                  )
                })}
              </div>
              <RetroButton
                font="retro"
                variant="secondary"
                className="portrait-picker-close"
                onClick={() => setPortraitPickerIndex(null)}
              >
                Cancel
              </RetroButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
