import { useMemo } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { CardInstance } from '@/types/game'
import crossIcon from '@/assets/images/ui/cross.png'
import './SpiderFeedingModal.css'

type SpiderFeedingModalProps = {
  spiderImage: string
  spiderIndex: number
  inventory: CardInstance[]
  onFeedIsopod: (isopodInstanceId: string) => void
  onFeedSheep: (sheepInstanceId: string) => void
  onClose: () => void
}

export function SpiderFeedingModal({
  spiderImage,
  spiderIndex,
  inventory,
  onFeedIsopod,
  onFeedSheep,
  onClose,
}: SpiderFeedingModalProps) {
  const isopods = useMemo(
    () => inventory.filter((card) => card.id === 'isopod'),
    [inventory]
  )

  const sheep = useMemo(
    () => inventory.filter((card) => card.id === 'sheep'),
    [inventory]
  )

  const canFeedIsopod = isopods.length > 0
  const isMaxSize = spiderIndex >= 8
  const canFeedSheep = isMaxSize && sheep.length > 0

  const handleFeedIsopod = () => {
    if (isopods.length > 0) {
      onFeedIsopod(isopods[0].instanceId)
    }
  }

  const handleFeedSheep = () => {
    if (sheep.length > 0 && isMaxSize) {
      onFeedSheep(sheep[0].instanceId)
    }
  }

  return (
    <div className="spider-feeding-backdrop" onClick={onClose}>
      <div className="spider-feeding-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="spider-feeding-close" onClick={onClose}>
          <img src={crossIcon} alt="Close" />
        </button>

        <div className="spider-feeding-title">Spider's Lair</div>

        <div className="spider-feeding-content">
          <div className="spider-display">
            <div className="spider-web-bg" />
            <img
              src={spiderImage}
              alt="Spider"
              className="spider-preview"
              style={{
                width: spiderIndex === 8 ? '280px' : `${70 + (spiderIndex - 1) * 25}px`,
              }}
            />
          </div>

          <div className="spider-progress-bar">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={`spider-progress-tick ${i < spiderIndex ? 'filled' : ''} ${i === spiderIndex - 1 ? 'current' : ''}`}
              />
            ))}
          </div>

          <div className="feeding-section">
            <div className="feeding-info">
              <div className="feed-counts">
                <span className="feed-label">
                  Isopods: <strong>{isopods.length}</strong>
                </span>
                {isMaxSize && (
                  <span className="feed-label sheep-label">
                    Sheep: <strong>{sheep.length}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="feeding-actions">
              <RetroButton
                font="retro"
                variant="default"
                className="dialog-button-8bit feed-btn"
                onClick={handleFeedIsopod}
                disabled={!canFeedIsopod}
              >
                FEED ISOPOD
              </RetroButton>
              {isMaxSize && (
                <RetroButton
                  font="retro"
                  variant="default"
                  className="dialog-button-8bit feed-btn sheep-btn"
                  onClick={handleFeedSheep}
                  disabled={!canFeedSheep}
                >
                  FEED SHEEP
                </RetroButton>
              )}
              <RetroButton
                font="retro"
                variant="secondary"
                className="dialog-button-8bit close-btn"
                onClick={onClose}
              >
                LEAVE
              </RetroButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
