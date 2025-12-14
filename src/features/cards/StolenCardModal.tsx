import { useEffect } from 'react'
import type { CardInstance } from '@/types/game'
import {
  Card,
  CardImage,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import './StolenCardModal.css'

interface StolenCardModalProps {
  card: CardInstance
  fromPlayerName: string
  onClose: () => void
}

export function StolenCardModal({ card, fromPlayerName, onClose }: StolenCardModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="stolen-card-backdrop" onClick={onClose}>
      <div className="stolen-card-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="stolen-card-title">You stole {card.title}</div>
        <div className="stolen-card-subtitle">from {fromPlayerName}</div>

        <div className="stolen-card-art">
          <Card theme={card.theme} frameSrc={card.framePath}>
            <CardImage src={card.imagePath} alt={card.title} />
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </Card>
        </div>

        <div className="stolen-card-hint">Click anywhere to close</div>
      </div>
    </div>
  )
}
