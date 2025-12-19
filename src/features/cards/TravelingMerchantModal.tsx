import { useEffect } from 'react'
import type { CardDefinition } from '@/data/cards'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import {
  Card,
  CardImage,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import '@/features/actions/cardJester/CardRevealModal.css'
import './TravelingMerchantModal.css'

interface TravelingMerchantModalProps {
  offers: CardDefinition[]
  onClose: () => void
  onSelect: (card: CardDefinition) => void
}

export function TravelingMerchantModal({
  offers,
  onClose,
  onSelect,
}: TravelingMerchantModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (offers.length === 0) return null

  return (
    <div className="traveling-merchant-backdrop" onClick={onClose}>
      <div className="traveling-merchant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="traveling-merchant-title">Traveling Merchant</div>
        <div className="traveling-merchant-subtitle">
          Choose a single treasure from the wares on display.
        </div>
        <div className="traveling-merchant-grid">
          {offers.map((card, index) => (
            <div key={`${card.id}-${index}`} className="card-wrapper traveling-merchant-card-wrapper">
              <Card theme={card.theme} frameSrc={card.framePath}>
                <CardImage src={card.imagePath} alt={card.title} />
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </Card>
              <RetroButton
                variant="secondary"
                size="default"
                font="retro"
                className="traveling-merchant-select"
                onClick={() => onSelect(card)}
              >
                Take
              </RetroButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
