import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Player, CardInstance } from '@/types/game'
import type { CardDefinition } from '@/data/cards'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import {
  Card,
  CardImage,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card"
import priceCrackerIcon from '@/assets/images/ui/price_cracker.png'
import cardBackImg from '@/assets/images/ui/card_back.png'
import './PriceCrackerModal.css'

type PriceCrackerPrizes = {
  cards: number
  points: number
}

type PriceCrackerModalProps = {
  activePlayer: Player
  activePlayerIndex: number
  players: readonly Player[]
  card: CardInstance
  onUpdatePrizes: (prizes: PriceCrackerPrizes) => void
  onConfirm: (winnerIndex: number, prizes: { cards: number; points: number }) => CardDefinition[]
  onCancel: () => void
}

type Phase = 'selecting' | 'pulling' | 'exploding' | 'result' | 'reveal'

type ConfettiParticle = {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  velocityX: number
  velocityY: number
  delay: number
}

const CONFETTI_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#ff9f43',
  '#ee5a24', '#009432', '#0652DD', '#9c88ff'
]

export function PriceCrackerModal({
  activePlayer,
  activePlayerIndex,
  players,
  card,
  onUpdatePrizes,
  onConfirm,
  onCancel,
}: PriceCrackerModalProps) {
  const [phase, setPhase] = useState<Phase>('selecting')
  const [selectedOpponentIndex, setSelectedOpponentIndex] = useState<number | null>(null)
  const [crackerPosition, setCrackerPosition] = useState(0) // -1 to 1, 0 is center
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [wonCards, setWonCards] = useState<CardDefinition[]>([])

  const pullTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const pullStartTimeRef = useRef<number>(0)
  const hasInitializedPrizesRef = useRef(false)

  // Get prizes from card state or generate new ones
  const [prizes] = useState<PriceCrackerPrizes>(() => {
    const existingPrizes = card.state?.prizes as PriceCrackerPrizes | undefined
    if (existingPrizes) {
      return existingPrizes
    }
    // Generate new prizes
    return {
      cards: Math.floor(Math.random() * 5) + 1, // 1-5 cards
      points: Math.floor(Math.random() * 500) + 1, // 1-500 points
    }
  })

  // Save prizes to card state if they were just generated
  useEffect(() => {
    if (hasInitializedPrizesRef.current) return
    hasInitializedPrizesRef.current = true

    const existingPrizes = card.state?.prizes as PriceCrackerPrizes | undefined
    if (!existingPrizes) {
      onUpdatePrizes(prizes)
    }
  }, [card.state?.prizes, prizes, onUpdatePrizes])

  // Get opponents (excluding active player)
  const opponents = useMemo(() =>
    players
      .map((player, index) => ({ player, index }))
      .filter(({ index }) => index !== activePlayerIndex),
    [players, activePlayerIndex]
  )

  const selectedOpponent = selectedOpponentIndex !== null
    ? players[selectedOpponentIndex]
    : null

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pullTimeoutRef.current) clearTimeout(pullTimeoutRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'selecting') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, onCancel])

  // Cracker bouncing animation during pulling phase
  useEffect(() => {
    if (phase !== 'pulling') return

    pullStartTimeRef.current = Date.now()

    const animate = () => {
      const elapsed = Date.now() - pullStartTimeRef.current

      // Consistent strong pulls back and forth - frequency slowly increases for tension
      const frequency = 0.8 + (elapsed / 1000) * 0.3
      // Keep amplitude high throughout (0.85-0.95), never drops below 0.8
      const amplitude = 0.9
      const position = Math.sin(elapsed * frequency * 0.008) * amplitude

      setCrackerPosition(position)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [phase])

  const generateConfetti = useCallback(() => {
    const particles: ConfettiParticle[] = []
    const particleCount = 80

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI * 2)
      const velocity = 4 + Math.random() * 10
      particles.push({
        id: i,
        x: 50 + crackerPosition * 20,
        y: 45,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 5 + Math.random() * 8,
        rotation: Math.random() * 360,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 3,
        delay: Math.random() * 150,
      })
    }
    setConfetti(particles)
  }, [crackerPosition])

  const handleSelectOpponent = (index: number) => {
    setSelectedOpponentIndex(index)
  }

  const handlePull = () => {
    if (selectedOpponentIndex === null) return

    setPhase('pulling')

    // Determine winner (50/50 pure chance)
    const activePlayerWins = Math.random() >= 0.5
    const winner = activePlayerWins ? activePlayerIndex : selectedOpponentIndex

    // After suspense, explode (4 seconds for slower animation)
    pullTimeoutRef.current = setTimeout(() => {
      // Set final position based on winner
      const finalPosition = winner === activePlayerIndex ? -0.7 : 0.7
      setCrackerPosition(finalPosition)
      setWinnerIndex(winner)
      setPhase('exploding')
      generateConfetti()

      // Show result after explosion
      setTimeout(() => {
        setPhase('result')
      }, 1000)
    }, 4000)
  }

  const handleCollect = () => {
    if (winnerIndex === null) return
    const cards = onConfirm(winnerIndex, prizes)

    // Always show reveal phase with the cards won (regardless of who won)
    if (cards.length > 0) {
      setWonCards(cards)
      setPhase('reveal')
    } else {
      onCancel()
    }
  }

  const handleCloseReveal = () => {
    // Modal will close - Game.tsx handles cleanup
    onCancel()
  }

  const handleCancel = useCallback(() => {
    if (phase === 'selecting') {
      onCancel()
    }
  }, [phase, onCancel])

  const winner = winnerIndex !== null ? players[winnerIndex] : null
  const isActivePlayerWinner = winnerIndex === activePlayerIndex

  // Reveal phase - show won cards (Card Jester style)
  if (phase === 'reveal') {
    const revealTitle = isActivePlayerWinner
      ? "Your Prizes!"
      : `${winner?.name}'s Prizes`

    return (
      <div className="price-cracker-reveal-backdrop" onClick={handleCloseReveal}>
        <div className="price-cracker-reveal-content">
          <div className="price-cracker-reveal-header">
            <span className={`price-cracker-reveal-title ${isActivePlayerWinner ? 'win' : 'lose'}`}>
              {revealTitle}
            </span>
            <span className={`price-cracker-reveal-points ${isActivePlayerWinner ? '' : 'opponent'}`}>
              +{prizes.points} pts
            </span>
          </div>
          <div className="price-cracker-reveal-cards" data-card-count={wonCards.length}>
            {wonCards.map((card, index) => (
              <div key={`${card.id}-${index}`} className="price-cracker-card-wrapper">
                <Card
                  theme={card.theme}
                  frameSrc={card.framePath}
                  onClick={(e) => e.stopPropagation()}
                  className="price-cracker-card-item"
                >
                  <CardImage src={card.imagePath} alt={card.title} />
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </Card>
              </div>
            ))}
          </div>
          <div className="price-cracker-reveal-hint">Click anywhere to continue</div>
        </div>
      </div>
    )
  }

  return (
    <div className="price-cracker-backdrop" onClick={handleCancel}>
      <div className="price-cracker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="price-cracker-title">Price Cracker!</div>

        <div className="price-cracker-content">
          {/* Prize Display with Card Backs */}
          <div className="price-cracker-prizes">
            <div className="prize-section prize-cards-section">
              <div className="prize-card-backs">
                {Array.from({ length: prizes.cards }, (_, i) => (
                  <img
                    key={i}
                    src={cardBackImg}
                    alt="Card"
                    className="prize-card-back"
                    style={{ marginLeft: i > 0 ? '-24px' : '0' }}
                  />
                ))}
              </div>
              <span className="prize-label">{prizes.cards} card{prizes.cards > 1 ? 's' : ''}</span>
            </div>
            <span className="prize-separator">+</span>
            <div className="prize-section prize-points-section">
              <span className="prize-points-value">{prizes.points}</span>
              <span className="prize-label">points</span>
            </div>
          </div>

          {/* Main Arena */}
          <div className="price-cracker-arena">
            {/* Left Player (Active Player) */}
            <div className={`arena-player arena-player-left ${winnerIndex === activePlayerIndex ? 'winner' : ''}`}>
              {activePlayer.portrait ? (
                <img src={activePlayer.portrait} alt={activePlayer.name} className="arena-portrait" />
              ) : (
                <div className="arena-portrait-placeholder" />
              )}
              <span className="arena-player-name">{activePlayer.name}</span>
            </div>

            {/* Cracker Zone */}
            <div className="cracker-zone">
              {phase !== 'result' && (
                <img
                  src={priceCrackerIcon}
                  alt="Price Cracker"
                  className={`cracker-image ${phase}`}
                  style={{
                    '--cracker-x': `${crackerPosition * 180}px`,
                  } as React.CSSProperties}
                />
              )}

              {/* Confetti */}
              {(phase === 'exploding' || phase === 'result') && confetti.map((particle) => (
                <div
                  key={particle.id}
                  className="confetti-particle"
                  style={{
                    '--start-x': `${particle.x}%`,
                    '--start-y': `${particle.y}%`,
                    '--velocity-x': particle.velocityX,
                    '--velocity-y': particle.velocityY,
                    '--rotation': `${particle.rotation}deg`,
                    '--size': `${particle.size}px`,
                    '--color': particle.color,
                    '--delay': `${particle.delay}ms`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Right Player (Opponent) */}
            <div className={`arena-player arena-player-right ${winnerIndex === selectedOpponentIndex ? 'winner' : ''}`}>
              {phase === 'selecting' ? (
                <div className="opponent-select-grid">
                  {opponents.map(({ player, index }) => (
                    <button
                      key={index}
                      className={`opponent-option ${selectedOpponentIndex === index ? 'selected' : ''}`}
                      onClick={() => handleSelectOpponent(index)}
                    >
                      {player.portrait ? (
                        <img src={player.portrait} alt={player.name} className="opponent-portrait" />
                      ) : (
                        <div className="opponent-portrait-placeholder" />
                      )}
                      <span className="opponent-name">{player.name}</span>
                    </button>
                  ))}
                </div>
              ) : selectedOpponent && (
                <>
                  {selectedOpponent.portrait ? (
                    <img src={selectedOpponent.portrait} alt={selectedOpponent.name} className="arena-portrait" />
                  ) : (
                    <div className="arena-portrait-placeholder" />
                  )}
                  <span className="arena-player-name">{selectedOpponent.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Status Text */}
          {phase === 'selecting' && (
            <div className="price-cracker-subtitle">
              Select an opponent to pull the cracker with!
            </div>
          )}

          {phase === 'pulling' && (
            <div className="price-cracker-pulling-text">
              Pulling...
            </div>
          )}

          {phase === 'exploding' && (
            <div className="price-cracker-exploding-text">
              CRACK!
            </div>
          )}

          {phase === 'result' && winner && (
            <div className={`price-cracker-result-text ${isActivePlayerWinner ? 'win' : 'lose'}`}>
              {isActivePlayerWinner
                ? `You won ${prizes.cards} card${prizes.cards > 1 ? 's' : ''} and ${prizes.points} points!`
                : `${winner.name} won the prizes!`}
            </div>
          )}

          {/* Actions */}
          <div className="price-cracker-actions">
            {phase === 'selecting' && (
              <>
                <RetroButton
                  font="retro"
                  variant="default"
                  className="dialog-button-8bit price-cracker-btn-pull"
                  onClick={handlePull}
                  disabled={selectedOpponentIndex === null}
                >
                  PULL!
                </RetroButton>
                <RetroButton
                  font="retro"
                  variant="destructive"
                  className="dialog-button-8bit price-cracker-btn-cancel"
                  onClick={onCancel}
                >
                  CANCEL
                </RetroButton>
              </>
            )}

            {phase === 'result' && (
              <RetroButton
                font="retro"
                variant={isActivePlayerWinner ? 'default' : 'destructive'}
                className={`dialog-button-8bit price-cracker-btn-collect ${isActivePlayerWinner ? 'win' : 'lose'}`}
                onClick={handleCollect}
              >
                {isActivePlayerWinner ? 'COLLECT PRIZES!' : 'ACCEPT FATE'}
              </RetroButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
