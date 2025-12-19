import { useEffect } from 'react'
import type { CardDefinition } from '@/data/cards'
import {
  Card,
  CardImage,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import './TurnStartModal.css'

interface TurnStartModalProps {
  playerName: string
  cards: CardDefinition[]
  onClose: () => void
}

export function TurnStartModal({ playerName, cards, onClose }: TurnStartModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        onClose()
      }
    }

    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="turn-start-backdrop" onClick={onClose}>
      <div className="turn-start-content" onClick={(e) => e.stopPropagation()}>
        <h1 className="turn-start-title">{playerName}'s Turn</h1>
        <div className="turn-start-cards-container">
          {cards.map((card, index) => (
            <Card
              key={`${card.id}-${index}`}
              theme={card.theme}
              frameSrc={card.framePath}
              onClick={(e) => e.stopPropagation()}
              className="turn-start-card-item"
            >
              <CardImage src={card.imagePath} alt={card.title} />
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </Card>
          ))}
        </div>
        <p className="turn-start-hint">Click anywhere or press ESC to continue</p>
      </div>
    </div>
  )
}
