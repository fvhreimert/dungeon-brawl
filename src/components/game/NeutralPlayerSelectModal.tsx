import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player, Alliance } from '@/types/game'
import './NeutralPlayerSelectModal.css'

type NeutralPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  alliances?: readonly Alliance[]
  onSelect: (playerIndex: number) => void
  onCancel: () => void
  requireCards?: boolean
}

export function NeutralPlayerSelectModal({
  players,
  activePlayerIndex,
  alliances = [],
  onSelect,
  onCancel,
  requireCards = true,
}: NeutralPlayerSelectModalProps) {
  const isAllied = (playerIndex: number): boolean => {
    return alliances.some(
      (alliance) =>
        alliance.playerIndices.includes(activePlayerIndex) &&
        alliance.playerIndices.includes(playerIndex),
    )
  }

  return (
    <div className="neutral-player-select-backdrop" onClick={onCancel}>
      <div className="neutral-player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="neutral-player-select-title">Choose a target</div>
        <div className="neutral-player-list">
          {players.map((player, index) => {
            if (index === activePlayerIndex) return null
            const hasCards = player.inventory.length > 0
            const allied = isAllied(index)
            const isDisabled = (requireCards && !hasCards) || allied
            return (
              <div key={index} className={`neutral-player-select-item ${isDisabled ? 'disabled' : ''}`}>
                {player.portrait && (
                  <img src={player.portrait} alt="" className="neutral-player-select-portrait" />
                )}
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="neutral-player-select-btn"
                  onClick={() => !isDisabled && onSelect(index)}
                  disabled={isDisabled}
                >
                  {player.name}
                  {allied ? ' • allied' : (requireCards && !hasCards) ? ' • empty' : ''}
                </RetroButton>
              </div>
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
