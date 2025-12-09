import { useEffect } from 'react'
import type { CardDefinition } from '@/data/cards'
import { Button as RetroButton } from '@/components/ui/8bit/button'
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
      document.body.style.overflow = 'unset'
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
              <div className={`pixel-card ${card.theme}`}>
                <div className="card-backing-layer">
                  <div className="card-inner">
                    <div className="card-visual-well">
                      <img src={card.imagePath} alt={card.title} />
                    </div>
                    <div className="title-banner">
                      <div className="card-title">{card.title}</div>
                    </div>
                    <div className="card-description-box">{card.description}</div>
                  </div>
                </div>
                <div
                  className="frame-overlay"
                  style={{ backgroundImage: `url('${card.framePath}')` }}
                />
              </div>
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
