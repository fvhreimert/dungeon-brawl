import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player } from '@/types/game'
import './FelPlayerSelectModal.css'

type FelPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function FelPlayerSelectModal({
  players,
  activePlayerIndex,
  onSelect,
  onCancel,
}: FelPlayerSelectModalProps) {
  return (
    <div className="fel-player-select-backdrop" onClick={onCancel}>
      <div className="fel-player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="fel-player-select-title">Pick a victim</div>
        <div className="fel-player-list">
          {players.map((player, index) => {
            if (index === activePlayerIndex) return null
            return (
              <RetroButton
                key={index}
                font="retro"
                variant="secondary"
                className="fel-player-select-btn"
                onClick={() => onSelect(index)}
              >
                {player.name}
              </RetroButton>
            )
          })}
        </div>
        <RetroButton
          font="retro"
          variant="destructive"
          className="fel-player-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </RetroButton>
      </div>
    </div>
  )
}
