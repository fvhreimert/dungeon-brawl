import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player } from '@/types/game'
import './PlayerSelectModal.css'

type PlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function PlayerSelectModal({ players, activePlayerIndex, onSelect, onCancel }: PlayerSelectModalProps) {
  return (
    <div className="player-select-backdrop" onClick={onCancel}>
      <div className="player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="player-select-title">Choose Your Victim</div>
        <div className="player-list">
          {players.map((player, index) => {
             if (index === activePlayerIndex) return null;
             return (
              <RetroButton
                key={index}
                font="retro"
                variant="secondary"
                className="player-select-btn"
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
            className="cancel-btn"
            onClick={onCancel}
        >
            Cancel
        </RetroButton>
      </div>
    </div>
  )
}
