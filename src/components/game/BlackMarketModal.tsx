import { useState, useCallback, useEffect } from 'react'
import type { CardDefinition } from '@/data/cards'
import {
  Card,
  CardImage,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card"
import './BlackMarketModal.css'

import rerollIcon from '@/assets/images/ui/reroll.png'
import rerollPressedIcon from '@/assets/images/ui/reroll_pressed.png'

interface BlackMarketModalProps {
  playerName: string
  cards: CardDefinition[]
  rerollsRemaining: number
  onReroll: (cardIndex: number, currentCards: CardDefinition[]) => CardDefinition | null
  onAccept: (cards: CardDefinition[]) => void
  isEntering?: boolean
}

export function BlackMarketModal({
  cards: initialCards,
  rerollsRemaining,
  onReroll,
  onAccept,
  isEntering = false
}: BlackMarketModalProps) {
  const [cards, setCards] = useState<CardDefinition[]>(initialCards)
  const [pressedReroll, setPressedReroll] = useState<number | null>(null)
  const [rerollingIndex, setRerollingIndex] = useState<number | null>(null)

  // Sync internal state when props change (e.g., during undo)
  useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  const handleReroll = useCallback((index: number) => {
    if (rerollsRemaining <= 0 || rerollingIndex !== null) return

    setRerollingIndex(index)
    setPressedReroll(index)

    // Swap card at the midpoint of animation (when card is invisible)
    setTimeout(() => {
      // Pass current cards to onReroll for undo support
      const newCard = onReroll(index, cards)
      if (newCard) {
        setCards(prev => {
          const updated = [...prev]
          updated[index] = newCard
          return updated
        })
      }
      setPressedReroll(null)
    }, 175)

    // Clear rerolling state after animation completes
    setTimeout(() => {
      setRerollingIndex(null)
    }, 350)
  }, [rerollsRemaining, rerollingIndex, onReroll, cards])

  const handleAccept = useCallback(() => {
    onAccept(cards)
  }, [cards, onAccept])

  return (
    <section className={`board-shell black-market-shell ${isEntering ? 'black-market-entering' : ''}`}>
      {/* Placeholder for category row height */}
      <div className="black-market-header-spacer" />

      {/* Cards grid area - matches question-grid */}
      <div className="black-market-grid" data-card-count={cards.length}>
        <div className="black-market-cards-row">
          {cards.map((card, index) => (
            <div key={`card-slot-${index}`} className="black-market-card-wrapper">
              <Card
                theme={card.theme}
                frameSrc={card.framePath}
                className={`black-market-card-item ${rerollingIndex === index ? 'card-rerolling' : ''}`}
              >
                <CardImage src={card.imagePath} alt={card.title} />
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </Card>

              <button
                type="button"
                className={`reroll-button ${rerollsRemaining <= 0 ? 'reroll-disabled' : ''}`}
                onClick={() => handleReroll(index)}
                disabled={rerollsRemaining <= 0 || rerollingIndex !== null}
                onMouseDown={() => setPressedReroll(index)}
                onMouseUp={() => setPressedReroll(null)}
                onMouseLeave={() => setPressedReroll(null)}
              >
                <img
                  src={pressedReroll === index ? rerollPressedIcon : rerollIcon}
                  alt="Reroll"
                  className="reroll-icon"
                />
              </button>
            </div>
          ))}
        </div>

        {/* Accept button in lower right */}
        <button
          type="button"
          className="black-market-accept-button"
          onClick={handleAccept}
        >
          Accept
        </button>
      </div>
    </section>
  )
}
