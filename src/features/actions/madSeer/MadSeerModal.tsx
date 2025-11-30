import { useMemo } from 'react'
import type { Tile } from '@/types/game'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import './MadSeerModal.css'

type MadSeerModalProps = {
  tile: Tile
  onAccept: () => void
  onReject: () => void
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

export function MadSeerModal({ tile, onAccept, onReject }: MadSeerModalProps) {
  const floatingWords = useMemo<FloatingWord[]>(() => {
    const cleanedWords = tile.question
      .replace(/[^\w\s']/g, '')
      .split(/\s+/)
      .filter(Boolean)

    const uniqueWords = Array.from(new Set(cleanedWords))
    const count = Math.min(
      uniqueWords.length || cleanedWords.length,
      Math.max(4, Math.floor(Math.random() * 5) + 4),
    )

    const source = uniqueWords.length > 0 ? uniqueWords : cleanedWords
    const shuffled = [...source].sort(() => Math.random() - 0.5)

    return shuffled.slice(0, count).map((word, index) => {
      const angle = Math.random() * 360
      const radius = 70 + Math.random() * 110
      const duration = 10 + Math.random() * 5
      const delay = Math.random() * duration
      return {
        id: `${word}-${index}`,
        word,
        angle,
        radius,
        duration,
        delay,
        direction: Math.random() > 0.5 ? 'reverse' : 'normal',
      }
    })
  }, [tile.id, tile.question])

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
