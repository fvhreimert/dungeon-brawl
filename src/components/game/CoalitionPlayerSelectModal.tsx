import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player, Alliance } from '@/types/game'
import './CoalitionPlayerSelectModal.css'

type CoalitionPlayerSelectModalProps = {
  players: readonly Player[]
  activePlayerIndex: number
  alliances: readonly Alliance[]
  onSelect: (playerIndex: number) => void
  onCancel: () => void
}

export function CoalitionPlayerSelectModal({
  players,
  activePlayerIndex,
  alliances,
  onSelect,
  onCancel,
}: CoalitionPlayerSelectModalProps) {
  const isAlreadyAllied = (playerIndex: number): boolean => {
    return alliances.some(
      (alliance) =>
        alliance.playerIndices.includes(activePlayerIndex) &&
        alliance.playerIndices.includes(playerIndex),
    )
  }

  return (
    <div className="coalition-player-select-backdrop" onClick={onCancel}>
      <div className="coalition-player-select-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="coalition-player-select-title">Form Alliance</div>
        <div className="coalition-player-list">
          {players.map((player, index) => {
            if (index === activePlayerIndex) return null
            const alreadyAllied = isAlreadyAllied(index)
            return (
              <div key={index} className={`coalition-player-select-item ${alreadyAllied ? 'disabled' : ''}`}>
                {player.portrait && (
                  <img src={player.portrait} alt="" className="coalition-player-select-portrait" />
                )}
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="coalition-player-select-btn"
                  onClick={() => !alreadyAllied && onSelect(index)}
                  disabled={alreadyAllied}
                >
                  {player.name}
                  {alreadyAllied && ' • allied'}
                </RetroButton>
              </div>
            )
          })}
        </div>
        <RetroButton
          font="retro"
          variant="destructive"
          className="coalition-player-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </RetroButton>
      </div>
    </div>
  )
}
