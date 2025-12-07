import { useEffect } from 'react'
import type { CardInstance } from '@/types/game'
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
          <div className={`pixel-card ${card.theme}`}>
            <div className="card-backing-layer">
              <div className="card-inner">
                <div className="card-visual-well">
                  <img src={card.imagePath} alt={card.title} />
                </div>
                <div className="title-banner">
                  <div className="card-title">{card.title}</div>
                </div>
                <div className="card-description-box">
                  {card.description}
                </div>
              </div>
            </div>
            <div
              className="frame-overlay"
              style={{ backgroundImage: `url('${card.framePath}')` }}
            />
          </div>
        </div>

        <div className="stolen-card-hint">Click anywhere to close</div>
      </div>
    </div>
  )
}
