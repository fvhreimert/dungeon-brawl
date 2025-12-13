import { useEffect } from 'react'
import type { CardInstance } from '@/types/game'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { TREASURE_SET_CARD_IDS } from '@/config/gameConfig'
import './TreasureSetModal.css'

const TREASURE_SET_IDS = TREASURE_SET_CARD_IDS

interface TreasureSetModalProps {
  inventory: CardInstance[]
  onStartDig: (cardIds: string[]) => void
  onClose: () => void
}

export function TreasureSetModal({ inventory, onStartDig, onClose }: TreasureSetModalProps) {
  const treasureCards = TREASURE_SET_IDS.map((id) =>
    inventory.find((card) => card.id === id) ?? null
  )
  const hasAll = treasureCards.every((card) => card !== null)

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

  const handleStartDig = () => {
    if (!hasAll) return
    const instanceIds = treasureCards
      .filter((card): card is CardInstance => card !== null)
      .map((card) => card.instanceId)
    onStartDig(instanceIds)
  }

  return (
    <div className="treasure-set-backdrop" onClick={onClose}>
      <div className="treasure-set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="treasure-set-header">
          <div className="treasure-set-title">Treasure Set</div>
          <div className="treasure-set-subtitle">
            Collect all three artifacts to unearth the treasure
          </div>
        </div>

        <div className="treasure-cards-container">
          {TREASURE_SET_IDS.map((id, index) => {
            const card = treasureCards[index]
            const isOwned = card !== null

            return (
              <div
                key={id}
                className={`treasure-card-slot ${isOwned ? 'owned' : 'missing'}`}
              >
                {isOwned ? (
                  <div className={`pixel-card ${card.theme}`}>
                    <div className="card-backing-layer">
                      <div className="card-inner">
                        <div className="card-visual-well">
                          <img src={card.imagePath} alt={card.title} />
                        </div>
                        <div className="title-banner">
                          <div className="card-title">{card.title}</div>
                        </div>
                      </div>
                    </div>
                    <div
                      className="frame-overlay"
                      style={{ backgroundImage: `url('${card.framePath}')` }}
                    />
                  </div>
                ) : (
                  <div className="missing-card-placeholder">
                    <div className="missing-icon">?</div>
                    <div className="missing-label">
                      {id === 'shovel' && 'Shovel'}
                      {id === 'compass' && 'Compass'}
                      {id === 'treasure_map' && 'Map'}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="treasure-reward-section">
          <div className="reward-label">Potential Reward</div>
          <div className="reward-value">
            <span className="reward-amount">???</span>
            <span className="reward-pts">gold</span>
          </div>
        </div>

        <div className="treasure-set-actions">
          {hasAll ? (
            <RetroButton
              variant="default"
              size="lg"
              font="retro"
              className="treasure-combine-btn"
              onClick={handleStartDig}
            >
              Dig for Treasure
            </RetroButton>
          ) : (
            <div className="treasure-incomplete-hint">
              {treasureCards.filter((c) => c !== null).length} of 3 artifacts collected
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
