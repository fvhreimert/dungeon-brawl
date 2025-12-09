import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { calculatePassiveDeltaForPlayer } from '@/features/cards/cardEffectRegistry'
import { useJeopardyGame } from './useJeopardyGame'
import { CARDS } from '@/data/cards'
import type { QAItem, PlayerConfig } from '@/types/game'

describe('useJeopardyGame', () => {
  const mockCategories = ['TestCat']
  const mockPointValues = [100, 200]
  const mockPlayers: PlayerConfig[] = [
    { name: 'P1', score: 0, inventory: [] },
    { name: 'P2', score: 0, inventory: [] },
  ]
  const mockQuestions: QAItem[] = [
    { category: 'TestCat', value: 100, question: 'Q1', answer: 'A1' },
    { category: 'TestCat', value: 200, question: 'Q2', answer: 'A2' },
  ]
  const soulBurstCard = CARDS.find((card) => card.id === 'soul_burst')
  const puppetMasterCard = CARDS.find((card) => card.id === 'puppet_master')
  const beggarCard = CARDS.find((card) => card.id === 'beggar')

  it('initializes correctly', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    expect(result.current.tiles).toHaveLength(2)
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

  it('grants passive niffler points when turns return', () => {
    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.addCardToInventory(CARDS[0])
    })

    expect(calculatePassiveDeltaForPlayer(result.current.players[0], result.current.players)).toBe(25)

    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })
    act(() => {
      result.current.handleRevealAnswer()
    })
    act(() => {
      result.current.handlePass()
    })

    expect(result.current.activePlayerIndex).toBe(1)

    act(() => {
      result.current.handleTileClick(result.current.tiles[1].id)
    })
    act(() => {
      result.current.handleRevealAnswer()
    })
    act(() => {
      result.current.handlePass()
    })

    expect(result.current.activePlayerIndex).toBe(0)
    expect(result.current.players[0].score).toBe(50)
    expect(result.current.players[0].stats.passivePointsGained.thisTurn).toBe(25)
  })

  it('stores damage and activates soul burst', () => {
    if (!soulBurstCard) {
      expect(false).toBe(true)
      return
    }

    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    act(() => {
      result.current.addCardToInventory(soulBurstCard)
    })

    const cardInstance = result.current.players[0].inventory[0]
    const cardId = cardInstance.instanceId

    act(() => {
      result.current.performBloodSacrifice(40, 1)
    })

    const storedCard = result.current.players[0].inventory.find((card) => card.instanceId === cardId)
    expect(storedCard?.state?.storedDamage).toBe(10)

    act(() => {
      result.current.activateCard(cardId, 1)
    })

    expect(result.current.players[0].inventory.find((card) => card.instanceId === cardId)?.state?.storedDamage).toBe(0)
    expect(result.current.players[0].score).toBe(-30)
    expect(result.current.players[1].score).toBe(-50)
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

  it('locks a target player to a category with Puppet Master', () => {
    if (!puppetMasterCard) {
      expect(false).toBe(true)
      return
    }

    const puppetCategories = ['Fire', 'Ice']
    const puppetPointValues = [100, 200]
    const puppetQuestions: QAItem[] = [
      { category: 'Fire', value: 100, question: 'F1', answer: 'A' },
      { category: 'Fire', value: 200, question: 'F2', answer: 'B' },
      { category: 'Ice', value: 100, question: 'I1', answer: 'C' },
      { category: 'Ice', value: 200, question: 'I2', answer: 'D' },
    ]

    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: puppetCategories,
        pointValues: puppetPointValues,
        players: mockPlayers,
        questionBank: puppetQuestions,
      })
    )

    act(() => {
      result.current.addCardToInventory(puppetMasterCard)
    })

    const cardInstance = result.current.players[0].inventory[0]

    act(() => {
      result.current.activateCard(cardInstance.instanceId, 1, { category: 'Ice' })
    })

    expect(result.current.players[1].stats.isPuppeteered).toBe(true)
    expect(result.current.players[1].stats.puppetLock?.category).toBe('Ice')

    const fireTile = result.current.tiles.find(
      (tile) => tile.category === 'Fire' && tile.value === 100,
    )
    if (!fireTile) throw new Error('Missing fire tile')

    act(() => {
      result.current.handleTileClick(fireTile.id)
    })
    act(() => {
      result.current.handleRevealAnswer()
    })
    act(() => {
      result.current.handlePass()
    })

    expect(result.current.activePlayerIndex).toBe(1)

    const blockedFireTile = result.current.tiles.find(
      (tile) => tile.category === 'Fire' && tile.status === 'open',
    )
    if (!blockedFireTile) throw new Error('Missing blocked fire tile')

    act(() => {
      result.current.handleTileClick(blockedFireTile.id)
    })
    expect(result.current.selectedTile?.id).not.toBe(blockedFireTile.id)

    const iceTile = result.current.tiles.find(
      (tile) => tile.category === 'Ice' && tile.status === 'open',
    )
    if (!iceTile) throw new Error('Missing ice tile')

    act(() => {
      result.current.handleTileClick(iceTile.id)
    })

    expect(result.current.selectedTile?.id).toBe(iceTile.id)
    expect(result.current.players[1].stats.isPuppeteered).toBe(false)
    expect(result.current.players[1].stats.puppetLock).toBeNull()
  })

  it('beggar steals 10 pts from each opponent and triggers soul burst', () => {
    if (!beggarCard || !soulBurstCard) {
      expect(false).toBe(true)
      return
    }

    const { result } = renderHook(() =>
      useJeopardyGame({
        categories: mockCategories,
        pointValues: mockPointValues,
        players: mockPlayers,
        questionBank: mockQuestions,
      })
    )

    // Give P1 the beggar card
    act(() => {
      result.current.addCardToInventory(beggarCard)
    })

    // Give P2 the soul burst card to test if beggar triggers damageTaken
    act(() => {
      result.current.handleTileClick(result.current.tiles[0].id)
    })
    act(() => {
      result.current.handleRevealAnswer()
    })
    act(() => {
      result.current.handlePass()
    })

    // Now P2's turn - give them soul burst
    expect(result.current.activePlayerIndex).toBe(1)
    act(() => {
      result.current.addCardToInventory(soulBurstCard)
    })

    // Advance turn again to trigger beggar's turnAdvanced
    act(() => {
      result.current.handleTileClick(result.current.tiles[1].id)
    })
    act(() => {
      result.current.handleRevealAnswer()
    })
    act(() => {
      result.current.handlePass()
    })

    // After two turn advances with beggar:
    // P1 gains 10 pts per turn (1 opponent) = 20 pts total
    // P2 loses 10 pts per turn = -20 pts total
    // But P2's soul burst should have stored 25% of the 10 pts damage = 2 pts (per turn advance after they got the card)
    expect(result.current.players[0].score).toBe(20) // 10 pts per turn * 2 turns
    expect(result.current.players[1].score).toBe(-20) // -10 pts per turn * 2 turns

    // Check P2's soul burst stored damage (only 1 turn worth since they got it on turn 2)
    const soulBurstInstance = result.current.players[1].inventory.find(
      (card) => card.id === 'soul_burst'
    )
    expect(soulBurstInstance?.state?.storedDamage).toBe(2) // 25% of 10 = 2.5, floored to 2

    // Check passive delta shows correct value for beggar owner
    expect(calculatePassiveDeltaForPlayer(result.current.players[0], result.current.players)).toBe(10)
  })
})
