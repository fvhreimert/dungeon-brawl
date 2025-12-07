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
} from '@/types/game'
import type { CardDefinition } from '@/data/cards'
import { gameConfig } from '@/config/gameConfig'
import {
  runCardEffect,
} from '@/features/cards/cardEffectRegistry'

type UseJeopardyGameParams = {
  categories: readonly string[]
  pointValues: readonly number[]
  players: readonly PlayerConfig[]
  questionBank: QAItem[]
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
})

const buildPlayerWithStats = (config: PlayerConfig): Player => {
  const basePlayer = {
    ...config,
    inventory: [...config.inventory],
  }
  const stats = createDefaultPlayerStats()
  return { ...basePlayer, stats }
}

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

export function useJeopardyGame({
  categories,
  pointValues,
  players: initialPlayers,
  questionBank,
}: UseJeopardyGameParams) {
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

  const [tiles, setTiles] = useState<Tile[]>(generatedTiles)
  const [players, setPlayers] = useState<Player[]>(
    initialPlayers.map((player) => buildPlayerWithStats(player)),
  )
  const playersRef = useRef<Player[]>(players)
  useEffect(() => {
    playersRef.current = players
  }, [players])
  const applyScoreChangeRef = useRef<
    (targetIndex: number, delta: number, reason?: ScoreChangeReason) => void
  >(() => {})
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [history, setHistory] = useState<GameStateSnapshot[]>([])
  const [gameStats, setGameStats] = useState<GameStatEntry[]>([])

  const selectedTile = selectedTileId
    ? tiles.find((tile) => tile.id === selectedTileId) ?? null
    : null

  const saveSnapshot = () => {
    setHistory((prev) => {
      const newHistory = [
        ...prev,
        {
          tiles: [...tiles],
          players: [...players],
          activePlayerIndex,
        },
      ]
      return newHistory.slice(-5)
    })
  }

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

      if (delta < 0 && reason !== 'question') {
        const inventory = playersRef.current[targetIndex]?.inventory ?? []
        inventory.forEach((card) =>
          runCardEffect(
            'damageTaken',
            card,
            {
              players: playersRef.current,
              ownerPlayerIndex: targetIndex,
              activePlayerIndex,
              applyScoreChange: applyScoreChangeRef.current,
              updatePlayerStats,
              updateCardState,
              transferCardBetweenPlayers,
              removeCardFromInventory,
            },
            { damage: Math.abs(delta), reason },
          ),
        )
      }
    },
    [activePlayerIndex, updatePlayerStats, updateCardState, transferCardBetweenPlayers, removeCardFromInventory],
  )

  useEffect(() => {
    applyScoreChangeRef.current = applyScoreChange
  }, [applyScoreChange])

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
  }

  const handleTileClick = (tileId: string) => {
    const tile = tiles.find((t) => t.id === tileId)
    if (!tile || tile.status === 'done' || selectedTileId) return
    setSelectedTileId(tileId)
    setAnswerRevealed(false)
  }

  const handleRevealAnswer = () => setAnswerRevealed(true)

  const getNextPlayerIndex = () => (activePlayerIndex + 1) % players.length

  const prepareNextPlayer = () => {
    const nextIndex = getNextPlayerIndex()
    setPlayers((prev) =>
      prev.map((player, index) =>
        index === nextIndex ? { ...player, stats: resetPlayerTurnStats(player.stats) } : player,
      ),
    )
    setActivePlayerIndex(nextIndex)
    setSelectedTileId(null)
    setAnswerRevealed(false)
  }

  const handleAnswer = (correct: boolean) => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    const effectiveValue = selectedTile.value * (selectedTile.multiplier ?? 1)
    const scoreChange = correct ? effectiveValue : -effectiveValue
    recordStat(correct ? 'correct' : 'wrong', scoreChange)

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done', modifiers: {} } : tile,
      ),
    )

    applyScoreChange(activePlayerIndex, scoreChange, 'question')
    prepareNextPlayer()
  }

  const handlePass = () => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    recordStat('pass', 0)

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done', modifiers: {} } : tile,
      ),
    )

    prepareNextPlayer()
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]

    setTiles(previousState.tiles)
    setPlayers(previousState.players)
    setActivePlayerIndex(previousState.activePlayerIndex)

    setHistory((prev) => prev.slice(0, -1))
    setGameStats((prev) => prev.slice(0, -1))

    setSelectedTileId(null)
    setAnswerRevealed(false)
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
        const capped = Math.min(current * multiplier, 128)
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

  const performBloodSacrifice = (amount: number, targetPlayerIndex: number) => {
    saveSnapshot()
    applyScoreChange(activePlayerIndex, -amount, 'activeCard')
    applyScoreChange(targetPlayerIndex, -amount, 'activeCard')
  }

  const addCardToInventory = (card: CardDefinition) => {
    saveSnapshot()
    const cardInstance = createCardInstance(card)
    if (cardInstance.id === 'cursed_coin') {
      cardInstance.state = { turnsRemaining: 10 }
      applyScoreChange(activePlayerIndex, 500, 'passiveItem')
    }
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index !== activePlayerIndex) return player
        const inventory = [cardInstance, ...player.inventory]
        return {
          ...player,
          inventory,
        }
      }),
    )
  }

  const activateCard = (cardInstanceId: string, targetPlayerIndex: number) => {
    const ownerIndex = activePlayerIndex
    const card = playersRef.current[ownerIndex]?.inventory.find(
      (entry) => entry.instanceId === cardInstanceId,
    )
    if (!card) return
    saveSnapshot()
    const result = runCardEffect(
      'activated',
      card,
      {
        players: playersRef.current,
        ownerPlayerIndex: ownerIndex,
        activePlayerIndex,
        applyScoreChange: applyScoreChangeRef.current,
        updatePlayerStats,
        updateCardState,
        transferCardBetweenPlayers,
        removeCardFromInventory,
      },
      { targetIndex: targetPlayerIndex },
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
            applyScoreChange: applyScoreChangeRef.current,
            updatePlayerStats,
            updateCardState,
            transferCardBetweenPlayers,
            removeCardFromInventory,
          },
          {},
        ),
      )
    },
    [activePlayerIndex, updatePlayerStats, updateCardState, transferCardBetweenPlayers, removeCardFromInventory],
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
            applyScoreChange: applyScoreChangeRef.current,
            updatePlayerStats,
            updateCardState,
            transferCardBetweenPlayers,
            removeCardFromInventory,
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
  ])

  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    runGlobalTurnEffects()
    runTurnStartEffects(activePlayerIndex)
  }, [activePlayerIndex, runTurnStartEffects, runGlobalTurnEffects])

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
    activateCard,
  }
}
