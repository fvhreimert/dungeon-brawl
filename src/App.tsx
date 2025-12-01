import { useEffect, useState } from 'react'
import './App.css'
import './components/actions/Actions.css'

import questionData from './data/questions.json'
import { GameBoard } from './components/game/GameBoard'
import { QuestionDialog } from './components/game/QuestionDialog'
import { MadSeerModal } from '@/features/actions/madSeer/MadSeerModal'
import { useFrogSounds } from '@/features/actions/frogOfFate/useFrogSounds'
import { useDiceOfFortune } from '@/features/actions/diceOfFortune/useDiceOfFortune'
import { useMadSeerSounds } from '@/features/actions/madSeer/useMadSeerSounds'
import { useGlobalClickSound } from '@/hooks/useGlobalClickSound'
import { Scoreboard } from './components/game/Scoreboard'
import { useJeopardyGame } from './hooks/useJeopardyGame'
import { gameConfig } from './config/gameConfig'
import type { QAItem, Tile } from './types/game'

import cardJesterIcon from '@/assets/images/actions/card_jester.png'
import madSeerIcon from '@/assets/images/actions/mad_seer.png'
import bloodSacrificeIcon from '@/assets/images/actions/blood_sacrifice.png'
import minimizeIcon from '@/assets/images/ui/minimize.png'
import expandIcon from '@/assets/images/ui/expand.png'
import webIcon from '@/assets/images/actions/web.png'
import frogIcon from '@/assets/images/actions/frog_of_fate.png'
import diceIcon from '@/assets/images/actions/dice_of_fortune.png'

import spider1 from '@/assets/images/actions/spiders/spider_1.png'
import spider2 from '@/assets/images/actions/spiders/spider_2.png'
import spider3 from '@/assets/images/actions/spiders/spider_3.png'
import spider4 from '@/assets/images/actions/spiders/spider_4.png'
import spider5 from '@/assets/images/actions/spiders/spider_5.png'
import spider6 from '@/assets/images/actions/spiders/spider_6.png'
import spider7 from '@/assets/images/actions/spiders/spider_7.png'
import spider8 from '@/assets/images/actions/spiders/spider_8.png'

const SPIDERS = [null, spider1, spider2, spider3, spider4, spider5, spider6, spider7, spider8]

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
    updateTileModifiers,
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

  useGlobalClickSound()
  const { playStart: playFrogStart, playHop, playLand } = useFrogSounds()
  const { playStart: playMadSeerStart } = useMadSeerSounds()
  const { triggerDice, isRolling: diceRolling, selectedSurvivorId, clearDiceEffect } = useDiceOfFortune()

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
    if (selectedTile || frogSelecting || diceRolling) return
    playMadSeerStart()
    setMadSeerActive(true)
    setMadSeerPreviewTile(null)
  }

  const handleTileSelect = (tileId: string) => {
    // Handle Mad Seer logic first
    if (madSeerActive) {
      const tile = tiles.find((t) => t.id === tileId)
      if (!tile || tile.status === 'done') return
      // Allow selecting even if crumbled (user might want to check it?)
      // Or generally allow selecting ANY tile that isn't 'done' for Mad Seer.
      setMadSeerPreviewTile(tile)
      return
    }

    // If Dice of Fortune just ran, logic is handled in GameBoard regarding 'disabled'.
    // Here we just need to know if we should clear the dice effect.
    if (selectedSurvivorId) {
      if (tileId === selectedSurvivorId) {
        handleTileClick(tileId)
        // Clear persistent crumbled state
        clearDiceEffect(tiles, updateTileModifiers)
      }
      // Ignore clicks on other tiles (though they should be disabled in UI)
      return
    }

    handleTileClick(tileId)
  }

  const handleMadSeerAccept = () => {
    if (!madSeerPreviewTile) return
    handleTileClick(madSeerPreviewTile.id)
    // If we accepted a tile while Dice effect was active (e.g. the survivor), we should clear the effect?
    // If the user selects the survivor via Mad Seer, it's the same as clicking it.
    if (selectedSurvivorId && madSeerPreviewTile.id === selectedSurvivorId) {
        clearDiceEffect(tiles, updateTileModifiers)
    }
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
    if (madSeerActive || frogSelecting || selectedTile || diceRolling) return
    playFrogStart()
    runFrogSelection()
  }

  const handleDiceClick = () => {
    if (madSeerActive || frogSelecting || selectedTile || diceRolling || selectedSurvivorId) return
    triggerDice(tiles, updateTileModifiers)
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
          <img src={cardJesterIcon} alt="Card Jester" className="card-jester-icon" />
          <span className="action-label action-label-orange">Card Jester</span>
        </div>
        <div className={`action-item ${madSeerActive ? 'madseer-armed' : ''}`} onClick={handleMadSeerStart}>
          <img src={madSeerIcon} alt="Mad Seer" className="mad-seer-icon" />
          <span className="action-label action-label-purple">Mad Seer</span>
        </div>
        <div className="action-item">
          <img src={bloodSacrificeIcon} alt="Blood Sacrifice" className="blood-sacrifice-icon" />
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
              src={isFullscreen ? minimizeIcon : expandIcon} 
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
          // Only lock strictly during animations or modal open
          boardLocked={!!selectedTile || !!madSeerPreviewTile || frogSelecting || diceRolling}
          frogHighlightId={frogHighlightId}
          frogLandingId={frogLandingId}
          diceSurvivorId={selectedSurvivorId} // Pass survivor ID to GameBoard
        />

        <Scoreboard players={players} activePlayerIndex={activePlayerIndex} />
      </div>

      <div className="layout-column right">
        <div className="web-wrapper" onClick={handleWebClick}>
          <img 
            src={webIcon} 
            alt="Web" 
          className="web-icon" 
        />
        <img 
          src={SPIDERS[spiderIndex] || ''}
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
          <img src={cardJesterIcon} alt="Card Jester" className="card-jester-icon" />
          <span className="action-label action-label-orange">Card Jester</span>
        </div>
        
        <div className={`action-item ${frogSelecting ? 'frog-animating' : ''}`} onClick={handleFrogClick}>
          <img src={frogIcon} alt="Frog of Fate" className="frog-of-fate-icon" />
          <span className="action-label action-label-green">Frog of Fate</span>
        </div>
        <div className={`action-item ${diceRolling ? 'dice-animating' : ''}`} onClick={handleDiceClick}>
          <img src={diceIcon} alt="Dice of Fortune" className="dice-of-fortune-icon" />
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