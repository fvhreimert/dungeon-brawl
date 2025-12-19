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
} from '@/types/game'
import { CARDS, type CardDefinition } from '@/data/cards'
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

const buildPlayerWithStats = (config: PlayerConfig): Player => {
  const basePlayer = {
    ...config,
    inventory: [...config.inventory],
    actionCounts: { ...config.actionCounts },
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
  const [puppetLocks, setPuppetLocks] = useState<Record<number, PuppetLock>>({})
  const [frozenActions, setFrozenActions] = useState<FrozenActions>({})
  const [alliances, setAlliances] = useState<Alliances>([])
  const [goldenIdolBonus, setGoldenIdolBonus] = useState<number>(gameConfig.mechanics.goldenIdol.startBonus)
  const activePuppetLockCategory = puppetLocks[activePlayerIndex]?.category ?? null

  const selectedTile = selectedTileId
    ? tiles.find((tile) => tile.id === selectedTileId) ?? null
    : null

  const saveSnapshot = useCallback(() => {
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
        },
      ]
      return newHistory.slice(-5)
    })
  }, [tiles, players, activePlayerIndex, puppetLocks, frozenActions, alliances, goldenIdolBonus])

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
    },
    [],
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
              setPuppetLockForPlayer,
            },
            { damage: Math.abs(delta), reason },
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
    const nextIndex = getNextPlayerIndex()
    setPlayers((prev) =>
      prev.map((player, index) =>
        index === nextIndex ? { ...player, stats: resetPlayerTurnStats(player.stats) } : player,
      ),
    )
    setActivePlayerIndex(nextIndex)
    setSelectedTileId(null)
    setAnswerRevealed(false)
    setGoldenIdolBonus((prev) => {
      // Distribution: 5-100, peak around 10-30
      const roll = Math.random()
      const increment = roll < 0.7 
        ? 5 + Math.floor(Math.random() * 26) // 5-30 (range of 26)
        : 31 + Math.floor(Math.random() * 70) // 31-100 (range of 70)
      return prev + increment
    })
  }

  const handleAnswer = (correct: boolean) => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    const effectiveValue = selectedTile.value * (selectedTile.multiplier ?? 1)
    
    // Apply spider sense bonus for correct answers (5% per level)
    let scoreChange: number
    if (correct) {
      const spiderSenseLevel = players[activePlayerIndex].spiderSenseLevel ?? 0
      const bonusMultiplier = 1 + (spiderSenseLevel * gameConfig.mechanics.spiderSense.bonusPerLevel)
      scoreChange = Math.round(effectiveValue * bonusMultiplier)
    } else {
      scoreChange = -effectiveValue
    }
    
    recordStat(correct ? 'correct' : 'wrong', scoreChange)

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done', modifiers: {} } : tile,
      ),
    )

    applyScoreChange(activePlayerIndex, scoreChange, 'question')
    clearPuppetLock(activePlayerIndex)
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

    clearPuppetLock(activePlayerIndex)
    prepareNextPlayer()
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]

    setTiles(previousState.tiles)
    setPlayers(previousState.players)
    setActivePlayerIndex(previousState.activePlayerIndex)
    setPuppetLocks(previousState.puppetLocks)
    setFrozenActions(previousState.frozenActions ?? {})
    setAlliances(previousState.alliances ?? [])
    setGoldenIdolBonus(previousState.goldenIdolBonus ?? gameConfig.mechanics.goldenIdol.startBonus)

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
    },
    [saveSnapshot],
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
      const allianceDuration = players.length * gameConfig.mechanics.alliances.baseDurationMultiplier
      const color = getNextAllianceColor()
      const newAlliance: Alliance = {
        id: `alliance-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        color,
        playerIndices: [initiatorIndex, targetIndex],
        turnsRemaining: allianceDuration,
        sourceCardInstanceId: cardInstanceId,
      }
      setAlliances((prev) => [...prev, newAlliance])
      return newAlliance
    },
    [players.length, getNextAllianceColor],
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
  }

  const addCardToInventory = (card: CardDefinition) => {
    saveSnapshot()
    const cardInstance = createCardInstance(card)
    if (cardInstance.id === 'cursed_coin') {
      cardInstance.state = { turnsRemaining: gameConfig.mechanics.items.cursedCoin.durationTurns }
      applyScoreChange(activePlayerIndex, gameConfig.mechanics.items.cursedCoin.value, 'passiveItem')
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
      setActivePlayerIndex(playerIndex)
    }
  }, [players.length, saveSnapshot])

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
          if (currentLevel >= gameConfig.mechanics.spiderSense.maxLevel) return player
          return {
            ...player,
            spiderSenseLevel: currentLevel + 1,
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
    upgradeAction,
    incrementActionCount,
    alliances,
    createAlliance,
    arePlayersAllied,
    getPlayerAlliance,
    goldenIdolBonus,
    resetGoldenIdolBonus: () => setGoldenIdolBonus(0),
  }
}
