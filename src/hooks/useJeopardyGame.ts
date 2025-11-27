import { useMemo, useState } from 'react'

import type { Player, QAItem, Tile } from '@/types/game'

type UseJeopardyGameParams = {
  categories: string[]
  pointValues: number[]
  players: Player[]
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
              `Answer the ${category.toLowerCase()} challenge worth ${value} gold.`,
            answer: match?.answer ?? 'TBD',
          }
        }),
      ),
    [categories, pointValues, questionLookup],
  )

  const [tiles, setTiles] = useState<Tile[]>(generatedTiles)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)

  const selectedTile = selectedTileId
    ? tiles.find((tile) => tile.id === selectedTileId) ?? null
    : null

  const handleTileClick = (tileId: string) => {
    const tile = tiles.find((t) => t.id === tileId)
    if (!tile || tile.status === 'done' || selectedTileId) return
    setSelectedTileId(tileId)
    setAnswerRevealed(false)
  }

  const handleRevealAnswer = () => setAnswerRevealed(true)

  const handleAnswer = (correct: boolean) => {
    if (!selectedTile || !answerRevealed) return

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
              score: correct
                ? player.score + selectedTile.value
                : player.score - selectedTile.value,
            }
          : player,
      ),
    )

    setActivePlayerIndex((prev) => (prev + 1) % players.length)
    setSelectedTileId(null)
    setAnswerRevealed(false)
  }

  const handleCloseDialog = () => {
    setAnswerRevealed(false)
    setSelectedTileId(null)
  }

  return {
    tiles,
    players,
    activePlayerIndex,
    selectedTile,
    answerRevealed,
    handleTileClick,
    handleRevealAnswer,
    handleAnswer,
    handleCloseDialog,
  }
}
