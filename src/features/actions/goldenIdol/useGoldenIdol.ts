import { useState, useCallback } from 'react'
import type { Tile } from '@/types/game'
import idolStart from '@/assets/sounds/actions/dice_of_fortune/dice_start.mp3'
import idolTick from '@/assets/sounds/actions/dice_of_fortune/dice_tick.wav'
import idolLand from '@/assets/sounds/actions/dice_of_fortune/dice_land.mp3'

const START_IDOL_SOUND = idolStart
const TICK_IDOL_SOUND = idolTick
const LAND_IDOL_SOUND = idolLand

function createAudio(src: string) {
  const audio = new Audio(src)
  return audio
}

export function useGoldenIdol() {
  const [isActive, setIsActive] = useState(false)
  const [selectedSurvivorId, setSelectedSurvivorId] = useState<string | null>(null)

  const playStartIdol = useCallback(() => {
    const audio = createAudio(START_IDOL_SOUND)
    audio.volume = 0.4
    audio.play().catch(() => {})
  }, [])

  const playTick = useCallback(() => {
    const audio = createAudio(TICK_IDOL_SOUND)
    audio.volume = 0.3
    audio.playbackRate = 0.9 + Math.random() * 0.2 // vary pitch slightly
    audio.play().catch(() => {})
  }, [])

  const playLand = useCallback(() => {
    const audio = createAudio(LAND_IDOL_SOUND)
    audio.volume = 0.5
    audio.play().catch(() => {})
  }, [])

  const triggerIdol = useCallback(async (
    tiles: Tile[],
    updateTileModifiers: (id: string, mods: { isCrumbled: boolean }) => void
  ) => {
    const openTiles = tiles.filter(t => t.status === 'open')
    if (openTiles.length < 2) return

    setIsActive(true)
    setSelectedSurvivorId(null)

    playStartIdol()

    const survivorIndex = Math.floor(Math.random() * openTiles.length)
    const survivor = openTiles[survivorIndex]
    const victims = openTiles.filter(t => t.id !== survivor.id)
    const shuffledVictims = [...victims].sort(() => Math.random() - 0.5)

    // Crumble loop
    const maxDelay = Math.min(600, shuffledVictims.length * 50 + 150)
    
    for (let i = 0; i < shuffledVictims.length; i++) {
      const victim = shuffledVictims[i]
      
      const progress = i / shuffledVictims.length
      const delay = 50 + (Math.pow(progress, 2) * maxDelay)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      
      updateTileModifiers(victim.id, { isCrumbled: true })
      playTick()
    }

    // Dramatic pause on the survivor
    await new Promise(resolve => setTimeout(resolve, 800))

    // Set the survivor ID first, which will trigger the yellow indicator
    setIsActive(false) // Exit active state
    setSelectedSurvivorId(survivor.id) // This triggers the yellow indicator
    
    playLand() // Play land sound *after* the state for the indicator is set.

    // A very short pause to let the UI render the yellow indicator before ending.
    await new Promise(resolve => setTimeout(resolve, 200)) 


  }, [playStartIdol, playTick, playLand])

  const clearIdolEffect = useCallback((tiles: Tile[], updateTileModifiers: (id: string, mods: { isCrumbled?: boolean }) => void) => {
    setIsActive(false)
    setSelectedSurvivorId(null)
    // Clear all crumbled flags
    tiles.forEach(t => {
      if (t.modifiers?.isCrumbled) {
        updateTileModifiers(t.id, { isCrumbled: false })
      }
    })
  }, [])

  return {
    isActive,
    selectedSurvivorId,
    triggerIdol,
    clearIdolEffect,
  }
}
