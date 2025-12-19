import { useState, useCallback, useEffect, useRef } from 'react'
import type { Tile } from '@/types/game'

import idolTick from '@/assets/sounds/actions/golden_idol/idol_tick.wav'
import idolLand from '@/assets/sounds/actions/golden_idol/idol_land.mp3'
import goldenIdolSound from '@/assets/sounds/actions/golden_idol/golden_idol.mp3'

const LAND_IDOL_SOUND = idolLand

// Use a shared AudioContext if possible to avoid hitting context limits
// But inside a hook, we usually just want one per app session.
// For simplicity in this file, we can lazy-init a global one or one per hook.
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

function createAudio(src: string) {
  const audio = new Audio(src)
  return audio
}

export function useGoldenIdol() {
  const [isActive, setIsActive] = useState(false)
  const [selectedSurvivorIds, setSelectedSurvivorIds] = useState<string[] | null>(null)

  const tickBufferRef = useRef<AudioBuffer | null>(null)
  const idolBufferRef = useRef<AudioBuffer | null>(null)

  // Load buffers on mount
  useEffect(() => {
    const ctx = getAudioContext();
    
    const loadBuffer = async (url: string) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await ctx.decodeAudioData(arrayBuffer);
      } catch (err) {
        console.error("Failed to load audio:", url, err);
        return null;
      }
    };

    if (!tickBufferRef.current) {
      loadBuffer(idolTick).then(buf => tickBufferRef.current = buf);
    }
    if (!idolBufferRef.current) {
      loadBuffer(goldenIdolSound).then(buf => idolBufferRef.current = buf);
    }
    
    // Resume context if suspended (common browser policy)
    const handleInteraction = () => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };
    window.addEventListener('click', handleInteraction, { once: true });
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  const playBuffer = useCallback((buffer: AudioBuffer | null, volume: number = 1, pitchVar: number = 0) => {
    if (!buffer) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    if (pitchVar > 0) {
      // Simple random detune in cents
      // 100 cents = 1 semitone. Let's vary by +/- pitchVar
      // playbackRate also works. 
      // let's use playbackRate for simplicity as in original
      // Original: 0.9 + Math.random() * 0.2
      const rate = 0.9 + Math.random() * 0.2;
      source.playbackRate.value = rate;
    }

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  }, []);

  const playTick = useCallback(() => {
    playBuffer(tickBufferRef.current, 0.3, 0.2);
  }, [playBuffer]);

  const playIdol = useCallback(() => {
    playBuffer(idolBufferRef.current, 0.6);
  }, [playBuffer]);

  const playLand = useCallback(() => {
    const audio = createAudio(LAND_IDOL_SOUND)
    audio.volume = 0.5
    audio.play().catch(() => {})
  }, [])

  const triggerIdol = useCallback(async (
    tiles: Tile[],
    updateTileModifiers: (id: string, mods: { isCrumbled: boolean }) => void,
    count: number = 1
  ) => {
    const openTiles = tiles.filter(t => t.status === 'open')
    if (openTiles.length < count + 1) return

    playIdol() // Play sound immediately

    setIsActive(true)
    setSelectedSurvivorIds(null)

    // Select distinct survivors
    const survivors: Tile[] = []
    const availableForSurvivor = [...openTiles]
    
    for (let i = 0; i < count; i++) {
        if (availableForSurvivor.length === 0) break
        const index = Math.floor(Math.random() * availableForSurvivor.length)
        survivors.push(availableForSurvivor[index])
        availableForSurvivor.splice(index, 1)
    }

    const survivorIds = survivors.map(s => s.id)
    const victims = openTiles.filter(t => !survivorIds.includes(t.id))
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
    setSelectedSurvivorIds(survivorIds) // This triggers the indicator
    
    playLand()

    // A very short pause to let the UI render the yellow indicator before ending.
    await new Promise(resolve => setTimeout(resolve, 200)) 


  }, [playTick, playLand, playIdol])

  const clearIdolEffect = useCallback((tiles: Tile[], updateTileModifiers: (id: string, mods: { isCrumbled?: boolean }) => void) => {
    setIsActive(false)
    setSelectedSurvivorIds(null)
    // Clear all crumbled flags
    tiles.forEach(t => {
      if (t.modifiers?.isCrumbled) {
        updateTileModifiers(t.id, { isCrumbled: false })
      }
    })
  }, [])

  return {
    isActive,
    selectedSurvivorIds,
    triggerIdol,
    clearIdolEffect,
  }
}
