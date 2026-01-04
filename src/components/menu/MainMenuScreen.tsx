import { useState, useRef } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { Spinner } from '@/components/ui/8bit/spinner'
import { getAvailableQuizzes, loadQuiz, quizToQAItems, getQuizCategories } from '@/utils/quizLoader'
import { ALL_PORTRAITS } from '@/utils/portraits'
import { generateQuizCategories, type CategoryInput } from '@/services/geminiService'
import { GameSettingsScreen, type GameplaySettings } from './GameSettingsScreen'
import { QuizBuilderScreen } from './QuizBuilderScreen'
import { ApiKeyModal } from './ApiKeyModal'
import { useQuizStorage } from '@/hooks/useQuizStorage'
import { useGameSave } from '@/hooks/useGameSave'
import type { Quiz, QuizFile } from '@/types/quiz'
import { createCustomQuiz, type CustomQuiz, type CustomQuizMeta } from '@/types/customQuiz'
import type { PlayerConfig, QAItem, SavedGameState } from '@/types/game'
import './MainMenuScreen.css'

type MenuState = 'main' | 'quiz-select' | 'api-key' | 'generate-quiz' | 'generating' | 'create-quiz' | 'player-setup' | 'game-settings'

export type GameSettings = {
  quiz: Quiz
  categories: string[]
  pointValues: number[]
  questionBank: QAItem[]
  players: PlayerConfig[]
  gameplaySettings: GameplaySettings
}

type MainMenuScreenProps = {
  onStartGame: (settings: GameSettings) => void
  onResumeGame: (savedState: SavedGameState) => void
}

type PlayerSetupData = {
  name: string
  portrait: string
}

const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4']

