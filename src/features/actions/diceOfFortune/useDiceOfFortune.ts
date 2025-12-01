import { useState, useCallback } from 'react'
import type { Tile } from '@/types/game'

const START_DICE_SOUND = '/src/assets/sounds/actions/dice_of_fortune/dice_start.mp3'
const TICK_DICE_SOUND = '/src/assets/sounds/actions/dice_of_fortune/dice_tick.wav'
const LAND_DICE_SOUND = '/src/assets/sounds/actions/dice_of_fortune/dice_land.mp3'

function createAudio(src: string) {
  const audio = new Audio(src)
  return audio
}

export function useDiceOfFortune() {
  const [isRolling, setIsRolling] = useState(false)
  const [crumbledTileIds, setCrumbledTileIds] = useState<string[]>([])
  const [selectedSurvivorId, setSelectedSurvivorId] = useState<string | null>(null)

  const playStartDice = useCallback(() => {
    const audio = createAudio(START_DICE_SOUND)
    audio.volume = 0.4
    audio.play().catch(() => {})
  }, [])

  const playTick = useCallback(() => {
    const audio = createAudio(TICK_DICE_SOUND)
    audio.volume = 0.3
    audio.playbackRate = 0.9 + Math.random() * 0.2 // vary pitch slightly
    audio.play().catch(() => {})
  }, [])

  const playLand = useCallback(() => {
    const audio = createAudio(LAND_DICE_SOUND)
    audio.volume = 0.5
    audio.play().catch(() => {})
  }, [])

  const triggerDice = useCallback(async (
    tiles: Tile[],
    updateTileModifiers: (id: string, mods: { isCrumbled: boolean }) => void
  ) => {
    const openTiles = tiles.filter(t => t.status === 'open')
    if (openTiles.length < 2) return

    setIsRolling(true)
    setCrumbledTileIds([])
    setSelectedSurvivorId(null)

    playStartDice()

    const survivorIndex = Math.floor(Math.random() * openTiles.length)
    const survivor = openTiles[survivorIndex]
    const victims = openTiles.filter(t => t.id !== survivor.id)
    const shuffledVictims = [...victims].sort(() => Math.random() - 0.5)

    // Crumble loop
    for (let i = 0; i < shuffledVictims.length; i++) {
      const victim = shuffledVictims[i]
      
      const progress = i / shuffledVictims.length
      const delay = 50 + (Math.pow(progress, 2) * 600)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      
      setCrumbledTileIds(prev => [...prev, victim.id])
      updateTileModifiers(victim.id, { isCrumbled: true })
      playTick()
    }

    // Dramatic pause on the survivor
    await new Promise(resolve => setTimeout(resolve, 800))

    // Set the survivor ID first, which will trigger the yellow indicator
    setIsRolling(false) // Exit rolling state
    setSelectedSurvivorId(survivor.id) // This triggers the yellow indicator
    
    playLand() // Play land sound *after* the state for the indicator is set.

    // A very short pause to let the UI render the yellow indicator before ending.
    await new Promise(resolve => setTimeout(resolve, 200)) 

    setCrumbledTileIds([]) // clear local animation state, rely on global 'isCrumbled'
  }, [playStartDice, playTick, playLand])

  const clearDiceEffect = useCallback((tiles: Tile[], updateTileModifiers: (id: string, mods: { isCrumbled?: boolean }) => void) => {
    setIsRolling(false)
    setSelectedSurvivorId(null)
    // Clear all crumbled flags
    tiles.forEach(t => {
      if (t.modifiers?.isCrumbled) {
        updateTileModifiers(t.id, { isCrumbled: false })
      }
    })
  }, [])

  return {
    isRolling,
    selectedSurvivorId,
    triggerDice,
    clearDiceEffect,
  }
}