import { useEffect, useMemo, useRef, useState } from 'react'
import '@/App.css'
import '@/components/actions/Actions.css'
import '@/components/actions/ExhaustedAction.css'

import { GameBoard } from '@/components/game/GameBoard'
import { QuestionDialog } from '@/components/game/QuestionDialog'
import { MadSeerModal } from '@/features/actions/madSeer/MadSeerModal'
import { BloodSacrificeModal } from '@/features/actions/bloodSacrifice/BloodSacrificeModal'
import { PlayerSelectModal } from '@/components/game/PlayerSelectModal'
import { NeutralPlayerSelectModal } from '@/components/game/NeutralPlayerSelectModal'
import { FelPlayerSelectModal } from '@/components/game/FelPlayerSelectModal'
import { PuppetMasterPlayerSelectModal } from '@/components/game/PuppetMasterPlayerSelectModal'
import { CoalitionPlayerSelectModal } from '@/components/game/CoalitionPlayerSelectModal'
import { ScoreAdjustModal } from '@/components/game/ScoreAdjustModal'
import { useFrogSounds } from '@/features/actions/frogOfFate/useFrogSounds'
import { useGoldenIdol } from '@/features/actions/goldenIdol/useGoldenIdol'
import { useMadSeerSounds } from '@/features/actions/madSeer/useMadSeerSounds'
import { useBloodSacrificeSounds } from '@/features/actions/bloodSacrifice/useBloodSacrificeSounds'
import { Scoreboard } from '@/components/game/Scoreboard'
import { useJeopardyGame } from '@/hooks/useJeopardyGame'
import { gameConfig } from '@/config/gameConfig'
import { useRuntimeConfig } from '@/config/runtimeConfig'
import type { QAItem, Tile, PlayerConfig, CardInstance, ActionId, UpgradeableAction, Quest, PendingBlackMarket } from '@/types/game'
import { type CardDefinition } from '@/data/cards'

import cardJesterIcon from '@/assets/images/actions/card_jester.png'
import cardJesterUpgradedIcon from '@/assets/images/actions/card_jester_upgraded.png'
import madSeerIcon from '@/assets/images/actions/mad_seer.png'
import madSeerUpgradedIcon from '@/assets/images/actions/mad_seer_upraded.png'
import bloodSacrificeIcon from '@/assets/images/actions/blood_sacrifice.png'
import bloodSacrificeUpgradedIcon from '@/assets/images/actions/blood_sacrifice_upgraded.png'
import minimizeIcon from '@/assets/images/ui/minimize.png'
import expandIcon from '@/assets/images/ui/expand.png'
import webIcon from '@/assets/images/actions/web.png'
import frogIcon from '@/assets/images/actions/frog_of_fate.png'
import frogUpgradedIcon from '@/assets/images/actions/frog_of_fate_upgraded.png'
import idolIcon from '@/assets/images/actions/golden_idol.png'
import idolUpgradedIcon from '@/assets/images/actions/golden_idol_upgraded.png'
import { Badge } from '@/components/ui/8bit/badge'
import { CardRevealModal } from '@/features/actions/cardJester/CardRevealModal'
import { InventoryModal } from '@/components/game/InventoryModal'
import { StolenCardModal } from '@/features/cards/StolenCardModal'
import { TravelingMerchantModal } from '@/features/cards/TravelingMerchantModal'
import { PuppetMasterCategoryModal } from '@/features/cards/PuppetMasterCategoryModal'
import { RouletteModal } from '@/features/cards/RouletteModal'
import { PriceCrackerModal } from '@/features/cards/PriceCrackerModal'
import { TreasureSetModal } from '@/features/cards/TreasureSetModal'
import { TreasureIslandModal } from '@/features/cards/TreasureIslandModal'
import { SpiderFeedingModal } from '@/features/actions/web/SpiderFeedingModal'
import { ActionUpgradeModal } from '@/features/actions/web/ActionUpgradeModal'
import { BlackMarketModal } from '@/components/game/BlackMarketModal'
import { GameOverScreen } from '@/components/game/GameOverScreen'
import { StatsScreen } from '@/components/game/StatsScreen'
import { QuestModal } from '@/features/quests/QuestModal'
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

import lootGoblinSound from '@/assets/sounds/cards/loot_goblin.wav'

const SPIDERS = [null, spider1, spider2, spider3, spider4, spider5, spider6, spider7, spider8]

type StolenCardReveal = {
  card: CardInstance
  fromPlayerName: string
}

export type GameProps = {
  categories: string[]
  pointValues: number[]
  players: PlayerConfig[]
  questionBank: QAItem[]
}

