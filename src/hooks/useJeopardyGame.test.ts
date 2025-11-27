import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJeopardyGame } from './useJeopardyGame'
import type { QAItem, Player } from '@/types/game'

describe('useJeopardyGame', () => {
  const mockCategories = ['TestCat']
  const mockPointValues = [100]
  const mockPlayers: Player[] = [
    { name: 'P1', score: 0 },
    { name: 'P2', score: 0 },
  ]
  const mockQuestions: QAItem[] = [
    { category: 'TestCat', value: 100, question: 'Q1', answer: 'A1' },
  ]

  it('initializes correctly', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    expect(result.current.tiles).toHaveLength(1)
    expect(result.current.tiles[0].status).toBe('open')
    expect(result.current.activePlayerIndex).toBe(0)
    expect(result.current.selectedTile).toBeNull()
  })

  it('selects a tile', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    const tileId = result.current.tiles[0].id

    act(() => {
      result.current.handleTileClick(tileId)
    })

    expect(result.current.selectedTile?.id).toBe(tileId)
    expect(result.current.answerRevealed).toBe(false)
  })

  it('reveals answer', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })
    
    act(() => {
      result.current.handleRevealAnswer()
    })

    expect(result.current.answerRevealed).toBe(true)
  })

  it('handles correct answer', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })
    
    act(() => {
      result.current.handleRevealAnswer()
    })

    act(() => {
      result.current.handleAnswer(true)
    })

    expect(result.current.players[0].score).toBe(100)
    expect(result.current.activePlayerIndex).toBe(1) // Turns rotate
    expect(result.current.selectedTile).toBeNull()
    expect(result.current.tiles[0].status).toBe('done')
  })

  it('handles wrong answer', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })

    act(() => {
      result.current.handleRevealAnswer()
    })

    act(() => {
      result.current.handleAnswer(false)
    })

    expect(result.current.players[0].score).toBe(-100)
    expect(result.current.activePlayerIndex).toBe(1)
    expect(result.current.tiles[0].status).toBe('done')
  })

  it('handles pass (nobody answers)', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })

    act(() => {
      result.current.handleRevealAnswer()
    })

    act(() => {
      result.current.handlePass()
    })

    expect(result.current.players[0].score).toBe(0) // No score change
    expect(result.current.activePlayerIndex).toBe(1) // Next player
    expect(result.current.tiles[0].status).toBe('done')
  })

  it('records history and stats', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })

    act(() => {
      result.current.handleRevealAnswer()
    })

    act(() => {
      result.current.handleAnswer(true)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.gameStats).toHaveLength(1)
    expect(result.current.gameStats[0].result).toBe('correct')
  })

  it('handles undo', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })

    act(() => {
      result.current.handleRevealAnswer()
    })

    act(() => {
      result.current.handleAnswer(true)
    })

    // Verify state before undo
    expect(result.current.players[0].score).toBe(100)
    expect(result.current.tiles[0].status).toBe('done')

    act(() => {
      result.current.handleUndo()
    })

    // Verify state after undo
    expect(result.current.players[0].score).toBe(0)
    expect(result.current.tiles[0].status).toBe('open')
    expect(result.current.activePlayerIndex).toBe(0)
    expect(result.current.history).toHaveLength(0)
    expect(result.current.gameStats).toHaveLength(0)
  })
})
