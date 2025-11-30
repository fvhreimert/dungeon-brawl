import { useEffect, useState } from 'react'
import './App.css'
import './components/actions/Actions.css'

import questionData from './data/questions.json'
import { GameBoard } from './components/game/GameBoard'
import { QuestionDialog } from './components/game/QuestionDialog'
import { MadSeerModal } from '@/features/actions/madSeer/MadSeerModal'
import { useFrogSounds } from '@/features/actions/frogOfFate/useFrogSounds'
import { Scoreboard } from './components/game/Scoreboard'
import { useJeopardyGame } from './hooks/useJeopardyGame'
import { gameConfig } from './config/gameConfig'
import type { QAItem, Tile } from './types/game'

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
    applyTileMultiplier,
  } = useJeopardyGame({
    categories: gameConfig.gameplay.categories,
    pointValues: gameConfig.gameplay.pointValues,
    players: gameConfig.players,
    questionBank: questionData as QAItem[],
  })

  const [spiderIndex, setSpiderIndex] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [madSeerActive, setMadSeerActive] = useState(false)
  const [madSeerPreviewTile, setMadSeerPreviewTile] = useState<Tile | null>(null)
  const [frogSelecting, setFrogSelecting] = useState(false)
  const [frogHighlightId, setFrogHighlightId] = useState<string | null>(null)
  const [frogLandingId, setFrogLandingId] = useState<string | null>(null)
  const { playStart, playHop, playLand } = useFrogSounds()

  const handleWebClick = () => {
    setSpiderIndex((prev) => (prev < 8 ? prev + 1 : 1))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const handleMadSeerStart = () => {
    if (selectedTile || frogSelecting) return
    setMadSeerActive(true)
    setMadSeerPreviewTile(null)
  }

  const handleTileSelect = (tileId: string) => {
    if (madSeerActive) {
      const tile = tiles.find((t) => t.id === tileId)
      if (!tile || tile.status === 'done') return
      setMadSeerPreviewTile(tile)
      return
    }
    handleTileClick(tileId)
  }

  const handleMadSeerAccept = () => {
    if (!madSeerPreviewTile) return
    handleTileClick(madSeerPreviewTile.id)
    setMadSeerPreviewTile(null)
    setMadSeerActive(false)
  }

  const handleMadSeerReject = () => {
    setMadSeerPreviewTile(null)
    setMadSeerActive(false)
  }

  const getOpenTiles = () => tiles.filter((tile) => tile.status === 'open')

  const runFrogSelection = async () => {
    const openTiles = getOpenTiles()
    if (openTiles.length === 0) return

    setFrogSelecting(true)
    setFrogLandingId(null)
    const sequence: string[] = []
    const shuffled = [...openTiles].sort(() => Math.random() - 0.5)
    shuffled.forEach((tile) => sequence.push(tile.id))
    for (let i = 0; i < 10; i++) {
      sequence.push(openTiles[Math.floor(Math.random() * openTiles.length)].id)
    }

    for (let i = 0; i < sequence.length; i++) {
      setFrogHighlightId(sequence[i])
      playHop()
      const progress = i / sequence.length
      const delay = 120 + progress * 140 // shorter run, slightly slower overall
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const finalTileId = sequence[sequence.length - 1]
    setFrogHighlightId(null)
    setFrogLandingId(finalTileId)
    applyTileMultiplier(finalTileId, 2)
    playLand()
    setTimeout(() => {
      setFrogLandingId(null)
      setFrogSelecting(false)
    }, 900)
  }

  const handleFrogClick = () => {
    if (madSeerActive || frogSelecting || selectedTile) return
    playStart()
    runFrogSelection()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [handleUndo])

  return (
    <div className="app">
      <div className="layout-column left">
        <div className="action-item">
          <img src="/src/assets/images/actions/card_jester.png" alt="Card Jester" className="card-jester-icon" />
          <span className="action-label action-label-orange">Card Jester</span>
        </div>
        <div className={`action-item ${madSeerActive ? 'madseer-armed' : ''}`} onClick={handleMadSeerStart}>
          <img src="/src/assets/images/actions/mad_seer.png" alt="Mad Seer" className="mad-seer-icon" />
          <span className="action-label action-label-purple">Mad Seer</span>
        </div>
        <div className="action-item">
          <img src="/src/assets/images/actions/blood_sacrifice.png" alt="Blood Sacrifice" className="blood-sacrifice-icon" />
          <span className="action-label action-label-red">Blood Sacrifice</span>
        </div>
      </div>

      <div className="dungeon-frame">
        <header className="title-wrap relative">
          <h1 className="title">{gameConfig.meta.title}</h1>
          <button 
            onClick={toggleFullscreen}
            className="fullscreen-toggle"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px',
              opacity: 0.3,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <img 
              src={isFullscreen ? "/src/assets/images/ui/minimize.png" : "/src/assets/images/ui/expand.png"} 
              alt={isFullscreen ? "Minimize" : "Maximize"} 
              style={{ width: '24px', height: '24px' }}
            />
          </button>
        </header>

        <GameBoard
          categories={gameConfig.gameplay.categories}
          tiles={tiles}
          onTileSelect={handleTileSelect}
          highlightOpenTiles={madSeerActive}
          highlightedTileId={madSeerPreviewTile?.id ?? null}
          boardLocked={!!selectedTile || !!madSeerPreviewTile || frogSelecting}
          frogHighlightId={frogHighlightId}
          frogLandingId={frogLandingId}
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
            className={`spider-icon ${spiderIndex === 8 ? 'no-contour' : ''}`}
            style={{
              width: spiderIndex === 8
                ? '230px'
                : `${55 + (spiderIndex - 1) * 11}px`,
              top: spiderIndex === 8
                ? '97px'
                : `${27 + (spiderIndex - 1) * 11}px`,
              right: spiderIndex === 8
                ? '97px'
                : `${27 + (spiderIndex - 1) * 8}px`
            }}
          />
        </div>
        {/* Invisible spacer to match Card Jester's height/position in the left column */}
        <div className="action-item" style={{ visibility: 'hidden' }}>
          <img src="/src/assets/images/actions/card_jester.png" alt="Card Jester" className="card-jester-icon" />
          <span className="action-label action-label-orange">Card Jester</span>
        </div>
        
        <div className={`action-item ${frogSelecting ? 'frog-animating' : ''}`} onClick={handleFrogClick}>
          <img src="/src/assets/images/actions/frog_of_fate.png" alt="Frog of Fate" className="frog-of-fate-icon" />
          <span className="action-label action-label-green">Frog of Fate</span>
        </div>
        <div className="action-item">
          <img src="/src/assets/images/actions/dice_of_fortune.png" alt="Dice of Fortune" className="dice-of-fortune-icon" />
          <span className="action-label action-label-gold">Dice of Fortune</span>
        </div>
      </div>

      {madSeerPreviewTile && madSeerActive && (
        <MadSeerModal
          tile={madSeerPreviewTile}
          onAccept={handleMadSeerAccept}
          onReject={handleMadSeerReject}
        />
      )}

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
