import { useEffect } from 'react'
import type { CardDefinition } from '@/data/cards'
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
      <div className={`pixel-card ${card.theme}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Layer 1: Backing & Content */}
        <div className="card-backing-layer">
          <div className="card-inner">
            
            {/* Image Well */}
            <div className="card-visual-well">
              <img src={card.imagePath} alt={card.title} />
            </div>

            {/* Title Banner */}
            <div className="title-banner">
              <div className="card-title">{card.title}</div>
            </div>

            {/* Description Box */}
            <div className="card-description-box">
              {card.description}
            </div>
          </div>
        </div>

        {/* Layer 2: Frame Overlay (Top) */}
        <div 
            className="frame-overlay" 
            style={{ backgroundImage: `url('${card.framePath}')` }}
        ></div>

        <div className="close-hint">Click anywhere to close</div>
      </div>
    </div>
  )
}
