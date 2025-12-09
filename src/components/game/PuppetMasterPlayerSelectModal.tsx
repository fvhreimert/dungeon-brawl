import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player } from '@/types/game'
import './PuppetMasterPlayerSelectModal.css'

type PuppetMasterPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function PuppetMasterPlayerSelectModal({
  players,
  activePlayerIndex,
  onSelect,
  onCancel,
}: PuppetMasterPlayerSelectModalProps) {
  return (
    <div className="puppet-master-select-backdrop" onClick={onCancel}>
      <div className="puppet-master-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="puppet-master-select-header">
          <div className="puppet-master-select-title">Pull their strings</div>
          <p className="puppet-master-select-subtitle">
            Select a victim to bind. Their next turn will be chained to your chosen category.
          </p>
        </div>
        <div className="puppet-master-select-list">
          {players.map((player, index) => {
            if (index === activePlayerIndex) return null
            return (
              <RetroButton
                key={player.name}
                font="retro"
                variant="secondary"
                className="puppet-master-select-btn"
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
          className="puppet-master-select-cancel"
          onClick={onCancel}
        >
          Cancel
        </RetroButton>
      </div>
    </div>
  )
}
