import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player, Alliance } from '@/types/game'
import './FelPlayerSelectModal.css'

type FelPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  alliances?: readonly Alliance[]
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function FelPlayerSelectModal({
  players,
  activePlayerIndex,
  alliances = [],
  onSelect,
  onCancel,
}: FelPlayerSelectModalProps) {
  const isAllied = (playerIndex: number): boolean => {
    return alliances.some(
      (alliance) =>
        alliance.playerIndices.includes(activePlayerIndex) &&
        alliance.playerIndices.includes(playerIndex),
    )
  }

  return (
    <div className="fel-player-select-backdrop" onClick={onCancel}>
      <div className="fel-player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="fel-player-select-title">Pick a victim</div>
        <div className="fel-player-list">
          {players.map((player, index) => {
            if (index === activePlayerIndex) return null
            const allied = isAllied(index)
            return (
              <div key={index} className={`fel-player-select-item ${allied ? 'disabled' : ''}`}>
                {player.portrait && (
                  <img src={player.portrait} alt="" className="fel-player-select-portrait" />
                )}
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="fel-player-select-btn"
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
          className="fel-player-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </RetroButton>
      </div>
    </div>
  )
}
