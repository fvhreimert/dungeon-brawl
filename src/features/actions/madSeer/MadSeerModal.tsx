import { useMemo } from 'react'
import type { Tile } from '@/types/game'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import './MadSeerModal.css'

type MadSeerModalProps = {
  tile: Tile
  onAccept: () => void
  onReject: () => void
  isUpgraded?: boolean
  wordsMin?: number
  wordsMax?: number
  wordsMinUpgraded?: number
  wordsMaxUpgraded?: number
}

type FloatingWord = {
  id: string
  word: string
  angle: number
  radius: number
  duration: number
  delay: number
  direction: 'normal' | 'reverse'
}


// Simple Pseudo-Random Number Generator (PRNG) for deterministic randomness
// This is a basic LCG, suitable for generating stable "random-like" values
// based on a seed, which satisfies React's purity rules for useMemo.
function createSeededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i)
  }
  let s = h >>> 0
  return function() {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function MadSeerModal({
  tile,
  onAccept,
  onReject,
  isUpgraded = false,
  wordsMin = 4,
  wordsMax = 8,
  wordsMinUpgraded = 8,
  wordsMaxUpgraded = 16,
}: MadSeerModalProps) {
  const floatingWords = useMemo<FloatingWord[]>(() => {
    const random = createSeededRandom(`${tile.id}-${tile.question}`)
    const cleanedWords = tile.question
      .replace(/[^\w\s']/g, '')
      .split(/\s+/)
      .filter(Boolean)

    const uniqueWords = Array.from(new Set(cleanedWords))
    const minWords = isUpgraded ? wordsMinUpgraded : wordsMin
    const maxWords = isUpgraded ? wordsMaxUpgraded : wordsMax
    const range = Math.max(0, maxWords - minWords)
    const targetCount = minWords + Math.floor(random() * (range + 1))
    const count = Math.min(uniqueWords.length || cleanedWords.length, targetCount)

    const source = uniqueWords.length > 0 ? uniqueWords : cleanedWords
    const shuffled = [...source].sort(() => random() - 0.5)

    return shuffled.slice(0, count).map((word, index) => {
      const angle = random() * 360
      const radius = 70 + random() * 110
      const duration = 10 + random() * 5
      const delay = random() * duration
      return {
        id: `${word}-${index}`,
        word,
        angle,
        radius,
        duration,
        delay,
        direction: random() > 0.5 ? 'reverse' : 'normal',
      }
    })
  }, [tile.id, tile.question, isUpgraded, wordsMin, wordsMax, wordsMinUpgraded, wordsMaxUpgraded])

  return (
    <div className="madseer-backdrop" onClick={onReject}>
      <div
        className="madseer-dialog pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="madseer-header">
          <div className="madseer-title">Mad Seer&apos;s Vision</div>
          <div className="madseer-subtitle">
            {tile.category} · {tile.value}
          </div>
        </div>

        <div className="madseer-body">
          <div className="madseer-orbit-space">
            {floatingWords.map((entry) => (
              <span
                key={entry.id}
                className="madseer-word"
                style={{
                  ['--start-angle' as string]: `${entry.angle}deg`,
                  ['--radius' as string]: `${entry.radius}px`,
                  ['--orbit-duration' as string]: `${entry.duration}s`,
                  animationDelay: `-${entry.delay}s`,
                  animationDirection: entry.direction,
                }}
              >
                {entry.word}
              </span>
            ))}
          </div>
        </div>

        <div className="madseer-actions">
          <RetroButton
            font="retro"
            variant="secondary"
            className="dialog-button-8bit madseer-btn madseer-accept"
            onClick={onAccept}
          >
            Embrace the Vision
          </RetroButton>
          <RetroButton
            font="retro"
            variant="destructive"
            className="dialog-button-8bit madseer-btn madseer-reject"
            onClick={onReject}
          >
            Reject the Omen
          </RetroButton>
        </div>
      </div>
    </div>
  )
}
