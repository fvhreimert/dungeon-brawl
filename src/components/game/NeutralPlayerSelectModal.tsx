import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player } from '@/types/game'
import './NeutralPlayerSelectModal.css'

type NeutralPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function NeutralPlayerSelectModal({
  players,
  activePlayerIndex,
  onSelect,
  onCancel,
}: NeutralPlayerSelectModalProps) {
  return (
    <div className="neutral-player-select-backdrop" onClick={onCancel}>
      <div className="neutral-player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="neutral-player-select-title">Choose a target</div>
        <div className="neutral-player-list">
          {players.map((player, index) => {
            if (index === activePlayerIndex) return null
            const hasCards = player.inventory.length > 0
            return (
              <RetroButton
                key={index}
                font="retro"
                variant="secondary"
                className="neutral-player-select-btn"
                onClick={() => hasCards && onSelect(index)}
                disabled={!hasCards}
              >
                {player.name}
                {!hasCards && ' • empty'}
              </RetroButton>
            )
          })}
        </div>
        <RetroButton
          font="retro"
          variant="destructive"
          className="neutral-player-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </RetroButton>
      </div>
    </div>
  )
}
