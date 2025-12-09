import { useEffect, useMemo, useState } from 'react'
import './App.css'
import './components/actions/Actions.css'

import questionData from './data/questions.json'
import { GameBoard } from './components/game/GameBoard'
import { QuestionDialog } from './components/game/QuestionDialog'
import { MadSeerModal } from '@/features/actions/madSeer/MadSeerModal'
import { BloodSacrificeModal } from '@/features/actions/bloodSacrifice/BloodSacrificeModal'
import { PlayerSelectModal } from '@/components/game/PlayerSelectModal'
import { NeutralPlayerSelectModal } from '@/components/game/NeutralPlayerSelectModal'
import { FelPlayerSelectModal } from '@/components/game/FelPlayerSelectModal'
import { PuppetMasterPlayerSelectModal } from '@/components/game/PuppetMasterPlayerSelectModal'
import { useFrogSounds } from '@/features/actions/frogOfFate/useFrogSounds'
import { useDiceOfFortune } from '@/features/actions/diceOfFortune/useDiceOfFortune'
import { useMadSeerSounds } from '@/features/actions/madSeer/useMadSeerSounds'
import { useBloodSacrificeSounds } from '@/features/actions/bloodSacrifice/useBloodSacrificeSounds'
import { useGlobalClickSound } from '@/hooks/useGlobalClickSound'
import { Scoreboard } from './components/game/Scoreboard'
import { useJeopardyGame } from './hooks/useJeopardyGame'
import { gameConfig } from './config/gameConfig'
import type { QAItem, Tile, PlayerConfig, CardInstance } from './types/game'
import { type CardDefinition } from '@/data/cards'

import cardJesterIcon from '@/assets/images/actions/card_jester.png'
import madSeerIcon from '@/assets/images/actions/mad_seer.png'
import bloodSacrificeIcon from '@/assets/images/actions/blood_sacrifice.png'
import minimizeIcon from '@/assets/images/ui/minimize.png'
import expandIcon from '@/assets/images/ui/expand.png'
import webIcon from '@/assets/images/actions/web.png'
import frogIcon from '@/assets/images/actions/frog_of_fate.png'
import diceIcon from '@/assets/images/actions/dice_of_fortune.png'
import { CardRevealModal } from '@/features/actions/cardJester/CardRevealModal'
import { InventoryModal } from '@/components/game/InventoryModal'
import { StolenCardModal } from '@/features/cards/StolenCardModal'
import { TravelingMerchantModal } from '@/features/cards/TravelingMerchantModal'
import { PuppetMasterCategoryModal } from '@/features/cards/PuppetMasterCategoryModal'
import {
  buildCardDrawContext,
  pickCardForPlayer,
  getCardCatalogEntry,
  type TargetSelectMode,
} from '@/config/cardCatalog'

import spider1 from '@/assets/images/actions/spiders/spider_1.png'
import spider2 from '@/assets/images/actions/spiders/spider_2.png'
import spider3 from '@/assets/images/actions/spiders/spider_3.png'
import spider4 from '@/assets/images/actions/spiders/spider_4.png'
import spider5 from '@/assets/images/actions/spiders/spider_5.png'
import spider6 from '@/assets/images/actions/spiders/spider_6.png'
import spider7 from '@/assets/images/actions/spiders/spider_7.png'
import spider8 from '@/assets/images/actions/spiders/spider_8.png'

const SPIDERS = [null, spider1, spider2, spider3, spider4, spider5, spider6, spider7, spider8]

type StolenCardReveal = {
  card: CardInstance
  fromPlayerName: string
}

