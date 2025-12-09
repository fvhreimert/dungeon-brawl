import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Player, CardInstance } from '@/types/game'
import { getCardEffectDefinition } from '@/features/cards/cardEffectRegistry'
import './InventoryModal.css'
import crossIcon from '@/assets/images/ui/cross.png'

interface InventoryModalProps {
  player: Player
  onClose: () => void
  onUseCard?: (card: CardInstance) => void
  isActivePlayer?: boolean
}

export function InventoryModal({
  player,
  onClose,
  onUseCard,
  isActivePlayer = false,
}: InventoryModalProps) {
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

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hoverRect, setHoverRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const clearHover = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoveredElementRef.current = null
    setHoveredCardId(null)
    setHoverRect(null)
  }, [setHoveredCardId, setHoverRect])

  const handleHoverStart = useCallback(
    (cardId: string, target: HTMLElement) => {
      clearHover()
      hoveredElementRef.current = target
      hoverTimerRef.current = setTimeout(() => {
        if (hoveredElementRef.current !== target) return
        const rect = target.getBoundingClientRect()
        setHoveredCardId(cardId)
        setHoverRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
      }, 450)
    },
    [clearHover],
  )

  const handleHoverEnd = useCallback(() => {
    clearHover()
  }, [clearHover])

  const inventoryDescriptionResolvers: Record<string, (card: CardInstance) => string> = {
    soul_burst: (card) => {
      const stored = typeof card.state?.storedDamage === 'number' ? card.state.storedDamage : 0
      return `Activate to steal *${stored}* pts from a foe.`
    },
    niffler: (card) => {
      const gained = typeof card.state?.totalGained === 'number' ? card.state.totalGained : 0
      return `+25 pts/turn\n*${gained}* pts gained total`
    },
    cursed_coin: (card) => {
      const turns = typeof card.state?.turnsRemaining === 'number' ? card.state.turnsRemaining : 0
      return `Loses 50 pts per turn\n*${turns}* turns remaining`
    },
    beggar: (card) => {
      const stolen = typeof card.state?.totalStolen === 'number' ? card.state.totalStolen : 0
      return `Steals 10 pts from each foe/turn\n*${stolen}* pts stolen total`
    },
  }

  const getInventoryDescription = (card: CardInstance) =>
    inventoryDescriptionResolvers[card.id]?.(card) ?? card.inventoryDescription ?? card.description

  const hoveredCard = hoveredCardId
    ? player.inventory.find((card) => card.instanceId === hoveredCardId)
    : null
  const hoverStyle = hoverRect
    ? (() => {
        const HOVER_CARD_WIDTH = 240
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
        const desiredLeft = hoverRect.left + hoverRect.width + 12
        const maxLeft = viewportWidth
          ? Math.max(viewportWidth - HOVER_CARD_WIDTH - 16, 8)
          : desiredLeft
        const left = viewportWidth ? Math.min(desiredLeft, maxLeft) : desiredLeft
        const topBase = Math.max(hoverRect.top, 8)
        const maxTop = viewportHeight ? Math.max(viewportHeight - 140, 8) : topBase
        const top = Math.min(topBase, maxTop)

        return { top, left }
      })()
    : null
  const hoverCardElement =
    hoveredCard && hoverStyle ? (
      <div className="inventory-hover-card" style={hoverStyle}>
        <div className="hover-title">{hoveredCard.title}</div>
        <div className="hover-description">{hoveredCard.description}</div>
      </div>
    ) : null

  useEffect(() => {
    const handleScrollOrResize = () => {
      clearHover()
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('wheel', handleScrollOrResize, { capture: true })
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('wheel', handleScrollOrResize, { capture: true })
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [clearHover])

  const hoverPortal =
    hoverCardElement && typeof document !== 'undefined'
      ? createPortal(hoverCardElement, document.body)
      : null

  return (
    <div className="inventory-backdrop" onClick={onClose}>
      <div className="inventory-container" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-border-bg" />
        <div className="inventory-inner">
          <div className="inventory-header">
            <div className="inventory-text-content">
              <div className="inventory-title">{player.name}'s Inventory</div>
              <div className="inventory-count">{player.inventory.length} items</div>
            </div>
            <button className="close-inventory-btn" onClick={onClose}>
              <img src={crossIcon} alt="Close" />
            </button>
          </div>

          <div className="inventory-list">
            {player.inventory.length === 0 ? (
              <div className="inventory-empty">
                <p>This bag is empty...</p>
              </div>
            ) : (
              <div className="card-grid">
                {player.inventory.map((card, index) => {
                  const effect = getCardEffectDefinition(card.id)
                  const canActivate =
                    isActivePlayer &&
                    onUseCard &&
                    Boolean(effect?.handlers?.activated)

                  return (
                    <div
                      key={`${card.id}-${index}`}
                      className="card-wrapper"
                      onMouseEnter={(event) =>
                        handleHoverStart(card.instanceId, event.currentTarget as HTMLElement)
                      }
                      onMouseLeave={handleHoverEnd}
                      onClick={(event) => {
                        event.preventDefault()
                        if (canActivate && onUseCard) {
                          onUseCard(card)
                        }
                      }}
                    >
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
                              {getInventoryDescription(card)}
                            </div>
                          </div>
                        </div>
                        <div
                          className="frame-overlay"
                          style={{ backgroundImage: `url('${card.framePath}')` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="inventory-footer">
              <div className="close-hint">Press ESC to close</div>
          </div>
        </div>
      </div>
      {hoverPortal}
    </div>
  )
}
