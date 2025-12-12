import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player, Alliance } from '@/types/game'
import './PlayerSelectModal.css'

type PlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  alliances?: readonly Alliance[]
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function PlayerSelectModal({ players, activePlayerIndex, alliances = [], onSelect, onCancel }: PlayerSelectModalProps) {
  const isAllied = (playerIndex: number): boolean => {
    return alliances.some(
      (alliance) =>
        alliance.playerIndices.includes(activePlayerIndex) &&
        alliance.playerIndices.includes(playerIndex),
    )
  }

  return (
    <div className="player-select-backdrop" onClick={onCancel}>
      <div className="player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="player-select-title">Choose Your Victim</div>
        <div className="player-list">
          {players.map((player, index) => {
             if (index === activePlayerIndex) return null;
             const allied = isAllied(index)
             return (
              <div key={index} className={`player-select-item ${allied ? 'disabled' : ''}`}>
                {player.portrait && (
                  <img src={player.portrait} alt="" className="player-select-portrait" />
                )}
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="player-select-btn"
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
            className="cancel-btn"
            onClick={onCancel}
        >
            Cancel
        </RetroButton>
      </div>
    </div>
  )
}