export function Game({ categories, pointValues, players: initialPlayers, questionBank }: GameProps) {
  const runtimeConfig = useRuntimeConfig()
  const [spiderIndex, setSpiderIndex] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [madSeerActive, setMadSeerActive] = useState(false)
  const [madSeerPreviewTile, setMadSeerPreviewTile] = useState<Tile | null>(null)
  const [frogSelecting, setFrogSelecting] = useState(false)
  const [frogHighlightIds, setFrogHighlightIds] = useState<string[]>([])
  const [frogLandingIds, setFrogLandingIds] = useState<string[]>([])
  
  const [bloodSacrificeActive, setBloodSacrificeActive] = useState(false)
  const [bloodSacrificeAmount, setBloodSacrificeAmount] = useState<number | null>(null)
  const [bloodSacrificeTargetSelecting, setBloodSacrificeTargetSelecting] = useState(false)

  const [revealedCards, setRevealedCards] = useState<CardDefinition[]>([])
  const [inventoryPlayerIndex, setInventoryPlayerIndex] = useState<number | null>(null)
  const [cardUsePending, setCardUsePending] = useState<CardInstance | null>(null)
  const [cardTargetSelecting, setCardTargetSelecting] = useState(false)
  const [cardTargetMode, setCardTargetMode] = useState<TargetSelectMode>('standard')
  const [stolenCardReveal, setStolenCardReveal] = useState<StolenCardReveal | null>(null)
  const [merchantOffers, setMerchantOffers] = useState<CardDefinition[] | null>(null)
  const [puppetTargetIndex, setPuppetTargetIndex] = useState<number | null>(null)
  const [puppetCategorySelecting, setPuppetCategorySelecting] = useState(false)
  const [rouletteActive, setRouletteActive] = useState(false)
  const [priceCrackerActive, setPriceCrackerActive] = useState(false)
  const [treasureSetActive, setTreasureSetActive] = useState(false)
  const [treasureIslandActive, setTreasureIslandActive] = useState(false)
  const [treasureCardIds, setTreasureCardIds] = useState<string[]>([])
  const [freezeSelectMode, setFreezeSelectMode] = useState(false)
  const [scoreAdjustPlayerIndex, setScoreAdjustPlayerIndex] = useState<number | null>(null)
  const [spiderFeedingActive, setSpiderFeedingActive] = useState(false)
  const [actionUpgradeActive, setActionUpgradeActive] = useState(false)
  const [remainingUpgrades, setRemainingUpgrades] = useState(0)
  const [blackMarketData, setBlackMarketData] = useState<{ playerIndex: number; playerName: string; cards: CardDefinition[] } | null>(null)
  const [showTurnIntro, setShowTurnIntro] = useState(false)
  const [introExiting, setIntroExiting] = useState(false)
  const [cardsEntering, setCardsEntering] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [gameEndTime, setGameEndTime] = useState<number | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [selectedQuestPlayerIndex, setSelectedQuestPlayerIndex] = useState<number | null>(null)

  const { playStart: playFrogStart, playHop, playLand } = useFrogSounds()
  const { playStart: playMadSeerStart } = useMadSeerSounds()
  const { playStart: playBloodSacrificeStart, playLand: playBloodSacrificeLand } = useBloodSacrificeSounds()
  const { triggerIdol, isActive: idolActive, selectedSurvivorIds, clearIdolEffect } = useGoldenIdol()
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
    removeCardFromInventory,
    activateCard,
    activePuppetLockCategory,
    combineTreasureSet,
    freezeTile,
    freezeAction,
    frozenActions,
    setActivePlayer,
    adjustPlayerScore,
    increaseSpiderSense,
    addRerolls,
    upgradeAction,
    incrementActionCount,
    alliances,
    createAlliance,
    goldenIdolBonus,
    resetGoldenIdolBonus,
    gameMetrics,
    recordActionUsage,
    incrementPlayerMetric,
    acceptBlackMarketCards,
    consumeReroll,
    grantQuest,
    claimQuestReward,
    updateQuestProgress,
    updateCardState,
  } = useJeopardyGame({
    categories,
    pointValues,
    players: initialPlayers,
    questionBank,
    onBlackMarketStart: (playerIndex, playerName, cards) => {
      setBlackMarketData({ playerIndex, playerName, cards })
      setShowTurnIntro(true)
    },
    onUndo: (restoredBlackMarket: PendingBlackMarket | null) => {
      // Handle undo: restore Black Market modal state if there was a pending Black Market
      if (restoredBlackMarket) {
        // Check if we're undoing within the same Black Market session (same player)
        // If so, just update cards without replaying intro animation
        const isSameBlackMarketSession = blackMarketData &&
          blackMarketData.playerIndex === restoredBlackMarket.playerIndex

        // Restore the Black Market modal with the saved cards
        setBlackMarketData({
          playerIndex: restoredBlackMarket.playerIndex,
          playerName: restoredBlackMarket.playerName,
          cards: restoredBlackMarket.cards,
        })

        // Only show turn intro if this is a different Black Market session
        // (e.g., undoing back to a previous player's turn)
        if (!isSameBlackMarketSession) {
          setShowTurnIntro(true)
          setIntroExiting(false)
          setCardsEntering(false)
        } else {
          // Same session (undoing a reroll) - ensure modal is visible without intro
          setShowTurnIntro(false)
          setIntroExiting(false)
          setCardsEntering(false)
        }
      } else {
        // No pending Black Market - clear the modal
        setBlackMarketData(null)
        setShowTurnIntro(false)
        setIntroExiting(false)
        setCardsEntering(false)
      }
    },
  })

  const puppetCategoryOptions = useMemo(() => {
    const counts = new Map<string, number>()
    tiles.forEach((tile) => {
      if (tile.status !== 'open') return
      counts.set(tile.category, (counts.get(tile.category) ?? 0) + 1)
    })
    return categories.map((category) => ({
      name: category,
      availableCount: counts.get(category) ?? 0,
    }))
  }, [tiles, categories])

  const isActionUpgraded = (actionId: UpgradeableAction) => {
    return players[activePlayerIndex]?.upgradedActions?.[actionId] ?? false
  }

  const getActionCount = (actionId: ActionId) => {
    return players[activePlayerIndex]?.actionCounts?.[actionId] ?? 0
  }

  const isActionExhausted = (actionId: ActionId) => {
    const count = getActionCount(actionId)
    const limits = runtimeConfig.mechanics.actionLimits
    let limit = Infinity
    if (actionId === 'card_jester') limit = limits.cardJester
    else if (actionId === 'mad_seer') limit = limits.madSeer
    else if (actionId === 'frog_of_fate') limit = limits.frogOfFate
    else if (actionId === 'golden_idol') limit = limits.goldenIdol
    else if (actionId === 'blood_sacrifice') limit = limits.bloodSacrifice
    else if (actionId === 'web') limit = limits.web

    return count >= limit
  }

  // Visual exhausted state - only show after effect completes
  const shouldShowExhausted = (actionId: ActionId) => {
    if (!isActionExhausted(actionId)) return false
    // Don't show exhausted visual while the action is still animating
    if (actionId === 'mad_seer' && madSeerActive) return false
    if (actionId === 'frog_of_fate' && frogSelecting) return false
    if (actionId === 'golden_idol' && idolActive) return false
    return true
  }

  const handleWebClick = () => {
    if (freezeSelectMode && cardUsePending) {
      if (frozenActions.web) return
      freezeAction('web', activePlayerIndex, cardUsePending.instanceId)
      activateCard(cardUsePending.instanceId, activePlayerIndex, { actionId: 'web' })
      setFreezeSelectMode(false)
      setCardUsePending(null)
      return
    }
    if (frozenActions.web) return
    if (isActionExhausted('web')) return

    incrementActionCount(activePlayerIndex, 'web')
    recordActionUsage(activePlayerIndex, 'web')
    setSpiderFeedingActive(true)
  }

  const handleSpiderFeedIsopod = (isopodInstanceId: string) => {
    removeCardFromInventory(activePlayerIndex, isopodInstanceId)
    setSpiderIndex((prev) => (prev < 8 ? prev + 1 : prev))
    increaseSpiderSense(activePlayerIndex)
    addRerolls(activePlayerIndex, runtimeConfig.mechanics.spiderIsopodRerollBonus)
    incrementPlayerMetric(activePlayerIndex, 'isopodsFed')
    updateQuestProgress(activePlayerIndex, 'spider_quest', 1)
  }

  const handleSpiderFeedSheep = (sheepInstanceId: string) => {
    removeCardFromInventory(activePlayerIndex, sheepInstanceId)
    setSpiderFeedingActive(false)
    addRerolls(activePlayerIndex, runtimeConfig.mechanics.spiderWeb.sheepRerollBonus)
    const upgrades = runtimeConfig.mechanics.spiderWeb.sheepUpgradesGiven
    setRemainingUpgrades(upgrades)
    setActionUpgradeActive(true)
    incrementPlayerMetric(activePlayerIndex, 'sheepFed')
  }

  const handleUpgradeAction = (actionId: UpgradeableAction) => {
    upgradeAction(activePlayerIndex, actionId)
    const newRemaining = remainingUpgrades - 1
    setRemainingUpgrades(newRemaining)
    if (newRemaining <= 0) {
      setActionUpgradeActive(false)
    }
    // Keep modal open if more upgrades remain
  }

  const handleActionFreezeClick = (actionId: ActionId) => {
    if (!freezeSelectMode || !cardUsePending) return false
    if (frozenActions[actionId]) return false
    freezeAction(actionId, activePlayerIndex, cardUsePending.instanceId)
    activateCard(cardUsePending.instanceId, activePlayerIndex, { actionId })

    // Track quest progress for glacial elemental
    if (cardUsePending.id === 'glacial_elemental') {
      updateQuestProgress(activePlayerIndex, 'glacial_quest', 1)
    }

    setFreezeSelectMode(false)
    setCardUsePending(null)
    return true
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
    if (handleActionFreezeClick('card_jester')) return
    if (frozenActions.card_jester) return
    if (isActionExhausted('card_jester')) return
    if (madSeerActive || frogSelecting || selectedTile || idolActive || bloodSacrificeActive) return

    const price = runtimeConfig.mechanics.actionPrices.cardJester
    const currentPlayer = players[activePlayerIndex]

    if (currentPlayer.score < price) {
      // Not enough points
      return
    }

    adjustPlayerScore(activePlayerIndex, -price)
    incrementActionCount(activePlayerIndex, 'card_jester')
    recordActionUsage(activePlayerIndex, 'card_jester')
    updateQuestProgress(activePlayerIndex, 'jester_quest', 1)

    const isUpgraded = isActionUpgraded('card_jester')
    const cardsToDraw = isUpgraded
      ? runtimeConfig.mechanics.cardJester.cardsToGiveUpgraded
      : runtimeConfig.mechanics.cardJester.cardsToGive
    const newCards: CardDefinition[] = []

    for (let i = 0; i < cardsToDraw; i++) {
      const drawContext = buildCardDrawContext(players, activePlayerIndex)
      const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
      if (entry) {
        const card = entry.definition
        addCardToInventory(card)
        newCards.push(card)
      }
    }

    if (newCards.length > 0) {
      setRevealedCards(prev => [...prev, ...newCards])
    }
  }

  const handleInventoryClick = (playerIndex: number) => {
    setInventoryPlayerIndex(playerIndex)
  }

  type CardEffectResult = {
    stolenCard?: CardInstance
    stolenFromIndex?: number
    merchantOffers?: CardDefinition[]
    createAlliance?: {
      initiatorIndex: number
      targetIndex: number
      cardInstanceId: string
    }
    grantQuest?: {
      playerIndex: number
      questId: 'blood_quest'
      sourceCardInstanceId: string
    }
    playSound?: string
  }

  const processCardEffectResult = (effectResult: unknown) => {
    const result = effectResult as CardEffectResult | undefined

    if (result?.playSound === 'loot_goblin') {
      new Audio(lootGoblinSound).play().catch(() => {})
    }

    const stolenCard = result?.stolenCard
    if (stolenCard && result.stolenFromIndex !== undefined) {
      setStolenCardReveal({
        card: stolenCard,
        fromPlayerName: players[result.stolenFromIndex].name
      })
    }

    if (result?.merchantOffers) {
      setMerchantOffers(result.merchantOffers)
    }

    if (result?.createAlliance) {
      createAlliance(
        result.createAlliance.initiatorIndex,
        result.createAlliance.targetIndex,
        result.createAlliance.cardInstanceId
      )
    }

    if (result?.grantQuest) {
      const quest = grantQuest(
        result.grantQuest.playerIndex,
        result.grantQuest.questId,
        result.grantQuest.sourceCardInstanceId
      )
      setSelectedQuest(quest)
      setSelectedQuestPlayerIndex(result.grantQuest.playerIndex)
    }
  }

  const handleMerchantSelect = (card: CardDefinition) => {
    addCardToInventory(card)
    setMerchantOffers(null)
  }

  const handleMerchantClose = () => {
    setMerchantOffers(null)
  }

  const handleQuestClick = (playerIndex: number, questId: string) => {
    const player = players[playerIndex]
    const quest = player?.quests?.find((q) => q.id === questId)

    if (quest) {
      setSelectedQuest(quest)
      setSelectedQuestPlayerIndex(playerIndex)
    }
  }

  const handleCloseQuestModal = () => {
    setSelectedQuest(null)
    setSelectedQuestPlayerIndex(null)
  }

  const handleClaimQuestReward = () => {
    if (selectedQuest && selectedQuestPlayerIndex !== null) {
      const rewardCards = claimQuestReward(selectedQuestPlayerIndex, selectedQuest.id)
      setSelectedQuest(null)
      setSelectedQuestPlayerIndex(null)

      // Show the reward cards in the reveal modal
      if (rewardCards && rewardCards.length > 0) {
        setRevealedCards(rewardCards)
      }
    }
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
    if (mode === 'roulette') {
      setCardUsePending(card)
      setRouletteActive(true)
      return
    }
    if (mode === 'price_cracker') {
      setCardUsePending(card)
      setPriceCrackerActive(true)
      return
    }
    if (mode === 'treasure') {
      setTreasureSetActive(true)
      return
    }
    if (mode === 'freeze') {
      setCardUsePending(card)
      setFreezeSelectMode(true)
      return
    }
    setCardUsePending(card)
    setCardTargetMode(mode)
    setCardTargetSelecting(true)
  }

  const handleRouletteConfirm = (won: boolean, amount: number) => {
    if (!cardUsePending) return
    const effectResult = activateCard(cardUsePending.instanceId, activePlayerIndex, {
      won,
      amount,
    })
    processCardEffectResult(effectResult)
    setCardUsePending(null)
    setRouletteActive(false)
  }

  const handleRouletteCancel = () => {
    setCardUsePending(null)
    setRouletteActive(false)
  }

  const handlePriceCrackerConfirm = (winnerIndex: number, prizes: { cards: number; points: number }): CardDefinition[] => {
    if (!cardUsePending) return []

    // Activate the card with the result metadata
    const effectResult = activateCard(cardUsePending.instanceId, activePlayerIndex, {
      winnerIndex,
      points: prizes.points,
      cards: prizes.cards,
    })
    processCardEffectResult(effectResult)

    // Grant random cards to the winner and collect them for reveal
    const wonCards: CardDefinition[] = []
    if (prizes.cards > 0) {
      const context = buildCardDrawContext(players, winnerIndex)
      for (let i = 0; i < prizes.cards; i++) {
        const entry = pickCardForPlayer(context, runtimeConfig.mechanics.cardWeights)
        if (entry) {
          addCardToInventory(entry.definition, winnerIndex)
          wonCards.push(entry.definition)
        }
      }
    }

    // Don't clear cardUsePending yet - modal needs it to stay mounted for reveal phase
    // Modal will call onCancel when done
    return wonCards
  }

  const handlePriceCrackerCancel = () => {
    setCardUsePending(null)
    setPriceCrackerActive(false)
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
    if (handleActionFreezeClick('mad_seer')) return
    if (frozenActions.mad_seer) return
    if (isActionExhausted('mad_seer')) return
    if (selectedTile || frogSelecting || idolActive || madSeerActive) return

    const price = runtimeConfig.mechanics.actionPrices.madSeer
    const currentPlayer = players[activePlayerIndex]

    if (currentPlayer.score < price) {
      return
    }

    adjustPlayerScore(activePlayerIndex, -price)
    incrementActionCount(activePlayerIndex, 'mad_seer')
    recordActionUsage(activePlayerIndex, 'mad_seer')

    playMadSeerStart()
    setMadSeerActive(true)
    setMadSeerPreviewTile(null)
  }

  const handleTileSelect = (tileId: string) => {
    // Handle freeze selection mode
    if (freezeSelectMode && cardUsePending) {
      const tile = tiles.find((t) => t.id === tileId)
      if (!tile || tile.status !== 'open' || tile.modifiers?.isCrumbled || tile.modifiers?.frozen) return

      // Freeze the tile
      freezeTile(tileId, activePlayerIndex, cardUsePending.instanceId)

      // Activate the card (consumes it)
      const effectResult = activateCard(cardUsePending.instanceId, activePlayerIndex, { tileId })
      processCardEffectResult(effectResult)

      // Track quest progress for glacial elemental
      if (cardUsePending.id === 'glacial_elemental') {
        updateQuestProgress(activePlayerIndex, 'glacial_quest', 1)
      }

      // Reset freeze mode
      setFreezeSelectMode(false)
      setCardUsePending(null)
      return
    }

    // Handle Mad Seer logic first
    if (madSeerActive) {
      const tile = tiles.find((t) => t.id === tileId)
      if (!tile || tile.status === 'done') return
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

    // If Golden Idol just ran, logic is handled in GameBoard regarding 'disabled'.
    if (selectedSurvivorIds) {
      if (selectedSurvivorIds.includes(tileId)) {
        handleTileClick(tileId)
        // Clear persistent crumbled state
        clearIdolEffect(tiles, updateTileModifiers)
      }
      return
    }

    handleTileClick(tileId)
  }

  const handleMadSeerAccept = () => {
    if (!madSeerPreviewTile) return
    handleTileClick(madSeerPreviewTile.id)
    if (selectedSurvivorIds && selectedSurvivorIds.includes(madSeerPreviewTile.id)) {
        clearIdolEffect(tiles, updateTileModifiers)
    }
    setMadSeerPreviewTile(null)
    setMadSeerActive(false)
    updateQuestProgress(activePlayerIndex, 'seer_quest', 1)
  }

  const handleMadSeerReject = () => {
    setMadSeerPreviewTile(null)
    setMadSeerActive(false)
    updateQuestProgress(activePlayerIndex, 'seer_quest', 1)
  }

  const handleBloodSacrificeStart = () => {
    if (handleActionFreezeClick('blood_sacrifice')) return
    if (frozenActions.blood_sacrifice) return
    if (isActionExhausted('blood_sacrifice')) return
    if (selectedTile || frogSelecting || idolActive || madSeerActive) return
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
    incrementActionCount(activePlayerIndex, 'blood_sacrifice')
    recordActionUsage(activePlayerIndex, 'blood_sacrifice')
    setBloodSacrificeTargetSelecting(false)
    setBloodSacrificeAmount(null)
  }

  const handleBloodSacrificeCancel = () => {
    setBloodSacrificeActive(false)
    setBloodSacrificeTargetSelecting(false)
    setBloodSacrificeAmount(null)
  }

  const getOpenTiles = () => tiles.filter((tile) => tile.status === 'open')

  // Check if game is over (no open tiles left)
  const isGameOver = useMemo(() => {
    return tiles.length > 0 && tiles.every((tile) => tile.status === 'done')
  }, [tiles])

  // Show game over screen when game ends
  useEffect(() => {
    if (isGameOver && !showGameOver && !showStats) {
      // Capture the end time when game ends
      if (gameEndTime === null) {
        setGameEndTime(Date.now())
      }
      // Small delay to let the last question animation complete
      const timer = setTimeout(() => {
        setShowGameOver(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, showGameOver, showStats, gameEndTime])

  const handleViewStats = () => {
    setShowGameOver(false)
    setShowStats(true)
  }

  const handleBackFromStats = () => {
    setShowStats(false)
    setShowGameOver(true)
  }

  const handlePlayAgain = () => {
    // Reload the page to start fresh (or navigate to main menu)
    window.location.reload()
  }

  const runFrogSelection = async (count: number = 1) => {
    const openTiles = getOpenTiles()
    if (openTiles.length === 0) return

    setFrogSelecting(true)
    setFrogLandingIds([])
    
    // Scale extra hops based on board size to speed up end-game
    const extraHops = Math.min(10, Math.max(2, Math.floor(openTiles.length / 2)))
    
    // Generate 'count' independent sequences
    const sequences: string[][] = []
    
    for (let f = 0; f < count; f++) {
      const sequence: string[] = []
      const shuffled = [...openTiles].sort(() => Math.random() - 0.5)
      shuffled.forEach((tile) => sequence.push(tile.id))
      
      for (let i = 0; i < extraHops; i++) {
        sequence.push(openTiles[Math.floor(Math.random() * openTiles.length)].id)
      }
      sequences.push(sequence)
    }

    // Determine the max length so we can loop through steps
    const maxSteps = Math.max(...sequences.map(s => s.length))

    for (let i = 0; i < maxSteps; i++) {
      // Collect current step's highlighted tiles for all frogs
      const currentHighlights: string[] = []
      
      sequences.forEach(seq => {
         // If sequence ended, hold on the last tile (the landing spot)
         if (i < seq.length) {
            currentHighlights.push(seq[i])
         } else {
            currentHighlights.push(seq[seq.length - 1])
         }
      })
      
      setFrogHighlightIds(currentHighlights)
      playHop()
      
      const progress = i / maxSteps
      const delay = 120 + progress * 140
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    // Finalize
    const finalTileIds = sequences.map(seq => seq[seq.length - 1])
    setFrogHighlightIds([])
    setFrogLandingIds(finalTileIds)
    
    // Apply multiplier to each landed tile
    // If multiple frogs land on same tile, applyTileMultiplier is called multiple times
    finalTileIds.forEach(id => {
      applyTileMultiplier(id, 2)
    })
    
    playLand()
    setTimeout(() => {
      setFrogLandingIds([])
      setFrogSelecting(false)
    }, 900)
  }

  const handleFrogClick = () => {
    if (handleActionFreezeClick('frog_of_fate')) return
    if (frozenActions.frog_of_fate) return
    if (isActionExhausted('frog_of_fate')) return
    if (madSeerActive || frogSelecting || selectedTile || idolActive) return

    const price = runtimeConfig.mechanics.actionPrices.frogOfFate
    const currentPlayer = players[activePlayerIndex]

    if (currentPlayer.score < price) {
      return
    }

    adjustPlayerScore(activePlayerIndex, -price)
    incrementActionCount(activePlayerIndex, 'frog_of_fate')
    recordActionUsage(activePlayerIndex, 'frog_of_fate')
    updateQuestProgress(activePlayerIndex, 'frog_quest', 1)

    const isUpgraded = isActionUpgraded('frog_of_fate')
    playFrogStart()
    runFrogSelection(isUpgraded ? 2 : 1)
  }

  const handleIdolClick = async () => {
    if (handleActionFreezeClick('golden_idol')) return
    if (frozenActions.golden_idol) return
    if (isActionExhausted('golden_idol')) return
    if (madSeerActive || frogSelecting || selectedTile || idolActive || selectedSurvivorIds) return

    // Award the accumulated bonus and track it
    adjustPlayerScore(activePlayerIndex, goldenIdolBonus)
    incrementPlayerMetric(activePlayerIndex, 'goldenIdolPointsGained', goldenIdolBonus)
    incrementActionCount(activePlayerIndex, 'golden_idol')
    recordActionUsage(activePlayerIndex, 'golden_idol')
    updateQuestProgress(activePlayerIndex, 'idol_quest', 1)

    const isUpgraded = isActionUpgraded('golden_idol')
    await triggerIdol(tiles, updateTileModifiers, isUpgraded ? 2 : 1)

    resetGoldenIdolBonus()
  }

  // Clear action states when turn changes
  const prevActivePlayerRef = useRef(activePlayerIndex)
  useEffect(() => {
    if (prevActivePlayerRef.current !== activePlayerIndex) {
      // Clear golden idol effect
      if (selectedSurvivorIds) {
        clearIdolEffect(tiles, updateTileModifiers)
      }
      // Clear other action states
      setMadSeerActive(false)
      setMadSeerPreviewTile(null)
      setFrogSelecting(false)
      setFrogHighlightIds([])
      setFrogLandingIds([])
      setBloodSacrificeActive(false)
      setFreezeSelectMode(false)

      prevActivePlayerRef.current = activePlayerIndex
    }
  }, [activePlayerIndex, selectedSurvivorIds, clearIdolEffect, tiles, updateTileModifiers])

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

  // Handle turn intro transition with exit animation
  useEffect(() => {
    if (showTurnIntro && blackMarketData) {
      // Start exit animation after showing intro
      const exitTimer = setTimeout(() => {
        setIntroExiting(true)
      }, 1400) // Show intro for 1.4 seconds before starting exit

      // Complete transition after exit animation
      const transitionTimer = setTimeout(() => {
        setShowTurnIntro(false)
        setIntroExiting(false)
        setCardsEntering(true)
      }, 1800) // Exit animation takes 0.4s

      // Clear cards entering state after animation
      const cardsTimer = setTimeout(() => {
        setCardsEntering(false)
      }, 2400) // Cards animation takes 0.6s

      return () => {
        clearTimeout(exitTimer)
        clearTimeout(transitionTimer)
        clearTimeout(cardsTimer)
      }
    }
  }, [showTurnIntro, blackMarketData])

  // Change title based on Black Market state
  const displayTitle = showTurnIntro
    ? `${blackMarketData?.playerName?.toUpperCase()}'S TURN`
    : blackMarketData
      ? "BLACK MARKET"
      : gameConfig.meta.title
  const isBlackMarketActive = !!blackMarketData

  const handleBlackMarketReroll = (cardIndex: number, currentCards: CardDefinition[]): CardDefinition | null => {
    if (!blackMarketData) return null
    const newCard = consumeReroll(blackMarketData.playerIndex, currentCards, cardIndex)
    return newCard
  }

  const handleBlackMarketAccept = (cards: CardDefinition[]) => {
    acceptBlackMarketCards(cards)
    setBlackMarketData(null)
  }

  return (
    <div className="app">
      <div className="layout-column left">
        <div 
          className={`action-item ${
            frozenActions.card_jester ? 'action-frozen' : ''
          } ${
            isActionExhausted('card_jester') ? 'action-exhausted' : ''
          } ${
            freezeSelectMode && !frozenActions.card_jester ? 'action-freeze-target' : ''
          }`} 
          onClick={handleCardJesterClick}
        >
          {frozenActions.card_jester && (
            <div className="action-frozen-overlay back">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
          <div className="action-price-badge">
            <Badge font="retro" variant="destructive" className="bg-[#8B0000] border-[#8B0000]">
              {runtimeConfig.mechanics.actionPrices.cardJester}
            </Badge>
          </div>
          <img 
            src={isActionUpgraded('card_jester') ? cardJesterUpgradedIcon : cardJesterIcon} 
            alt="Card Jester" 
            className={`card-jester-icon ${isActionUpgraded('card_jester') ? 'upgraded' : ''}`}
          />
          <span className={`action-label ${isActionUpgraded('card_jester') ? 'action-label-green' : 'action-label-orange'}`}>
            {isActionUpgraded('card_jester') ? 'Cards Jester' : 'Card Jester'}
          </span>
          {frozenActions.card_jester && (
            <div className="action-frozen-overlay front">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
        </div>
        <div 
          className={`action-item ${
            madSeerActive ? 'madseer-armed' : ''
          } ${
            frozenActions.mad_seer ? 'action-frozen' : ''
          } ${
            shouldShowExhausted('mad_seer') ? 'action-exhausted' : ''
          } ${
            freezeSelectMode && !frozenActions.mad_seer ? 'action-freeze-target' : ''
          }`}
          onClick={handleMadSeerStart}
        >
          {frozenActions.mad_seer && (
            <div className="action-frozen-overlay back">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
          <div className="action-price-badge">
            <Badge font="retro" variant="destructive" className="bg-[#8B0000] border-[#8B0000]">
              {runtimeConfig.mechanics.actionPrices.madSeer}
            </Badge>
          </div>
          <img 
            src={isActionUpgraded('mad_seer') ? madSeerUpgradedIcon : madSeerIcon} 
            alt="Mad Seer" 
            className={`mad-seer-icon ${isActionUpgraded('mad_seer') ? 'upgraded' : ''}`} 
          />


          <span className={`action-label ${isActionUpgraded('mad_seer') ? 'action-label-white' : 'action-label-purple'}`}>
            {isActionUpgraded('mad_seer') ? 'Madder Seer' : 'Mad Seer'}
          </span>
          {frozenActions.mad_seer && (
            <div className="action-frozen-overlay front">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
        </div>
        <div 
          className={`action-item ${
            frozenActions.blood_sacrifice ? 'action-frozen' : ''
          } ${
            isActionExhausted('blood_sacrifice') ? 'action-exhausted' : ''
          } ${
            freezeSelectMode && !frozenActions.blood_sacrifice ? 'action-freeze-target' : ''
          }`} 
          onClick={handleBloodSacrificeStart}
        >
          {frozenActions.blood_sacrifice && (
            <div className="action-frozen-overlay back">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
          <img 
            src={isActionUpgraded('blood_sacrifice') ? bloodSacrificeUpgradedIcon : bloodSacrificeIcon} 
            alt="Blood Sacrifice" 
            className={`blood-sacrifice-icon ${isActionUpgraded('blood_sacrifice') ? 'upgraded' : ''}`} 
          />
          <span className="action-label action-label-red">
            {isActionUpgraded('blood_sacrifice') ? 'Blood Sacrifices' : 'Blood Sacrifice'}
          </span>
          {frozenActions.blood_sacrifice && (
            <div className="action-frozen-overlay front">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
        </div>
      </div>

      <div className="dungeon-frame">
        <header className="title-wrap relative">
          <h1 className={`title ${isBlackMarketActive ? 'title-black-market' : ''}`}>{displayTitle}</h1>
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

        {isBlackMarketActive ? (
          showTurnIntro ? (
            <section className={`board-shell turn-intro-shell ${introExiting ? 'turn-intro-exiting' : ''}`}>
              {/* Match black market structure for consistent height */}
              <div className="black-market-header-spacer" />
              <div className="black-market-grid turn-intro-grid">
                <div className="turn-intro-content">
                  <img
                    src={players[blackMarketData.playerIndex]?.portrait}
                    alt={blackMarketData.playerName}
                    className="turn-intro-portrait"
                  />
                  <h2 className="turn-intro-title">{blackMarketData.playerName}'s Turn</h2>
                  <p className="turn-intro-subtitle">Choose your cards!</p>
                </div>
              </div>
            </section>
          ) : (
            <BlackMarketModal
              playerName={blackMarketData.playerName}
              cards={blackMarketData.cards}
              rerollsRemaining={players[blackMarketData.playerIndex]?.rerollsRemaining ?? 0}
              onReroll={handleBlackMarketReroll}
              onAccept={handleBlackMarketAccept}
              isEntering={cardsEntering}
            />
          )
        ) : (
          <GameBoard
            categories={categories}
            tiles={tiles}
            onTileSelect={handleTileSelect}
            highlightOpenTiles={madSeerActive}
            highlightedTileId={madSeerPreviewTile?.id ?? null}
            boardLocked={!!selectedTile || !!madSeerPreviewTile || frogSelecting || idolActive}
            frogHighlightIds={frogHighlightIds}
            frogLandingIds={frogLandingIds}
            idolSurvivorIds={selectedSurvivorIds}
            puppetLockCategory={activePuppetLockCategory}
            freezeSelectMode={freezeSelectMode}
          />
        )}

        <Scoreboard
            players={players}
            activePlayerIndex={activePlayerIndex}
            alliances={alliances}
            onInventoryClick={handleInventoryClick}
            onSetActivePlayer={setActivePlayer}
            onAdjustScoreClick={(playerIndex) => setScoreAdjustPlayerIndex(playerIndex)}
            onQuestClick={handleQuestClick}
            isBlackMarketActive={isBlackMarketActive}
        />
      </div>

      <div className="layout-column right">
        <div 
          className={`web-wrapper ${
            frozenActions.web ? 'action-frozen' : ''
          } ${
            isActionExhausted('web') ? 'action-exhausted' : ''
          } ${
            freezeSelectMode && !frozenActions.web ? 'action-freeze-target' : ''
          }`} 
          onClick={handleWebClick}
        >
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
          {frozenActions.web && (
            <div className="action-frozen-overlay back web-frozen-overlay">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
          {frozenActions.web && (
            <div className="action-frozen-overlay front web-frozen-overlay">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
        </div>
        {/* Invisible spacer to match Card Jester's height/position in the left column */}
        <div className="action-item" style={{ visibility: 'hidden' }}>
          <img src={cardJesterIcon} alt="Card Jester" className="card-jester-icon" />
          <span className="action-label action-label-orange">Card Jester</span>
        </div>
        
        <div 
          className={`action-item ${
            frogSelecting ? 'frog-animating' : ''
          } ${
            frozenActions.frog_of_fate ? 'action-frozen' : ''
          } ${
            shouldShowExhausted('frog_of_fate') ? 'action-exhausted' : ''
          } ${
            freezeSelectMode && !frozenActions.frog_of_fate ? 'action-freeze-target' : ''
          }`}
          onClick={handleFrogClick}
        >
          {frozenActions.frog_of_fate && (
            <div className="action-frozen-overlay back">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
          <div className="action-price-badge">
            <Badge font="retro" variant="destructive" className="bg-[#8B0000] border-[#8B0000]">
              {runtimeConfig.mechanics.actionPrices.frogOfFate}
            </Badge>
          </div>
          <img 
            src={isActionUpgraded('frog_of_fate') ? frogUpgradedIcon : frogIcon} 
            alt="Frog of Fate" 
            className={`frog-of-fate-icon ${isActionUpgraded('frog_of_fate') ? 'upgraded' : ''}`}
          />
          <span className={`action-label ${isActionUpgraded('frog_of_fate') ? 'action-label-orange' : 'action-label-green'}`}>
            {isActionUpgraded('frog_of_fate') ? 'Frog of Fates' : 'Frog of Fate'}
          </span>
          {frozenActions.frog_of_fate && (
            <div className="action-frozen-overlay front">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
        </div>
        <div 
          className={`action-item ${
            idolActive ? 'idol-animating' : ''
          } ${
            frozenActions.golden_idol ? 'action-frozen' : ''
          } ${
            shouldShowExhausted('golden_idol') ? 'action-exhausted' : ''
          } ${
            freezeSelectMode && !frozenActions.golden_idol ? 'action-freeze-target' : ''
          }`}
          onClick={handleIdolClick}
        >
          {frozenActions.golden_idol && (
            <div className="action-frozen-overlay back">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
          <div className="action-price-badge">
            <Badge 
              font="retro" 
              className="bg-[#FFD700] border-none text-black hover:bg-[#FFC000]"
              style={{
                boxShadow: `0 0 ${Math.min(50, (goldenIdolBonus ?? 0) / 4)}px ${(goldenIdolBonus ?? 0) > 50 ? 2 : 1}px rgba(255, 215, 0, 0.8)`
              }}
            >
              +{goldenIdolBonus}
            </Badge>
          </div>
          <img 
            src={isActionUpgraded('golden_idol') ? idolUpgradedIcon : idolIcon} 
            alt="Golden Idol" 
            className={`golden-idol-icon ${isActionUpgraded('golden_idol') ? 'upgraded' : ''}`}
            style={{
              '--idol-glow-radius': `${Math.min(40, (goldenIdolBonus ?? 0) / 6)}px`,
              '--idol-glow-opacity': Math.min(1, 0.4 + (goldenIdolBonus ?? 0) / 200)
            } as React.CSSProperties}
          />
          <span className={`action-label ${isActionUpgraded('golden_idol') ? 'action-label-blue' : 'action-label-gold'}`}>
            {isActionUpgraded('golden_idol') ? 'Diamond Idol' : 'Golden Idol'}
          </span>
          {frozenActions.golden_idol && (
            <div className="action-frozen-overlay front">
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
              <div className="ice-particle" />
            </div>
          )}
        </div>
      </div>

      {madSeerPreviewTile && madSeerActive && (
        <MadSeerModal
          tile={madSeerPreviewTile}
          onAccept={handleMadSeerAccept}
          onReject={handleMadSeerReject}
          isUpgraded={isActionUpgraded('mad_seer')}
          wordsMin={runtimeConfig.mechanics.madSeer.wordsMin}
          wordsMax={runtimeConfig.mechanics.madSeer.wordsMax}
          wordsMinUpgraded={runtimeConfig.mechanics.madSeer.wordsMinUpgraded}
          wordsMaxUpgraded={runtimeConfig.mechanics.madSeer.wordsMaxUpgraded}
        />
      )}

      {bloodSacrificeActive && (
        <BloodSacrificeModal
          playerScore={players[activePlayerIndex]?.score ?? 0}
          onConfirm={handleBloodSacrificeConfirm}
          onCancel={handleBloodSacrificeCancel}
          isUpgraded={isActionUpgraded('blood_sacrifice')}
          maxSacrifice={runtimeConfig.mechanics.bloodSacrifice.maxSacrifice}
          maxSacrificeUpgraded={runtimeConfig.mechanics.bloodSacrifice.maxSacrificeUpgraded}
        />
      )}

      {bloodSacrificeTargetSelecting && (
        <PlayerSelectModal
          players={players}
          activePlayerIndex={activePlayerIndex}
          alliances={alliances}
          onSelect={handleBloodSacrificeTargetSelect}
          onCancel={handleBloodSacrificeCancel}
        />
      )}

      {revealedCards.length > 0 && (
        <CardRevealModal
          cards={revealedCards}
          onClose={() => setRevealedCards([])}
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

      {treasureSetActive && (
        <TreasureSetModal
          inventory={players[activePlayerIndex]?.inventory ?? []}
          onStartDig={(cardIds) => {
            setTreasureCardIds(cardIds)
            setTreasureSetActive(false)
            setTreasureIslandActive(true)
          }}
          onClose={() => setTreasureSetActive(false)}
        />
      )}

      {treasureIslandActive && (
        <TreasureIslandModal
          onComplete={(goldEarned) => {
            combineTreasureSet(activePlayerIndex, treasureCardIds, goldEarned)
            setTreasureIslandActive(false)
            setTreasureCardIds([])
          }}
          onCancel={() => {
            setTreasureIslandActive(false)
            setTreasureCardIds([])
          }}
        />
      )}

      {cardTargetSelecting && cardUsePending && (
        (cardTargetMode === 'neutral' || cardTargetMode === 'neutral_all') ? (
          <NeutralPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            alliances={alliances}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
            requireCards={cardTargetMode === 'neutral'}
          />
        ) : cardTargetMode === 'fel' ? (
          <FelPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            alliances={alliances}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        ) : cardTargetMode === 'puppet' ? (
          <PuppetMasterPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            alliances={alliances}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        ) : cardTargetMode === 'coalition' ? (
          <CoalitionPlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            alliances={alliances}
            onSelect={handleCardTargetSelect}
            onCancel={handleCardTargetCancel}
          />
        ) : (
          <PlayerSelectModal
            players={players}
            activePlayerIndex={activePlayerIndex}
            alliances={alliances}
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

      {rouletteActive && cardUsePending && (
        <RouletteModal
          playerScore={players[activePlayerIndex]?.score ?? 0}
          onConfirm={handleRouletteConfirm}
          onCancel={handleRouletteCancel}
        />
      )}

      {priceCrackerActive && cardUsePending && (
        <PriceCrackerModal
          activePlayer={players[activePlayerIndex]}
          activePlayerIndex={activePlayerIndex}
          players={players}
          card={cardUsePending}
          onUpdatePrizes={(prizes) => {
            updateCardState(activePlayerIndex, cardUsePending.instanceId, (state) => ({
              ...state,
              prizes,
            }))
          }}
          onConfirm={handlePriceCrackerConfirm}
          onCancel={handlePriceCrackerCancel}
        />
      )}

      {stolenCardReveal && (
        <StolenCardModal
          card={stolenCardReveal.card}
          fromPlayerName={stolenCardReveal.fromPlayerName}
          onClose={() => setStolenCardReveal(null)}
        />
      )}

      {scoreAdjustPlayerIndex !== null && (
        <ScoreAdjustModal
          player={players[scoreAdjustPlayerIndex]}
          onConfirm={(delta) => {
            adjustPlayerScore(scoreAdjustPlayerIndex, delta)
            setScoreAdjustPlayerIndex(null)
          }}
          onCancel={() => setScoreAdjustPlayerIndex(null)}
        />
      )}

      {spiderFeedingActive && (
        <SpiderFeedingModal
          spiderImage={SPIDERS[spiderIndex] || ''}
          spiderIndex={spiderIndex}
          inventory={players[activePlayerIndex].inventory}
          onFeedIsopod={handleSpiderFeedIsopod}
          onFeedSheep={handleSpiderFeedSheep}
          onClose={() => setSpiderFeedingActive(false)}
        />
      )}

      {actionUpgradeActive && (
        <ActionUpgradeModal
          playerUpgrades={players[activePlayerIndex]?.upgradedActions ?? {}}
          onUpgrade={handleUpgradeAction}
          onClose={() => {
            setActionUpgradeActive(false)
            setRemainingUpgrades(0)
          }}
          remainingUpgrades={remainingUpgrades}
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

      {showGameOver && (
        <GameOverScreen
          players={players}
          onViewStats={handleViewStats}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {showStats && (
        <StatsScreen
          players={players}
          gameMetrics={gameMetrics}
          gameEndTime={gameEndTime ?? Date.now()}
          onBack={handleBackFromStats}
        />
      )}

      {selectedQuest && (
        <QuestModal
          quest={selectedQuest}
          onClose={handleCloseQuestModal}
          onClaim={
            selectedQuest.status === 'completed' && selectedQuestPlayerIndex !== null
              ? handleClaimQuestReward
              : undefined
          }
        />
      )}
    </div>
  )
}
