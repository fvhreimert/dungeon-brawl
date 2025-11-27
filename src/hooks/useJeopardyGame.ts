import { useMemo, useState } from 'react'

import type { Player, QAItem, Tile, GameStateSnapshot, GameStatEntry } from '@/types/game'
import { gameConfig } from '@/config/gameConfig'

type UseJeopardyGameParams = {
  categories: readonly string[]
  pointValues: readonly number[]
  players: readonly Player[]
  questionBank: QAItem[]
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
  const [players, setPlayers] = useState<Player[]>([...initialPlayers])
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
      // Keep only last 5 states
      return newHistory.slice(-5)
    })
  }

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
        playerId: currentPlayer.name, // Using name as ID for now
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

  const handleAnswer = (correct: boolean) => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    const scoreChange = correct ? selectedTile.value : -selectedTile.value
    recordStat(correct ? 'correct' : 'wrong', scoreChange)

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done' } : tile,
      ),
    )

    setPlayers((prev) =>
      prev.map((player, index) =>
        index === activePlayerIndex
          ? {
              ...player,
              score: player.score + scoreChange,
            }
          : player,
      ),
    )

    setActivePlayerIndex((prev) => (prev + 1) % players.length)
    setSelectedTileId(null)
    setAnswerRevealed(false)
  }

  const handlePass = () => {
    if (!selectedTile || !answerRevealed) return

    saveSnapshot()
    recordStat('pass', 0)

    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === selectedTile.id ? { ...tile, status: 'done' } : tile,
      ),
    )
    
    // In a pass scenario, we just mark it done and move to next player
    setActivePlayerIndex((prev) => (prev + 1) % players.length)
    setSelectedTileId(null)
    setAnswerRevealed(false)
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]
    
    setTiles(previousState.tiles)
    setPlayers(previousState.players)
    setActivePlayerIndex(previousState.activePlayerIndex)
    
    // Pop last history entry
    setHistory((prev) => prev.slice(0, -1))
    
    // Pop last stat entry (since we are undoing the turn)
    setGameStats((prev) => prev.slice(0, -1))
    
    // Reset selection state to be safe
    setSelectedTileId(null)
    setAnswerRevealed(false)
  }

  const handleCloseDialog = () => {
    // Prevent closing if answer is revealed to avoid "peeking" exploit
    if (answerRevealed) return
    
    setAnswerRevealed(false)
    setSelectedTileId(null)
  }

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
  }
}
