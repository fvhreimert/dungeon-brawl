import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  PlayerConfig,
  Player,
  QAItem,
  Tile,
  GameStateSnapshot,
  GameStatEntry,
  TileModifiers,
  PlayerStats,
  ScoreChangeReason,
  CardInstance,
  PuppetLock,
  ActionId,
  FrozenActions,
  Alliance,
  Alliances,
  AllianceColor,
  UpgradeableAction,
  GameMetrics,
  PlayerMetrics,
  CardUsageEntry,
  TurnSnapshot,
  Quest,
  QuestId,
  PendingBlackMarket,
  ResumedGameState,
} from '@/types/game'
import { CARDS, type CardDefinition } from '@/data/cards'
import { gameConfig } from '@/config/gameConfig'
import { useRuntimeConfig } from '@/config/runtimeConfig'
import {
  runCardEffect,
} from '@/features/cards/cardEffectRegistry'
import {
  buildCardDrawContext,
  pickCardForPlayer,
} from '@/config/cardCatalog'
import { createQuestInstance } from '@/data/quests'

type UseJeopardyGameParams = {
  categories: readonly string[]
  pointValues: readonly number[]
  players: readonly PlayerConfig[]
  questionBank: QAItem[]
  onBlackMarketStart?: (playerIndex: number, playerName: string, cards: CardDefinition[]) => void
  onUndo?: (restoredBlackMarket: PendingBlackMarket | null) => void
  onTurnEnd?: (state: ResumedGameState) => void
  resumedState?: ResumedGameState
}

const createEmptyTurnTotals = () => ({
  total: 0,
  thisTurn: 0,
})

const createDefaultPlayerStats = (): PlayerStats => ({
  passivePointsGained: createEmptyTurnTotals(),
  pointsLostToQuestions: createEmptyTurnTotals(),
  pointsLostToActiveCards: createEmptyTurnTotals(),
  pointsLostToPassiveItems: createEmptyTurnTotals(),
  isSilenced: false,
  isPuppeteered: false,
  puppetLock: null,
})