export function MainMenuScreen({ onStartGame, onResumeGame }: MainMenuScreenProps) {
  const [menuState, setMenuState] = useState<MenuState>('main')
  const { hasSavedGame, loadSavedGame } = useGameSave()
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [playerCount, setPlayerCount] = useState(4)
  const [playerSetups, setPlayerSetups] = useState<PlayerSetupData[]>(() =>
    DEFAULT_PLAYER_NAMES.map((name, i) => ({
      name,
      portrait: ALL_PORTRAITS[i] ?? ALL_PORTRAITS[0],
    }))
  )
  const [portraitPickerIndex, setPortraitPickerIndex] = useState<number | null>(null)
  const [isGeneratedQuiz, setIsGeneratedQuiz] = useState(false)
  const [isCustomQuiz, setIsCustomQuiz] = useState(false)
  const [editingCustomQuiz, setEditingCustomQuiz] = useState<CustomQuiz | undefined>(undefined)

  // Generate quiz state
  const [verifiedApiKey, setVerifiedApiKey] = useState<string | null>(null)
  const [categoryCount, setCategoryCount] = useState(5)
  const [categoryInputs, setCategoryInputs] = useState<CategoryInput[]>(() =>
    Array.from({ length: 5 }, () => ({ name: '', description: '' }))
  )
  const [quizName, setQuizName] = useState('')
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 })
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Custom quiz storage
  const {
    quizzes: customQuizzes,
    loadQuiz: loadCustomQuiz,
    saveQuiz: saveCustomQuiz,
    exportQuiz,
    importQuiz,
  } = useQuizStorage()

  const quizFiles = getAvailableQuizzes()

  // File input ref for importing quizzes
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const quiz = await importQuiz(file)
    if (quiz) {
      // Successfully imported - list will auto-refresh
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleExportQuiz = async (quizMeta: CustomQuizMeta) => {
    const quiz = await loadCustomQuiz(quizMeta.id)
    if (quiz) {
      exportQuiz(quiz)
    }
  }

  const handleResumeGame = async () => {
    const savedState = await loadSavedGame()
    if (savedState) {
      onResumeGame(savedState)
    }
  }

  const handleQuizFromFile = () => {
    setMenuState('quiz-select')
  }

  const handleQuizSelect = (quizFile: QuizFile) => {
    const quiz = loadQuiz(quizFile.fileName)
    if (quiz) {
      setSelectedQuiz(quiz)
      setIsGeneratedQuiz(false)
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

  const handleGenerateQuiz = () => {
    setMenuState('api-key')
    setGenerationError(null)
  }

  const handleApiKeyVerified = (apiKey: string) => {
    setVerifiedApiKey(apiKey)
    setMenuState('generate-quiz')
  }

  const handleApiKeyCancel = () => {
    setMenuState('main')
  }

  const handleCategoryCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, categoryCount + delta))
    setCategoryCount(newCount)
    setCategoryInputs((prev) => {
      const updated = [...prev]
      while (updated.length < newCount) {
        updated.push({ name: '', description: '' })
      }
      return updated
    })
  }

  const handleCategoryInputChange = (index: number, field: 'name' | 'description', value: string) => {
    setCategoryInputs((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleStartGeneration = async () => {
    const validCategories = categoryInputs.slice(0, categoryCount).filter(c => c.name.trim())
    if (validCategories.length === 0) {
      setGenerationError('Please enter at least one category name')
      return
    }

    if (!verifiedApiKey) {
      setGenerationError('API key not verified')
      setMenuState('api-key')
      return
    }

    setMenuState('generating')
    setGenerationProgress({ completed: 0, total: validCategories.length })
    setGenerationError(null)

    try {
      const generatedCategories = await generateQuizCategories(
        verifiedApiKey,
        validCategories,
        (completed, total) => setGenerationProgress({ completed, total })
      )

      // Create and save as custom quiz
      const customQuiz = createCustomQuiz(
        quizName || 'Generated Quiz',
        generatedCategories
      )
      await saveCustomQuiz(customQuiz)

      setSelectedQuiz(customQuiz)
      setIsGeneratedQuiz(true)
      setIsCustomQuiz(true)
      setMenuState('player-setup')
    } catch (error) {
      console.error('Quiz generation failed:', error)
      setGenerationError(error instanceof Error ? error.message : 'Generation failed')
      setMenuState('generate-quiz')
    }
  }

  const handleBackFromGenerate = () => {
    setMenuState('main')
    setGenerationError(null)
  }

  const handleCreateQuiz = () => {
    setEditingCustomQuiz(undefined)
    setMenuState('create-quiz')
  }

  const handleCustomQuizSaveAndPlay = (quiz: CustomQuiz) => {
    setSelectedQuiz(quiz)
    setIsCustomQuiz(true)
    setIsGeneratedQuiz(false)
    setMenuState('player-setup')
  }

  const handleBackFromCreateQuiz = () => {
    setEditingCustomQuiz(undefined)
    setMenuState('main')
  }

  const handleCustomQuizSelect = async (quizMeta: CustomQuizMeta) => {
    const quiz = await loadCustomQuiz(quizMeta.id)
    if (quiz) {
      setSelectedQuiz(quiz)
      setIsCustomQuiz(true)
      setIsGeneratedQuiz(false)
      setMenuState('player-setup')
    }
  }

  const handleEditCustomQuiz = async (quizMeta: CustomQuizMeta) => {
    const quiz = await loadCustomQuiz(quizMeta.id)
    if (quiz) {
      setEditingCustomQuiz(quiz)
      setMenuState('create-quiz')
    }
  }

  const handleEditBuiltInQuiz = (quizFile: QuizFile) => {
    const quiz = loadQuiz(quizFile.fileName)
    if (quiz) {
      // Convert built-in quiz to a custom quiz for editing
      const customQuiz = createCustomQuiz(quiz.displayName, quiz.categories)
      setEditingCustomQuiz(customQuiz)
      setMenuState('create-quiz')
    }
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

  const handleProceedToSettings = () => {
    if (!selectedQuiz) return
    setMenuState('game-settings')
  }

  const handleBackFromSettings = () => {
    setMenuState('player-setup')
  }

  const handleStartGame = (gameplaySettings: GameplaySettings) => {
    if (!selectedQuiz) return
    // Use custom point values from settings
    const pointValues = [
      gameplaySettings.pointTier1,
      gameplaySettings.pointTier2,
      gameplaySettings.pointTier3,
      gameplaySettings.pointTier4,
      gameplaySettings.pointTier5,
    ]
    const questionBank = quizToQAItems(selectedQuiz, pointValues)
    const categories = getQuizCategories(selectedQuiz)
    
    const players: PlayerConfig[] = playerSetups.slice(0, playerCount).map((p) => ({
      name: p.name || 'Unnamed',
      score: gameplaySettings.startingPoints,
      inventory: [],
      portrait: p.portrait,
    }))

    onStartGame({
      quiz: selectedQuiz,
      categories,
      pointValues,
      questionBank,
      players,
      gameplaySettings,
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
                  variant="secondary"
                  onClick={handleQuizFromFile}
                >
                  Quiz from File
                </RetroButton>
                <RetroButton
                  font="retro"
                  className="menu-button"
                  variant="secondary"
                  onClick={handleCreateQuiz}
                >
                  Create Quiz
                </RetroButton>
                <RetroButton
                  font="retro"
                  className="menu-button"
                  variant="secondary"
                  onClick={handleGenerateQuiz}
                >
                  Generate Quiz
                </RetroButton>
                <RetroButton
                  font="retro"
                  className="menu-button"
                  variant="secondary"
                  onClick={handleResumeGame}
                  disabled={!hasSavedGame}
                >
                  Resume Game
                </RetroButton>
              </div>
            </div>
          </>
        )}

        {menuState === 'api-key' && (
          <ApiKeyModal
            onVerified={handleApiKeyVerified}
            onCancel={handleApiKeyCancel}
          />
        )}

        {menuState === 'quiz-select' && (
          <>
            <h1 className="main-menu-title-standalone">Select Quiz</h1>
            <div className="quiz-select-content">
              {/* Hidden file input for importing */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                style={{ display: 'none' }}
              />

              <div className="quiz-list">
                {/* Built-in quizzes */}
                {quizFiles.map((quiz) => (
                  <div key={quiz.fileName} className="quiz-item-row">
                    <RetroButton
                      font="retro"
                      variant="secondary"
                      className="quiz-item quiz-item-custom"
                      onClick={() => handleQuizSelect(quiz)}
                    >
                      {quiz.displayName}
                    </RetroButton>
                    <RetroButton
                      font="retro"
                      variant="secondary"
                      className="quiz-item-edit"
                      onClick={() => handleEditBuiltInQuiz(quiz)}
                    >
                      Edit
                    </RetroButton>
                  </div>
                ))}
                {/* Custom quizzes */}
                {customQuizzes.length > 0 && (
                  <div className="quiz-list-divider">Custom Quizzes</div>
                )}
                {customQuizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-item-row">
                    <RetroButton
                      font="retro"
                      variant="secondary"
                      className="quiz-item quiz-item-custom"
                      onClick={() => handleCustomQuizSelect(quiz)}
                    >
                      {quiz.displayName}
                    </RetroButton>
                    <RetroButton
                      font="retro"
                      variant="secondary"
                      className="quiz-item-edit"
                      onClick={() => handleExportQuiz(quiz)}
                    >
                      Save
                    </RetroButton>
                    <RetroButton
                      font="retro"
                      variant="secondary"
                      className="quiz-item-edit"
                      onClick={() => handleEditCustomQuiz(quiz)}
                    >
                      Edit
                    </RetroButton>
                  </div>
                ))}
              </div>
              <div className="quiz-select-actions">
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="import-quiz-btn"
                  onClick={handleImportClick}
                >
                  Load from File
                </RetroButton>
                <RetroButton
                  font="retro"
                  variant="destructive"
                  className="back-button"
                  onClick={handleBackToMain}
                >
                  Back
                </RetroButton>
              </div>
            </div>
          </>
        )}

        {menuState === 'generate-quiz' && (
          <>
            <h1 className="main-menu-title-standalone">Generate Quiz</h1>
            <div 
              className="generate-quiz-content"
              style={{ '--category-count': categoryCount } as React.CSSProperties}
            >
              <div className="quiz-name-row">
                <input
                  type="text"
                  className="quiz-name-input"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="ENTER QUIZ NAME"
                />
              </div>

              <div className="category-count-row">
                <span className="category-count-label">COLUMNS:</span>
                <div className="category-count-controls">
                  <RetroButton
                    font="retro"
                    variant="secondary"
                    className="count-btn"
                    onClick={() => handleCategoryCountChange(-1)}
                    disabled={categoryCount <= 1}
                  >
                    -
                  </RetroButton>
                  <span className="category-count-value">{categoryCount}</span>
                  <RetroButton
                    font="retro"
                    variant="secondary"
                    className="count-btn"
                    onClick={() => handleCategoryCountChange(1)}
                    disabled={categoryCount >= 10}
                  >
                    +
                  </RetroButton>
                </div>
              </div>

              <div className="generate-quiz-board">
                {/* Row 1: Category Names */}
                <div className="category-input-row">
                  {categoryInputs.slice(0, categoryCount).map((cat, index) => (
                    <textarea
                      key={`cat-name-${index}`}
                      className="category-input-tile"
                      value={cat.name}
                      onChange={(e) => handleCategoryInputChange(index, 'name', e.target.value)}
                      placeholder={`CAT ${index + 1}`}
                      rows={2}
                    />
                  ))}
                </div>

                {/* Row 2: Descriptions */}
                <div className="description-input-row">
                  {categoryInputs.slice(0, categoryCount).map((cat, index) => (
                    <textarea
                      key={`cat-desc-${index}`}
                      className="description-input-tile"
                      value={cat.description}
                      onChange={(e) => handleCategoryInputChange(index, 'description', e.target.value)}
                      placeholder="Topic description..."
                    />
                  ))}
                </div>
              </div>

              {generationError && (
                <div className="generation-error">{generationError}</div>
              )}

              <div className="generate-quiz-actions">
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="back-button"
                  onClick={handleBackFromGenerate}
                >
                  BACK
                </RetroButton>
                <RetroButton
                  font="retro"
                  className="generate-btn"
                  onClick={handleStartGeneration}
                  disabled={categoryInputs.slice(0, categoryCount).every(c => !c.name.trim())}
                >
                  GENERATE
                </RetroButton>
              </div>
            </div>
          </>
        )}

        {menuState === 'generating' && (
          <div className="generating-content">
            <h1 className="main-menu-title-standalone">Generating...</h1>
            <div className="generation-status">
              <Spinner variant="diamond" className="generation-spinner" />
              <div className="generation-progress">
                Category {generationProgress.completed} of {generationProgress.total}
              </div>
            </div>
          </div>
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
                  variant="secondary"
                  className="back-button"
                  onClick={isGeneratedQuiz || isCustomQuiz ? handleBackToMain : handleBackToQuizSelect}
                >
                  Back
                </RetroButton>
                <RetroButton
                  font="retro"
                  className="start-game-btn menu-button-primary"
                  onClick={handleProceedToSettings}
                >
                  Next
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

      {/* Game Settings Screen - rendered as full screen overlay */}
      {menuState === 'game-settings' && (
        <GameSettingsScreen
          onBack={handleBackFromSettings}
          onStartGame={handleStartGame}
        />
      )}

      {/* Quiz Builder Screen - rendered as full screen overlay */}
      {menuState === 'create-quiz' && (
        <QuizBuilderScreen
          existingQuiz={editingCustomQuiz}
          onSaveAndPlay={handleCustomQuizSaveAndPlay}
          onBack={handleBackFromCreateQuiz}
        />
      )}
    </div>
  )
}
