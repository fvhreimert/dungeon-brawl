import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player, Alliance } from '@/types/game'
import './PuppetMasterPlayerSelectModal.css'

type PuppetMasterPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  alliances?: readonly Alliance[]
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function PuppetMasterPlayerSelectModal({
  players,
  activePlayerIndex,
  alliances = [],
  onSelect,
  onCancel,
}: PuppetMasterPlayerSelectModalProps) {
  const isAllied = (playerIndex: number): boolean => {
    return alliances.some(
      (alliance) =>
        alliance.playerIndices.includes(activePlayerIndex) &&
        alliance.playerIndices.includes(playerIndex),
    )
  }

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
            const allied = isAllied(index)
            return (
              <div key={player.name} className={`puppet-master-select-item ${allied ? 'disabled' : ''}`}>
                {player.portrait && (
                  <img src={player.portrait} alt="" className="puppet-master-select-portrait" />
                )}
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="puppet-master-select-btn"
                  onClick={() => !allied && onSelect(index)}
                  disabled={allied}
                >
                  {player.name}
                  {allied && ' • allied'}
                </RetroButton>
              </div>
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