function App() {
  const [spiderIndex, setSpiderIndex] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [madSeerActive, setMadSeerActive] = useState(false)
  const [madSeerPreviewTile, setMadSeerPreviewTile] = useState<Tile | null>(null)
  const [frogSelecting, setFrogSelecting] = useState(false)
  const [frogHighlightId, setFrogHighlightId] = useState<string | null>(null)
  const [frogLandingId, setFrogLandingId] = useState<string | null>(null)
  
  const [bloodSacrificeActive, setBloodSacrificeActive] = useState(false)
  const [bloodSacrificeAmount, setBloodSacrificeAmount] = useState<number | null>(null)
  const [bloodSacrificeTargetSelecting, setBloodSacrificeTargetSelecting] = useState(false)

  const [currentCard, setCurrentCard] = useState<CardDefinition | null>(null)
  const [inventoryPlayerIndex, setInventoryPlayerIndex] = useState<number | null>(null)
  const [cardUsePending, setCardUsePending] = useState<CardInstance | null>(null)
  const [cardTargetSelecting, setCardTargetSelecting] = useState(false)
  const [cardTargetMode, setCardTargetMode] = useState<TargetSelectMode>('standard')
  const [stolenCardReveal, setStolenCardReveal] = useState<StolenCardReveal | null>(null)
  const [merchantOffers, setMerchantOffers] = useState<CardDefinition[] | null>(null)
  const [puppetTargetIndex, setPuppetTargetIndex] = useState<number | null>(null)
  const [puppetCategorySelecting, setPuppetCategorySelecting] = useState(false)


  useGlobalClickSound()
  const { playStart: playFrogStart, playHop, playLand } = useFrogSounds()
  const { playStart: playMadSeerStart } = useMadSeerSounds()
  const { playStart: playBloodSacrificeStart, playLand: playBloodSacrificeLand } = useBloodSacrificeSounds()
  const { triggerDice, isRolling: diceRolling, selectedSurvivorId, clearDiceEffect } = useDiceOfFortune()
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
    performBloodSacrifice,
    addCardToInventory,
    activateCard,
    activePuppetLockCategory,
  } = useJeopardyGame({
    categories: gameConfig.gameplay.categories,
    pointValues: gameConfig.gameplay.pointValues,
    players: gameConfig.players as PlayerConfig[],
    questionBank: questionData as QAItem[],
  })

  const puppetCategoryOptions = useMemo(() => {
    const counts = new Map<string, number>()
    tiles.forEach((tile) => {
      if (tile.status !== 'open') return
      counts.set(tile.category, (counts.get(tile.category) ?? 0) + 1)
    })
    return gameConfig.gameplay.categories.map((category) => ({
      name: category,
      availableCount: counts.get(category) ?? 0,
    }))
  }, [tiles])

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

  const handleCardJesterClick = () => {
    if (madSeerActive || frogSelecting || selectedTile || diceRolling || bloodSacrificeActive) return
    const drawContext = buildCardDrawContext(players, activePlayerIndex)
    const entry = pickCardForPlayer(drawContext)
    if (!entry) return
    const randomCard = entry.definition
    setCurrentCard(randomCard)
    addCardToInventory(randomCard)
  }

  const handleInventoryClick = (playerIndex: number) => {
    setInventoryPlayerIndex(playerIndex)
  }

  type CardEffectResult = {
    stolenCard?: CardInstance
    stolenFromIndex?: number
    merchantOffers?: CardDefinition[]
  }

  const processCardEffectResult = (effectResult: unknown) => {
    const result = effectResult as CardEffectResult | undefined

    const stolenCard = result?.stolenCard
    const stolenFromIndex = result?.stolenFromIndex
    if (stolenCard && typeof stolenFromIndex === 'number') {
      const fromName = players[stolenFromIndex]?.name ?? `Player ${stolenFromIndex + 1}`
      setStolenCardReveal({ card: stolenCard, fromPlayerName: fromName })
    }

    if (Array.isArray(result?.merchantOffers) && result?.merchantOffers.length > 0) {
      setMerchantOffers(result.merchantOffers)
    }
  }

  const handleMerchantSelect = (card: CardDefinition) => {
    addCardToInventory(card)
    setMerchantOffers(null)
  }

  const handleMerchantClose = () => {
    setMerchantOffers(null)
  }

  const handleCardUseRequest = (card: CardInstance) => {
    setInventoryPlayerIndex(null)
    setPuppetTargetIndex(null)
    setPuppetCategorySelecting(false)
    const entry = getCardCatalogEntry(card.id)
    const mode = entry?.targetSelectMode ?? 'standard'
    if (mode === 'none') {
      const effectResult = activateCard(card.instanceId, activePlayerIndex)
      processCardEffectResult(effectResult)
      setCardTargetMode('standard')
      setCardTargetSelecting(false)
      return
    }
    setCardUsePending(card)
    setCardTargetMode(mode)
    setCardTargetSelecting(true)
  }

  const handleCardTargetSelect = (targetIndex: number) => {
    if (!cardUsePending) return
    if (cardTargetMode === 'puppet') {
      setPuppetTargetIndex(targetIndex)
      setCardTargetSelecting(false)
      setPuppetCategorySelecting(true)
      return
    }
    const effectResult = activateCard(cardUsePending.instanceId, targetIndex)
    processCardEffectResult(effectResult)
    setCardUsePending(null)
    setCardTargetSelecting(false)
    setCardTargetMode('standard')
  }

  const handleCardTargetCancel = () => {
    setCardUsePending(null)
    setCardTargetSelecting(false)
    setCardTargetMode('standard')
    setPuppetTargetIndex(null)
    setPuppetCategorySelecting(false)
  }

  const handlePuppetCategorySelect = (category: string) => {
    if (!cardUsePending || puppetTargetIndex === null) return
    const effectResult = activateCard(cardUsePending.instanceId, puppetTargetIndex, {
      category,
    })
    processCardEffectResult(effectResult)
    setCardUsePending(null)
    setCardTargetMode('standard')
    setPuppetTargetIndex(null)
    setPuppetCategorySelecting(false)
  }

  const handlePuppetCategoryCancel = () => {
    setCardUsePending(null)
    setCardTargetMode('standard')
    setPuppetTargetIndex(null)
    setPuppetCategorySelecting(false)
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

    if (activePuppetLockCategory) {
      const tile = tiles.find((t) => t.id === tileId)
      const hasAvailableTiles = tiles.some(
        (entry) => entry.status === 'open' && entry.category === activePuppetLockCategory,
      )
      if (hasAvailableTiles && tile && tile.category !== activePuppetLockCategory) {
        return
      }
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

  const handleBloodSacrificeStart = () => {
    if (selectedTile || frogSelecting || diceRolling || madSeerActive) return
    playBloodSacrificeStart()
    setBloodSacrificeActive(true)
  }

  const handleBloodSacrificeConfirm = (amount: number) => {
    setBloodSacrificeAmount(amount)
    setBloodSacrificeActive(false)
    setBloodSacrificeTargetSelecting(true)
  }

  const handleBloodSacrificeTargetSelect = (targetIndex: number) => {
    if (bloodSacrificeAmount === null) return
    performBloodSacrifice(bloodSacrificeAmount, targetIndex)
    playBloodSacrificeLand()
    setBloodSacrificeTargetSelecting(false)
    setBloodSacrificeAmount(null)
  }

  const handleBloodSacrificeCancel = () => {
    setBloodSacrificeActive(false)
    setBloodSacrificeTargetSelecting(false)
    setBloodSacrificeAmount(null)
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
        <div className="action-item" onClick={handleCardJesterClick}>
          <img src={cardJesterIcon} alt="Card Jester" className="card-jester-icon" />
          <span className="action-label action-label-orange">Card Jester</span>
        </div>
        <div className={`action-item ${madSeerActive ? 'madseer-armed' : ''}`} onClick={handleMadSeerStart}>
          <img src={madSeerIcon} alt="Mad Seer" className="mad-seer-icon" />
          <span className="action-label action-label-purple">Mad Seer</span>
        </div>
        <div className="action-item" onClick={handleBloodSacrificeStart}>
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
          puppetLockCategory={activePuppetLockCategory}
        />

        <Scoreboard 
            players={players} 
            activePlayerIndex={activePlayerIndex} 
            onInventoryClick={handleInventoryClick}
        />
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

      {bloodSacrificeActive && (
        <BloodSacrificeModal
          onConfirm={handleBloodSacrificeConfirm}
          onCancel={handleBloodSacrificeCancel}
        />
      )}

      {bloodSacrificeTargetSelecting && (
        <PlayerSelectModal
          players={players}
          activePlayerIndex={activePlayerIndex}
          onSelect={handleBloodSacrificeTargetSelect}
          onCancel={handleBloodSacrificeCancel}
        />
      )}

      {currentCard && (
        <CardRevealModal
          card={currentCard}
          onClose={() => setCurrentCard(null)}
        />
      )}

      {merchantOffers && (
        <TravelingMerchantModal
          offers={merchantOffers}
          onSelect={handleMerchantSelect}
          onClose={handleMerchantClose}
        />
      )}

      {inventoryPlayerIndex !== null && (
        <InventoryModal
          player={players[inventoryPlayerIndex]}
          onClose={() => setInventoryPlayerIndex(null)}
          isActivePlayer={inventoryPlayerIndex === activePlayerIndex}
          onUseCard={
            inventoryPlayerIndex === activePlayerIndex ? handleCardUseRequest : undefined
          }
        />
      )}

      {cardTargetSelecting && cardUsePending && (
        cardTargetMode === 'neutral' ? (
          <NeutralPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        ) : cardTargetMode === 'fel' ? (
          <FelPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        ) : cardTargetMode === 'puppet' ? (
          <PuppetMasterPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        ) : (
          <PlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        )
      )}

      {puppetCategorySelecting && cardUsePending && puppetTargetIndex !== null && (
        <PuppetMasterCategoryModal
          options={puppetCategoryOptions}
          onSelect={handlePuppetCategorySelect}
          onCancel={handlePuppetCategoryCancel}
        />
      )}

      {stolenCardReveal && (
        <StolenCardModal
          card={stolenCardReveal.card}
          fromPlayerName={stolenCardReveal.fromPlayerName}
          onClose={() => setStolenCardReveal(null)}
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
