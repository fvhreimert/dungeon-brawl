import { useEffect } from 'react'
import type { CardDefinition } from '@/data/cards'
import {
  Card,
  CardImage,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import './CardRevealModal.css'

interface CardRevealModalProps {
  card: CardDefinition
  onClose: () => void
}

export function CardRevealModal({ card, onClose }: CardRevealModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="card-reveal-backdrop" onClick={onClose}>
      <Card
        theme={card.theme}
        frameSrc={card.framePath}
        onClick={(e) => e.stopPropagation()}
      >
        <CardImage src={card.imagePath} alt={card.title} />
        <CardTitle>{card.title}</CardTitle>
        <CardDescription>{card.description}</CardDescription>
      </Card>
    </div>
  )
}