const createCardInstance = (definition: CardDefinition): CardInstance => {
  const uid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `card-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    ...definition,
    instanceId: `${definition.id}-${uid}`,
    state: {},
  }
}

const buildPlayerWithStats = (config: PlayerConfig, startingRerolls: number): Player => {
  const basePlayer = {
    ...config,
    inventory: [...config.inventory],
    actionCounts: { ...config.actionCounts },
    rerollsRemaining: config.rerollsRemaining ?? startingRerolls,
  }

  // If player is named "TEST", give them 100 of every card
  if (config.name === 'TEST') {
    const testCards: CardInstance[] = []
    for (const cardDef of CARDS) {
      for (let i = 0; i < 100; i++) {
        testCards.push(createCardInstance(cardDef))
      }
    }
    basePlayer.inventory = [...testCards, ...basePlayer.inventory]
  }

  const stats = createDefaultPlayerStats()
  return { ...basePlayer, stats }
}

const addToTurnTotals = (totals: { total: number; thisTurn: number }, amount: number) => ({
  total: totals.total + amount,
  thisTurn: totals.thisTurn + amount,
})

const resetTurnTotals = (totals: { total: number; thisTurn: number }) => ({
  ...totals,
  thisTurn: 0,
})

const resetPlayerTurnStats = (stats: PlayerStats): PlayerStats => ({
  ...stats,
  passivePointsGained: resetTurnTotals(stats.passivePointsGained),
  pointsLostToQuestions: resetTurnTotals(stats.pointsLostToQuestions),
  pointsLostToActiveCards: resetTurnTotals(stats.pointsLostToActiveCards),
  pointsLostToPassiveItems: resetTurnTotals(stats.pointsLostToPassiveItems),
})

const createDefaultPlayerMetrics = (): PlayerMetrics => ({
  questionsAnswered: 0,
  questionsCorrect: 0,
  questionsWrong: 0,
  questionsPassed: 0,
  totalQuestionPointsGained: 0,
  totalQuestionPointsLost: 0,
  damageTaken: 0,
  damageDealt: 0,
  cardsUsed: 0,
  cardsReceived: 0,
  actionsUsed: {},
  isopodsFed: 0,
  sheepFed: 0,
  alliancesFormed: 0,
  timesPuppeteered: 0,
  tilesFrozen: 0,
  treasureSetsCompleted: 0,
  goldenIdolPointsGained: 0,
  passiveIncomeGained: 0,
  highestSingleGain: 0,
  biggestLoss: 0,
})

const createInitialGameMetrics = (playerCount: number): GameMetrics => ({
  turnSnapshots: [],
  cardUsage: [],
  playerMetrics: Array.from({ length: playerCount }, () => createDefaultPlayerMetrics()),
  gameStartTime: Date.now(),
  totalTurns: 0,
})

const updateStatsForScoreChange = (
  stats: PlayerStats,
  delta: number,
  reason: ScoreChangeReason,
): PlayerStats => {
  if (delta === 0) return stats

  const nextStats = { ...stats }
  if (reason === 'question' && delta < 0) {
    const lossAmount = Math.abs(delta)
    nextStats.pointsLostToQuestions = addToTurnTotals(nextStats.pointsLostToQuestions, lossAmount)
  }
  if (reason === 'activeCard' && delta < 0) {
    const lossAmount = Math.abs(delta)
    nextStats.pointsLostToActiveCards = addToTurnTotals(nextStats.pointsLostToActiveCards, lossAmount)
  }
  if (reason === 'passiveItem') {
    if (delta < 0) {
      const lossAmount = Math.abs(delta)
      nextStats.pointsLostToPassiveItems = addToTurnTotals(
        nextStats.pointsLostToPassiveItems,
        lossAmount,
      )
    } else {
      nextStats.passivePointsGained = addToTurnTotals(nextStats.passivePointsGained, delta)
    }
  }

  return nextStats
}

const ALLIANCE_COLORS: AllianceColor[] = ['red', 'yellow', 'green', 'blue']

export function useJeopardyGame({
  categories,
  pointValues,
  players: initialPlayers,
  questionBank,
  onBlackMarketStart,
  onUndo,
  onTurnEnd,
  resumedState,
}: UseJeopardyGameParams) {
  const runtimeConfig = useRuntimeConfig()
  const questionLookup = useMemo(() => {
    const map = new Map<string, QAItem>()
    questionBank.forEach((qa) => {
      map.set(`${qa.category}-${qa.value}`, qa)
    })
    return map
  }, [questionBank])

  const generatedTiles = useMemo<Tile[]>(
    () =>
      pointValues.flatMap((value) =>
        categories.map((category) => {
          const match = questionLookup.get(`${category}-${value}`)
          return {
            id: `${category}-${value}`,
            category,
            value,
            status: 'open' as const,
            multiplier: 1,
            modifiers: {},
            question:
              match?.question ??
              gameConfig.ui.labels.fallbackQuestion(category, value),
            answer: match?.answer ?? gameConfig.ui.labels.fallbackAnswer,
          }
        }),
      ),
    [categories, pointValues, questionLookup],
  )

  // Initialize state from resumedState if provided, otherwise use defaults
  const [tiles, setTiles] = useState<Tile[]>(resumedState?.tiles ?? generatedTiles)
  const [players, setPlayers] = useState<Player[]>(
    resumedState?.players ?? initialPlayers.map((player) => buildPlayerWithStats(player, runtimeConfig.mechanics.startingRerolls)),
  )
  const playersRef = useRef<Player[]>(players)
  useEffect(() => {
    playersRef.current = players
  }, [players])
  const applyScoreChangeRef = useRef<
    (targetIndex: number, delta: number, reason?: ScoreChangeReason) => void
  >(() => {})
  const [activePlayerIndex, setActivePlayerIndex] = useState(resumedState?.activePlayerIndex ?? 0)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [history, setHistory] = useState<GameStateSnapshot[]>(resumedState?.history ?? [])
  const [gameStats, setGameStats] = useState<GameStatEntry[]>(resumedState?.gameStats ?? [])
  const [puppetLocks, setPuppetLocks] = useState<Record<number, PuppetLock>>(resumedState?.puppetLocks ?? {})
  const [frozenActions, setFrozenActions] = useState<FrozenActions>(resumedState?.frozenActions ?? {})
  const [alliances, setAlliances] = useState<Alliances>(resumedState?.alliances ?? [])
  const [goldenIdolBonus, setGoldenIdolBonus] = useState<number>(resumedState?.goldenIdolBonus ?? runtimeConfig.mechanics.goldenIdol.startBonus)
  const [gameMetrics, setGameMetrics] = useState<GameMetrics>(
    resumedState?.gameMetrics ?? createInitialGameMetrics(initialPlayers.length)
  )
  const turnCountRef = useRef(resumedState?.turnCount ?? 0)
  const pendingBlackMarketRef = useRef<PendingBlackMarket | null>(null)
  const activePuppetLockCategory = puppetLocks[activePlayerIndex]?.category ?? null

  const selectedTile = selectedTileId
    ? tiles.find((tile) => tile.id === selectedTileId) ?? null
    : null

  // Metrics tracking helpers
  const incrementPlayerMetric = useCallback(
    (playerIndex: number, field: keyof PlayerMetrics, amount: number = 1) => {
      setGameMetrics((prev) => ({
        ...prev,
        playerMetrics: prev.playerMetrics.map((metrics, idx) =>
          idx === playerIndex
            ? { ...metrics, [field]: (metrics[field] as number) + amount }
            : metrics
        ),
      }))
    },
    []
  )

  const recordCardUsage = useCallback(
    (playerIndex: number, card: CardInstance, targetPlayerIndex?: number) => {
      const entry: CardUsageEntry = {
        turnNumber: turnCountRef.current,
        playerIndex,
        cardId: card.id,
        cardName: card.title,
        targetPlayerIndex,
        timestamp: Date.now(),
      }
      setGameMetrics((prev) => ({
        ...prev,
        cardUsage: [...prev.cardUsage, entry],
      }))
      incrementPlayerMetric(playerIndex, 'cardsUsed')
    },
    [incrementPlayerMetric]
  )

  const recordTurnSnapshot = useCallback(() => {
    const snapshot: TurnSnapshot = {
      turnNumber: turnCountRef.current,
      activePlayerIndex,
      playerScores: playersRef.current.map((p) => p.score),
      timestamp: Date.now(),
    }
    setGameMetrics((prev) => ({
      ...prev,
      turnSnapshots: [...prev.turnSnapshots, snapshot],
      totalTurns: turnCountRef.current,
    }))
  }, [activePlayerIndex])

  const recordActionUsage = useCallback(
    (playerIndex: number, actionId: ActionId) => {
      setGameMetrics((prev) => ({
        ...prev,
        playerMetrics: prev.playerMetrics.map((metrics, idx) => {
          if (idx !== playerIndex) return metrics
          const currentCount = metrics.actionsUsed[actionId] ?? 0
          return {
            ...metrics,
            actionsUsed: {
              ...metrics.actionsUsed,
              [actionId]: currentCount + 1,
            },
          }
        }),
      }))
    },
    []
  )

  const recordPointChange = useCallback(
    (playerIndex: number, delta: number) => {
      if (delta === 0) return
      setGameMetrics((prev) => ({
        ...prev,
        playerMetrics: prev.playerMetrics.map((metrics, idx) => {
          if (idx !== playerIndex) return metrics
          return {
            ...metrics,
            highestSingleGain: delta > 0 ? Math.max(metrics.highestSingleGain, delta) : metrics.highestSingleGain,
            biggestLoss: delta < 0 ? Math.max(metrics.biggestLoss, Math.abs(delta)) : metrics.biggestLoss,
          }
        }),
      }))
    },
    []
  )

  // Draw cards for the first player at the start of the game (Black Market)
  // If resuming with pending black market, restore it instead of drawing new cards
  const hasDrawnFirstTurnCardsRef = useRef(false)
  useEffect(() => {
    if (hasDrawnFirstTurnCardsRef.current || !onBlackMarketStart) return
    hasDrawnFirstTurnCardsRef.current = true

    // If resuming with a pending Black Market, restore it with the same cards
    if (resumedState?.pendingBlackMarket) {
      const { playerIndex, playerName, cards } = resumedState.pendingBlackMarket
      pendingBlackMarketRef.current = {
        playerIndex,
        playerName,
        cards: [...cards], // Copy the cards array
      }
      onBlackMarketStart(playerIndex, playerName, cards)
      return
    }

    const blackMarketConfig = runtimeConfig.mechanics.blackMarket
    if (!blackMarketConfig?.enabled) return

    const numCards = blackMarketConfig.cardsToShow ?? 3

    if (numCards > 0) {
      const drawnCards: CardDefinition[] = []

      for (let i = 0; i < numCards; i++) {
        const drawContext = buildCardDrawContext(players, activePlayerIndex)
        const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
        if (entry) {
          drawnCards.push(entry.definition)
        }
      }

      if (drawnCards.length > 0) {
        // Show the Black Market modal - cards will be added when player accepts
        const firstPlayerName = players[activePlayerIndex]?.name ?? ''
        // Store pending Black Market for undo support
        pendingBlackMarketRef.current = {
          playerIndex: activePlayerIndex,
          playerName: firstPlayerName,
          cards: drawnCards,
        }
        onBlackMarketStart(activePlayerIndex, firstPlayerName, drawnCards)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveSnapshot = useCallback(() => {
    // IMPORTANT: Capture pendingBlackMarket IMMEDIATELY (synchronously) before the async setHistory runs
    // Otherwise, the ref might be modified before the callback executes
    const capturedPendingBlackMarket = pendingBlackMarketRef.current
      ? {
          ...pendingBlackMarketRef.current,
          cards: [...pendingBlackMarketRef.current.cards], // Deep copy the cards array
        }
      : null
    const capturedTurnCounter = turnCountRef.current

    setHistory((prev) => {
      const newHistory = [
        ...prev,
        {
          tiles: [...tiles],
          players: [...players],
          activePlayerIndex,
          puppetLocks: { ...puppetLocks },
          frozenActions: { ...frozenActions },
          alliances: [...alliances],
          goldenIdolBonus,
          // New fields for comprehensive undo
          turnCounter: capturedTurnCounter,
          selectedTileId,
          answerRevealed,
          pendingBlackMarket: capturedPendingBlackMarket,
        },
      ]
      return newHistory.slice(-10) // Increased from 5 to 10 for more undo history
    })
  }, [tiles, players, activePlayerIndex, puppetLocks, frozenActions, alliances, goldenIdolBonus, selectedTileId, answerRevealed])

  const updatePlayerStats = useCallback(
    (targetIndex: number, updater: (stats: PlayerStats) => PlayerStats) => {
      setPlayers((prev) =>
        prev.map((player, index) =>
          index === targetIndex ? { ...player, stats: updater(player.stats) } : player,
        ),
      )
    },
    [setPlayers],
  )

  const setPuppetLockForPlayer = useCallback(
    (targetIndex: number, lock: PuppetLock | null) => {
      setPuppetLocks((prev) => {
        if (lock) {
          return {
            ...prev,
            [targetIndex]: lock,
          }
        }
        if (!(targetIndex in prev)) return prev
        const next = { ...prev }
        delete next[targetIndex]
        return next
      })
      // Track when a player gets puppeteered
      if (lock) {
        incrementPlayerMetric(targetIndex, 'timesPuppeteered')
      }
    },
    [incrementPlayerMetric],
  )

  const clearPuppetLock = useCallback(
    (targetIndex: number) => {
      updatePlayerStats(targetIndex, (stats) => {
        if (!stats.isPuppeteered && !stats.puppetLock) return stats
        return {
          ...stats,
          isPuppeteered: false,
          puppetLock: null,
        }
      })
      setPuppetLockForPlayer(targetIndex, null)
    },
    [updatePlayerStats, setPuppetLockForPlayer],
  )

  const updateCardState = useCallback(
    (
      playerIndex: number,
      cardInstanceId: string,
      updater: (state: Record<string, unknown>) => Record<string, unknown>,
    ) => {
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== playerIndex) return player
          const inventory = player.inventory.map((card) =>
            card.instanceId === cardInstanceId
              ? { ...card, state: updater(card.state ?? {}) }
              : card,
          )
          return { ...player, inventory }
        }),
      )
    },
    [setPlayers],
  )
  const transferCardBetweenPlayers = useCallback(
    (fromIndex: number, toIndex: number, cardInstanceId: string) => {
      const fromPlayer = playersRef.current[fromIndex]
      const toPlayer = playersRef.current[toIndex]
      if (!fromPlayer || !toPlayer) return null
      const card = fromPlayer.inventory.find((entry) => entry.instanceId === cardInstanceId)
      if (!card) return null
      const fromInventory = fromPlayer.inventory.filter(
        (entry) => entry.instanceId !== cardInstanceId,
      )
      const toInventory = [card, ...toPlayer.inventory]
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index === fromIndex) {
            const updated = {
              ...player,
              inventory: fromInventory,
            }
            return updated
          }
          if (index === toIndex) {
            const updated = {
              ...player,
              inventory: toInventory,
            }
            return updated
          }
          return player
        }),
      )
      return card
    },
    [setPlayers],
  )
  const removeCardFromInventory = useCallback(
    (playerIndex: number, cardInstanceId: string) => {
      let removedCard: CardInstance | null = null
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== playerIndex) return player
          const inventory = player.inventory.filter((card) => {
            const shouldRemove = card.instanceId === cardInstanceId
            if (shouldRemove) {
              removedCard = card
            }
            return !shouldRemove
          })
          return {
            ...player,
            inventory,
          }
        }),
      )
      return removedCard
    },
    [setPlayers],
  )

  const applyScoreChange = useCallback(
    (targetIndex: number, delta: number, reason: ScoreChangeReason = 'other') => {
      if (delta === 0 && reason === 'other') return
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== targetIndex) return player
          const nextScore = player.score + delta
          const updatedStats = updateStatsForScoreChange(player.stats, delta, reason)
          const updatedPlayer = {
            ...player,
            score: nextScore,
          }
          return {
            ...updatedPlayer,
            stats: updatedStats,
          }
        }),
      )

      // Track high/low point changes
      recordPointChange(targetIndex, delta)

      // Track passive income
      if (delta > 0 && reason === 'passiveItem') {
        incrementPlayerMetric(targetIndex, 'passiveIncomeGained', delta)
      }

      // Track damage metrics for non-question damage
      if (delta < 0 && reason !== 'question') {
        const damageAmount = Math.abs(delta)
        incrementPlayerMetric(targetIndex, 'damageTaken', damageAmount)
        // If the active player dealt damage to someone else, track damageDealt
        if (targetIndex !== activePlayerIndex) {
          incrementPlayerMetric(activePlayerIndex, 'damageDealt', damageAmount)
        }

        const inventory = playersRef.current[targetIndex]?.inventory ?? []
        inventory.forEach((card) =>
          runCardEffect(
            'damageTaken',
            card,
            {
              players: playersRef.current,
              ownerPlayerIndex: targetIndex,
              activePlayerIndex,
              cardWeights: runtimeConfig.mechanics.cardWeights,
              applyScoreChange: applyScoreChangeRef.current,
              updatePlayerStats,
              updateCardState,
              transferCardBetweenPlayers,
              removeCardFromInventory,
              setPuppetLockForPlayer,
            },
            { damage: damageAmount, reason },
          ),
        )
      }
    },
    [
      activePlayerIndex,
      updatePlayerStats,
      updateCardState,
      transferCardBetweenPlayers,
      removeCardFromInventory,
      setPuppetLockForPlayer,
      incrementPlayerMetric,
      recordPointChange,
      runtimeConfig.mechanics.cardWeights,
    ],
  )

  useEffect(() => {
    applyScoreChangeRef.current = applyScoreChange
  }, [applyScoreChange])

  useEffect(() => {
    const puppetLock = puppetLocks[activePlayerIndex]
    if (!puppetLock) return
    const hasAvailableTiles = tiles.some(
      (tile) => tile.status === 'open' && tile.category === puppetLock.category,
    )
    if (!hasAvailableTiles) {
      setTimeout(() => clearPuppetLock(activePlayerIndex), 0)
    }
  }, [activePlayerIndex, tiles, clearPuppetLock, puppetLocks])

  const recordStat = (
    result: 'correct' | 'wrong' | 'pass',
    scoreChange: number,
  ) => {
    if (!selectedTile) return
    const currentPlayer = players[activePlayerIndex]

    setGameStats((prev) => [
      ...prev,
      {
        turnNumber: prev.length + 1,
        playerId: currentPlayer.name,
        playerName: currentPlayer.name,
        tileId: selectedTile.id,
        tileValue: selectedTile.value,
        result,
        scoreChange,
        timestamp: Date.now(),
      },
    ])

    // Track question metrics
    incrementPlayerMetric(activePlayerIndex, 'questionsAnswered')
    if (result === 'correct') {
      incrementPlayerMetric(activePlayerIndex, 'questionsCorrect')
      if (scoreChange > 0) {
        incrementPlayerMetric(activePlayerIndex, 'totalQuestionPointsGained', scoreChange)
      }
    } else if (result === 'wrong') {
      incrementPlayerMetric(activePlayerIndex, 'questionsWrong')
      if (scoreChange < 0) {
        incrementPlayerMetric(activePlayerIndex, 'totalQuestionPointsLost', Math.abs(scoreChange))
      }
    } else {
      incrementPlayerMetric(activePlayerIndex, 'questionsPassed')
    }
  }

  const handleTileClick = (tileId: string) => {
    const tile = tiles.find((t) => t.id === tileId)
    if (!tile || tile.status === 'done' || selectedTileId) return

    const activePlayer = players[activePlayerIndex]
    const puppetLock = puppetLocks[activePlayerIndex] ?? activePlayer?.stats.puppetLock
    if (puppetLock) {
      const hasAvailableTiles = tiles.some(
        (entry) => entry.status === 'open' && entry.category === puppetLock.category,
      )
      if (!hasAvailableTiles) {
        clearPuppetLock(activePlayerIndex)
      } else if (tile.category !== puppetLock.category) {
        return
      } else {
        clearPuppetLock(activePlayerIndex)
      }
    }

    setSelectedTileId(tileId)
    setAnswerRevealed(false)
  }

  const handleRevealAnswer = () => setAnswerRevealed(true)

  const getNextPlayerIndex = () => (activePlayerIndex + 1) % players.length

  const prepareNextPlayer = () => {
    // Record turn snapshot before changing player
    turnCountRef.current += 1
    recordTurnSnapshot()

    const nextIndex = getNextPlayerIndex()

    // Draw free cards for the next player (Black Market)
    const blackMarketConfig = runtimeConfig.mechanics.blackMarket
    const numCards = blackMarketConfig?.cardsToShow ?? 3

    if (blackMarketConfig?.enabled && numCards > 0 && onBlackMarketStart) {
      const drawnCards: CardDefinition[] = []
      for (let i = 0; i < numCards; i++) {
        const drawContext = buildCardDrawContext(players, nextIndex)
        const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
        if (entry) {
          drawnCards.push(entry.definition)
        }
      }

      // Call onBlackMarketStart with the next player's info and cards
      const nextPlayerName = players[nextIndex]?.name ?? ''
      if (drawnCards.length > 0) {
        // Store pending Black Market for undo support
        pendingBlackMarketRef.current = {
          playerIndex: nextIndex,
          playerName: nextPlayerName,
          cards: drawnCards,
        }
        onBlackMarketStart(nextIndex, nextPlayerName, drawnCards)
      }
    } else {
      // Clear pending Black Market if disabled
      pendingBlackMarketRef.current = null
    }

    setPlayers((prev) =>
      prev.map((player, index) =>
        index === nextIndex
          ? {
              ...player,
              stats: resetPlayerTurnStats(player.stats),
              actionCounts: {} // Reset action counts for the new turn
            }
          : player,
      ),
    )
    setActivePlayerIndex(nextIndex)
    setSelectedTileId(null)
    setAnswerRevealed(false)
    setGoldenIdolBonus((prev) => {
      const min = runtimeConfig.mechanics.goldenIdol.pointsMin
      const max = runtimeConfig.mechanics.goldenIdol.pointsMax
      const range = max - min
      const increment = min + Math.floor(Math.random() * (range + 1))
      return prev + increment
    })
  }

  const handleAnswer = (correct: boolean) => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    const effectiveValue = selectedTile.value * (selectedTile.multiplier ?? 1)

    // Apply spider sense bonus for correct answers
    let scoreChange: number
    if (correct) {
      const spiderSenseLevel = players[activePlayerIndex].spiderSenseLevel ?? 0
      const bonusMultiplier = 1 + (spiderSenseLevel * runtimeConfig.mechanics.spiderSense.bonusPerLevel)
      scoreChange = Math.round(effectiveValue * bonusMultiplier)
    } else {
      const penaltyPercent = runtimeConfig.gameplay.wrongAnswerPenaltyPercent / 100
      scoreChange = penaltyPercent > 0 ? -Math.round(effectiveValue * penaltyPercent) : 0
    }

    recordStat(correct ? 'correct' : 'wrong', scoreChange)

    // Check if this is the last open tile before marking it done
    const openTilesRemaining = tiles.filter((t) => t.status === 'open' && t.id !== selectedTile.id).length
    const isLastQuestion = openTilesRemaining === 0

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done', modifiers: {} } : tile,
      ),
    )

    applyScoreChange(activePlayerIndex, scoreChange, 'question')

    // Track wisdom quest progress
    if (correct) {
      updateQuestProgress(activePlayerIndex, 'wisdom_quest', 1)
    } else {
      resetQuestProgress(activePlayerIndex, 'wisdom_quest')
    }

    clearPuppetLock(activePlayerIndex)

    // Don't transition to next player if game is over
    if (!isLastQuestion) {
      prepareNextPlayer()
    }
  }

  const handlePass = () => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    recordStat('pass', 0)

    // Check if this is the last open tile before marking it done
    const openTilesRemaining = tiles.filter((t) => t.status === 'open' && t.id !== selectedTile.id).length
    const isLastQuestion = openTilesRemaining === 0

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done', modifiers: {} } : tile,
      ),
    )

    clearPuppetLock(activePlayerIndex)

    // Don't transition to next player if game is over
    if (!isLastQuestion) {
      prepareNextPlayer()
    }
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]

    // Restore core game state
    setTiles(previousState.tiles)
    setPlayers(previousState.players)
    setActivePlayerIndex(previousState.activePlayerIndex)
    setPuppetLocks(previousState.puppetLocks)
    setFrozenActions(previousState.frozenActions ?? {})
    setAlliances(previousState.alliances ?? [])
    setGoldenIdolBonus(previousState.goldenIdolBonus ?? runtimeConfig.mechanics.goldenIdol.startBonus)

    // Restore new comprehensive undo fields
    if (previousState.turnCounter !== undefined) {
      turnCountRef.current = previousState.turnCounter
    }
    setSelectedTileId(previousState.selectedTileId ?? null)
    setAnswerRevealed(previousState.answerRevealed ?? false)

    // Restore pending Black Market state
    const restoredBlackMarket = previousState.pendingBlackMarket ?? null
    pendingBlackMarketRef.current = restoredBlackMarket

    setHistory((prev) => prev.slice(0, -1))
    setGameStats((prev) => prev.slice(0, -1))

    // Notify Game.tsx about the undo so it can handle Black Market modal state
    if (onUndo) {
      onUndo(restoredBlackMarket)
    }
  }

  const handleCloseDialog = () => {
    if (answerRevealed) return
    setAnswerRevealed(false)
    setSelectedTileId(null)
  }

  const applyTileMultiplier = (tileId: string, multiplier: number) => {
    setTiles((prev) =>
      prev.map((tile) => {
        if (tile.id !== tileId || tile.status === 'done') return tile
        const current = tile.multiplier ?? 1
        const capped = Math.min(current * multiplier, gameConfig.mechanics.multipliers.maxTileMultiplier)
        return { ...tile, multiplier: capped }
      }),
    )
  }

  const updateTileModifiers = (tileId: string, modifiers: Partial<TileModifiers>) => {
    setTiles((prev) =>
      prev.map((tile) => {
        if (tile.id !== tileId) return tile
        return {
          ...tile,
          modifiers: {
            ...tile.modifiers,
            ...modifiers,
          },
        }
      }),
    )
  }

  const freezeTile = useCallback(
    (tileId: string, frozenByPlayerIndex: number, frozenByCardInstanceId: string) => {
      saveSnapshot()
      setTiles((prev) =>
        prev.map((tile) => {
          if (tile.id !== tileId || tile.status !== 'open') return tile
          return {
            ...tile,
            modifiers: {
              ...tile.modifiers,
              frozen: {
                frozenByPlayerIndex,
                frozenByCardInstanceId,
              },
            },
          }
        }),
      )
      incrementPlayerMetric(frozenByPlayerIndex, 'tilesFrozen')
    },
    [saveSnapshot, incrementPlayerMetric],
  )

  const unfreezeTilesForPlayer = useCallback((playerIndex: number) => {
    setTiles((prev) =>
      prev.map((tile) => {
        if (!tile.modifiers?.frozen) return tile
        if (tile.modifiers.frozen.frozenByPlayerIndex !== playerIndex) return tile
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { frozen: _, ...restModifiers } = tile.modifiers
        return {
          ...tile,
          modifiers: restModifiers,
        }
      }),
    )
  }, [])

  const freezeAction = useCallback(
    (actionId: ActionId, frozenByPlayerIndex: number, frozenByCardInstanceId: string) => {
      saveSnapshot()
      setFrozenActions((prev) => ({
        ...prev,
        [actionId]: {
          frozenByPlayerIndex,
          frozenByCardInstanceId,
        },
      }))
    },
    [saveSnapshot],
  )

  const unfreezeActionsForPlayer = useCallback((playerIndex: number) => {
    setFrozenActions((prev) => {
      const next: FrozenActions = {}
      for (const [actionId, info] of Object.entries(prev)) {
        if (info && info.frozenByPlayerIndex !== playerIndex) {
          next[actionId as ActionId] = info
        }
      }
      return next
    })
  }, [])

  const getNextAllianceColor = useCallback((): AllianceColor => {
    const usedColors = new Set(alliances.map((a) => a.color))
    for (const color of ALLIANCE_COLORS) {
      if (!usedColors.has(color)) return color
    }
    return 'red'
  }, [alliances])

  const createAlliance = useCallback(
    (initiatorIndex: number, targetIndex: number, cardInstanceId: string) => {
      const allianceDuration = players.length * runtimeConfig.mechanics.alliances.baseDurationMultiplier
      const color = getNextAllianceColor()
      const newAlliance: Alliance = {
        id: `alliance-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        color,
        playerIndices: [initiatorIndex, targetIndex],
        turnsRemaining: allianceDuration,
        sourceCardInstanceId: cardInstanceId,
      }
      setAlliances((prev) => [...prev, newAlliance])
      incrementPlayerMetric(initiatorIndex, 'alliancesFormed')
      return newAlliance
    },
    [players.length, getNextAllianceColor, runtimeConfig.mechanics.alliances.baseDurationMultiplier, incrementPlayerMetric],
  )

  const tickDownAlliances = useCallback(() => {
    setAlliances((prev) => {
      const updated = prev
        .map((alliance) => ({
          ...alliance,
          turnsRemaining: alliance.turnsRemaining - 1,
        }))
        .filter((alliance) => alliance.turnsRemaining > 0)
      return updated
    })
  }, [])

  const arePlayersAllied = useCallback(
    (playerIndex1: number, playerIndex2: number): boolean => {
      return alliances.some(
        (alliance) =>
          alliance.playerIndices.includes(playerIndex1) &&
          alliance.playerIndices.includes(playerIndex2),
      )
    },
    [alliances],
  )

  const getPlayerAlliance = useCallback(
    (playerIndex: number): Alliance | null => {
      return alliances.find((alliance) => alliance.playerIndices.includes(playerIndex)) ?? null
    },
    [alliances],
  )

  const performBloodSacrifice = (amount: number, targetPlayerIndex: number) => {
    saveSnapshot()
    applyScoreChange(activePlayerIndex, -amount, 'activeCard')
    applyScoreChange(targetPlayerIndex, -amount, 'activeCard')

    // Track Blood Quest progress for the active player
    const player = playersRef.current[activePlayerIndex]
    const bloodQuest = player?.quests?.find(
      (q) => q.questId === 'blood_quest' && q.status === 'active',
    )
    if (bloodQuest) {
      updateQuestProgress(activePlayerIndex, 'blood_quest', amount)
    }
  }

  // Quest management functions
  const grantQuest = useCallback(
    (playerIndex: number, questId: QuestId, sourceCardInstanceId: string): Quest => {
      const quest = createQuestInstance(questId, sourceCardInstanceId)
      setPlayers((prev) =>
        prev.map((player, idx) => {
          if (idx !== playerIndex) return player
          const currentQuests = player.quests ?? []
          return {
            ...player,
            quests: [...currentQuests, quest],
          }
        }),
      )
      return quest
    },
    [],
  )

  const updateQuestProgress = useCallback(
    (playerIndex: number, questId: QuestId, progressDelta: number) => {
      setPlayers((prev) =>
        prev.map((player, idx) => {
          if (idx !== playerIndex) return player
          const quests =
            player.quests?.map((quest) => {
              if (quest.questId !== questId || quest.status !== 'active') return quest

              const newProgress = Math.min(
                quest.progress.current + progressDelta,
                quest.progress.target,
              )
              const isComplete = newProgress >= quest.progress.target

              return {
                ...quest,
                progress: { ...quest.progress, current: newProgress },
                status: isComplete ? ('completed' as const) : ('active' as const),
              }
            }) ?? []

          return { ...player, quests }
        }),
      )
    },
    [],
  )

  const resetQuestProgress = useCallback(
    (playerIndex: number, questId: QuestId) => {
      setPlayers((prev) =>
        prev.map((player, idx) => {
          if (idx !== playerIndex) return player
          const quests =
            player.quests?.map((quest) => {
              if (quest.questId !== questId || quest.status !== 'active') return quest
              return {
                ...quest,
                progress: { ...quest.progress, current: 0 },
              }
            }) ?? []

          return { ...player, quests }
        }),
      )
    },
    [],
  )

  const claimQuestReward = useCallback(
    (playerIndex: number, questInstanceId: string): CardDefinition[] | null => {
      const player = playersRef.current[playerIndex]
      const quest = player?.quests?.find((q) => q.id === questInstanceId)

      if (!quest || quest.status !== 'completed') return null

      const rewardedCards: CardDefinition[] = []

      // Award cards
      if (quest.reward.type === 'cards') {
        // Check if we should give specific cards
        if (quest.reward.specificCardId) {
          const specificCard = CARDS.find((c) => c.id === quest.reward.specificCardId)
          if (specificCard) {
            for (let i = 0; i < quest.reward.amount; i++) {
              rewardedCards.push(specificCard)
              const cardInstance = createCardInstance(specificCard)
              setPlayers((prev) =>
                prev.map((p, idx) => {
                  if (idx !== playerIndex) return p
                  return {
                    ...p,
                    inventory: [cardInstance, ...p.inventory],
                  }
                }),
              )
            }
          }
        } else {
          // Draw random cards
          const drawContext = buildCardDrawContext(playersRef.current, playerIndex)
          for (let i = 0; i < quest.reward.amount; i++) {
            const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
            if (entry) {
              rewardedCards.push(entry.definition)
              const cardInstance = createCardInstance(entry.definition)
              setPlayers((prev) =>
                prev.map((p, idx) => {
                  if (idx !== playerIndex) return p
                  return {
                    ...p,
                    inventory: [cardInstance, ...p.inventory],
                  }
                }),
              )
            }
          }
        }
      } else if (quest.reward.type === 'points') {
        applyScoreChange(playerIndex, quest.reward.amount, 'activeCard')
      }

      // Award action upgrade if present
      if (quest.reward.upgradeAction) {
        setPlayers((prev) =>
          prev.map((p, idx) => {
            if (idx !== playerIndex) return p
            return {
              ...p,
              upgradedActions: {
                ...p.upgradedActions,
                [quest.reward.upgradeAction!]: true,
              },
            }
          }),
        )
      }

      // Award bonus points if present
      if (quest.reward.bonusPoints && quest.reward.bonusPoints > 0) {
        applyScoreChange(playerIndex, quest.reward.bonusPoints, 'activeCard')
      }

      // Award bonus cards if present
      if (quest.reward.bonusCards && quest.reward.bonusCards > 0) {
        const drawContext = buildCardDrawContext(playersRef.current, playerIndex)
        for (let i = 0; i < quest.reward.bonusCards; i++) {
          const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
          if (entry) {
            rewardedCards.push(entry.definition)
            const cardInstance = createCardInstance(entry.definition)
            setPlayers((prev) =>
              prev.map((p, idx) => {
                if (idx !== playerIndex) return p
                return {
                  ...p,
                  inventory: [cardInstance, ...p.inventory],
                }
              }),
            )
          }
        }
      }

      // Remove quest from player
      setPlayers((prev) =>
        prev.map((p, idx) => {
          if (idx !== playerIndex) return p
          return {
            ...p,
            quests: p.quests?.filter((q) => q.id !== questInstanceId) ?? [],
          }
        }),
      )

      return rewardedCards.length > 0 ? rewardedCards : null
    },
    [applyScoreChange, runtimeConfig.mechanics.cardWeights],
  )

  const addCardToInventory = (card: CardDefinition, targetPlayerIndex?: number) => {
    saveSnapshot()
    const playerIndex = targetPlayerIndex ?? activePlayerIndex
    const cardInstance = createCardInstance(card)
    if (cardInstance.id === 'cursed_coin') {
      cardInstance.state = { turnsRemaining: runtimeConfig.mechanics.items.cursedCoin.durationTurns }
      applyScoreChange(playerIndex, runtimeConfig.mechanics.items.cursedCoin.value, 'passiveItem')
    }
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== playerIndex) return player
        const inventory = [cardInstance, ...player.inventory]
        return {
          ...player,
          inventory,
        }
      }),
    )
  }

  const combineTreasureSet = (playerIndex: number, cardInstanceIds: string[], goldEarned: number) => {
    saveSnapshot()
    // Remove all the treasure cards
    cardInstanceIds.forEach((instanceId) => {
      removeCardFromInventory(playerIndex, instanceId)
    })
    // Award the treasure reward (variable based on mini-game)
    if (goldEarned > 0) {
      applyScoreChange(playerIndex, goldEarned, 'activeCard')
    }
    incrementPlayerMetric(playerIndex, 'treasureSetsCompleted')
  }

  const activateCard = (
    cardInstanceId: string,
    targetPlayerIndex: number,
    metadata?: Record<string, unknown>,
  ) => {
    const ownerIndex = activePlayerIndex
    const card = playersRef.current[ownerIndex]?.inventory.find(
      (entry) => entry.instanceId === cardInstanceId,
    )
    if (!card) return
    saveSnapshot()

    // Track card usage
    recordCardUsage(ownerIndex, card, targetPlayerIndex !== ownerIndex ? targetPlayerIndex : undefined)

    const result = runCardEffect(
      'activated',
      card,
      {
        players: playersRef.current,
        ownerPlayerIndex: ownerIndex,
        activePlayerIndex,
        cardWeights: runtimeConfig.mechanics.cardWeights,
        applyScoreChange: applyScoreChangeRef.current,
        updatePlayerStats,
        updateCardState,
        transferCardBetweenPlayers,
        removeCardFromInventory,
        setPuppetLockForPlayer,
      },
      { targetIndex: targetPlayerIndex, metadata },
    )
    if (card.consumesOnActivate) {
      removeCardFromInventory(ownerIndex, card.instanceId)
    }
    return result
  }

  const runTurnStartEffects = useCallback(
    (playerIndex: number) => {
      const player = playersRef.current[playerIndex]
      if (!player) return
      player.inventory.forEach((card) =>
        runCardEffect(
          'turnStart',
          card,
          {
            players: playersRef.current,
            ownerPlayerIndex: playerIndex,
            activePlayerIndex,
            cardWeights: runtimeConfig.mechanics.cardWeights,
            applyScoreChange: applyScoreChangeRef.current,
            updatePlayerStats,
            updateCardState,
            transferCardBetweenPlayers,
            removeCardFromInventory,
            setPuppetLockForPlayer,
          },
          {},
        ),
      )
    },
    [
      activePlayerIndex,
      updatePlayerStats,
      updateCardState,
      transferCardBetweenPlayers,
      removeCardFromInventory,
      setPuppetLockForPlayer,
      runtimeConfig.mechanics.cardWeights,
    ],
  )

  const runGlobalTurnEffects = useCallback(() => {
    const priorityOrder: Record<string, number> = {
      tick: 0,
    }

    playersRef.current.forEach((player, playerIndex) => {
      const sortedInventory = [...player.inventory].sort(
        (a, b) => (priorityOrder[a.id] ?? 1) - (priorityOrder[b.id] ?? 1),
      )
      sortedInventory.forEach((card) =>
        runCardEffect(
          'turnAdvanced',
          card,
          {
            players: playersRef.current,
            ownerPlayerIndex: playerIndex,
            activePlayerIndex,
            cardWeights: runtimeConfig.mechanics.cardWeights,
            applyScoreChange: applyScoreChangeRef.current,
            updatePlayerStats,
            updateCardState,
            transferCardBetweenPlayers,
            removeCardFromInventory,
            setPuppetLockForPlayer,
          },
          {},
        ),
      )
    })
  }, [
    activePlayerIndex,
    updatePlayerStats,
    updateCardState,
    transferCardBetweenPlayers,
    removeCardFromInventory,
    setPuppetLockForPlayer,
    runtimeConfig.mechanics.cardWeights,
  ])

  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    // Unfreeze tiles and actions that this player froze (their turn has come back around)
    setTimeout(() => {
        unfreezeTilesForPlayer(activePlayerIndex)
        unfreezeActionsForPlayer(activePlayerIndex)
        // Tick down alliance timers
        tickDownAlliances()
    }, 0)
    runGlobalTurnEffects()
    runTurnStartEffects(activePlayerIndex)
  }, [activePlayerIndex, runTurnStartEffects, runGlobalTurnEffects, unfreezeTilesForPlayer, unfreezeActionsForPlayer, tickDownAlliances])

  const setActivePlayer = useCallback((playerIndex: number) => {
    if (playerIndex >= 0 && playerIndex < players.length) {
      saveSnapshot()

      // Record turn snapshot before changing player
      turnCountRef.current += 1
      recordTurnSnapshot()

      // Draw free cards for the new player (Black Market)
      const blackMarketConfig = runtimeConfig.mechanics.blackMarket
      const numCards = blackMarketConfig?.cardsToShow ?? 3

      if (blackMarketConfig?.enabled && numCards > 0 && onBlackMarketStart) {
        const drawnCards: CardDefinition[] = []
        for (let i = 0; i < numCards; i++) {
          const drawContext = buildCardDrawContext(players, playerIndex)
          const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
          if (entry) {
            drawnCards.push(entry.definition)
          }
        }

        // Call onBlackMarketStart with the new player's info and cards
        const newPlayerName = players[playerIndex]?.name ?? ''
        if (drawnCards.length > 0) {
          onBlackMarketStart(playerIndex, newPlayerName, drawnCards)
        }
      }

      // Manually setting active player implies starting a new turn for them
      setPlayers((prev) =>
        prev.map((player, index) =>
          index === playerIndex
            ? {
                ...player,
                stats: resetPlayerTurnStats(player.stats),
                actionCounts: {}
              }
            : player,
        ),
      )
      setActivePlayerIndex(playerIndex)
      setSelectedTileId(null)
      setAnswerRevealed(false)
      setGoldenIdolBonus((prev) => {
        // Increment Idol bonus on manual turn switch as well
        const min = runtimeConfig.mechanics.goldenIdol.pointsMin
        const max = runtimeConfig.mechanics.goldenIdol.pointsMax
        const range = max - min
        const increment = min + Math.floor(Math.random() * (range + 1))
        return prev + increment
      })
    }
  }, [saveSnapshot, runtimeConfig.mechanics.blackMarket, runtimeConfig.mechanics.goldenIdol, runtimeConfig.mechanics.cardWeights, onBlackMarketStart, players, recordTurnSnapshot])

  const adjustPlayerScore = useCallback((playerIndex: number, delta: number) => {
    if (playerIndex >= 0 && playerIndex < players.length) {
      saveSnapshot()
      applyScoreChange(playerIndex, delta, 'other')
    }
  }, [players.length, applyScoreChange, saveSnapshot])

  const increaseSpiderSense = useCallback((playerIndex: number) => {
    if (playerIndex >= 0 && playerIndex < players.length) {
      saveSnapshot()
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== playerIndex) return player
          const currentLevel = player.spiderSenseLevel ?? 0
          if (currentLevel >= runtimeConfig.mechanics.spiderSense.maxLevel) return player
          return {
            ...player,
            spiderSenseLevel: currentLevel + 1,
          }
        })
      )
    }
  }, [players.length, saveSnapshot, runtimeConfig.mechanics.spiderSense.maxLevel])

  const addRerolls = useCallback((playerIndex: number, amount: number) => {
    if (playerIndex >= 0 && playerIndex < players.length && amount > 0) {
      saveSnapshot()
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== playerIndex) return player
          return {
            ...player,
            rerollsRemaining: (player.rerollsRemaining ?? 0) + amount,
          }
        })
      )
    }
  }, [players.length, saveSnapshot])

  const upgradeAction = useCallback((playerIndex: number, actionId: UpgradeableAction) => {
    if (playerIndex >= 0 && playerIndex < players.length) {
      saveSnapshot()
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== playerIndex) return player
          return {
            ...player,
            upgradedActions: {
              ...player.upgradedActions,
              [actionId]: true,
            },
          }
        })
      )
    }
  }, [players.length, saveSnapshot])

  const incrementActionCount = useCallback((playerIndex: number, actionId: ActionId) => {
    if (playerIndex >= 0 && playerIndex < players.length) {
      saveSnapshot()
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== playerIndex) return player
          const currentCount = player.actionCounts?.[actionId] ?? 0
          return {
            ...player,
            actionCounts: {
              ...player.actionCounts,
              [actionId]: currentCount + 1,
            },
          }
        })
      )
    }
  }, [players.length, saveSnapshot])

  // Black Market functions
  const acceptBlackMarketCards = useCallback((cards: CardDefinition[]) => {
    const cardInstances = cards.map(card => createCardInstance(card))

    setPlayers((prev) =>
      prev.map((player, index) =>
        index === activePlayerIndex
          ? { ...player, inventory: [...player.inventory, ...cardInstances] }
          : player,
      ),
    )

    // Track cards received
    if (cards.length > 0) {
      incrementPlayerMetric(activePlayerIndex, 'cardsReceived', cards.length)
    }

    // Clear pending Black Market after cards are accepted
    pendingBlackMarketRef.current = null
  }, [activePlayerIndex, incrementPlayerMetric])

  // Get serializable state for saving
  const getSerializableState = useCallback((): ResumedGameState => {
    return {
      tiles,
      players,
      activePlayerIndex,
      puppetLocks,
      frozenActions,
      alliances,
      goldenIdolBonus,
      gameMetrics,
      gameStats,
      history,
      turnCount: turnCountRef.current,
      pendingBlackMarket: pendingBlackMarketRef.current,
    }
  }, [tiles, players, activePlayerIndex, puppetLocks, frozenActions, alliances, goldenIdolBonus, gameMetrics, gameStats, history])

  // Track turn changes for auto-save
  const prevTurnCountRef = useRef(turnCountRef.current)
  useEffect(() => {
    const currentTurnCount = turnCountRef.current
    if (currentTurnCount > prevTurnCountRef.current && onTurnEnd) {
      prevTurnCountRef.current = currentTurnCount
      onTurnEnd(getSerializableState())
    }
  }, [activePlayerIndex, onTurnEnd, getSerializableState])

  const consumeReroll = useCallback((
    playerIndex: number,
    currentCards: CardDefinition[],
    rerollIndex: number
  ): CardDefinition | null => {
    const player = playersRef.current[playerIndex]
    if (!player || (player.rerollsRemaining ?? 0) <= 0) return null

    // Save snapshot BEFORE reroll for undo support (captures current cards and reroll count)
    // Update pendingBlackMarket with current cards before saving
    const playerName = player.name ?? ''
    pendingBlackMarketRef.current = {
      playerIndex,
      playerName,
      cards: currentCards,
    }
    saveSnapshot()

    // Decrease reroll count
    setPlayers((prev) =>
      prev.map((p, index) =>
        index === playerIndex
          ? { ...p, rerollsRemaining: (p.rerollsRemaining ?? 0) - 1 }
          : p,
      ),
    )

    // Draw a new card
    const drawContext = buildCardDrawContext(playersRef.current, playerIndex)
    const entry = pickCardForPlayer(drawContext, runtimeConfig.mechanics.cardWeights)
    const newCard = entry?.definition ?? null

    // Update pendingBlackMarket with the NEW cards after reroll
    if (newCard) {
      const updatedCards = [...currentCards]
      updatedCards[rerollIndex] = newCard
      pendingBlackMarketRef.current = {
        playerIndex,
        playerName,
        cards: updatedCards,
      }
    }

    return newCard
  }, [runtimeConfig.mechanics.cardWeights, saveSnapshot])

  return {
    tiles,
    players,
    activePlayerIndex,
    selectedTile,
    answerRevealed,
    history,
    gameStats,
    handleTileClick,
    handleRevealAnswer,
    handleAnswer,
    handlePass,
    handleUndo,
    handleCloseDialog,
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
    arePlayersAllied,
    getPlayerAlliance,
    goldenIdolBonus,
    resetGoldenIdolBonus: () => setGoldenIdolBonus(0),
    gameMetrics,
    recordActionUsage,
    incrementPlayerMetric,
    acceptBlackMarketCards,
    consumeReroll,
    grantQuest,
    updateQuestProgress,
    resetQuestProgress,
    claimQuestReward,
    updateCardState,
    getSerializableState,
  }
}
