import type { Player } from '@/types/game'
import { gameConfig } from '@/config/gameConfig'
import inventoryIcon from '@/assets/images/ui/buttons/inventory.png'
import arrowUp from '@/assets/images/ui/buttons/arrow-up.png'
import arrowDown from '@/assets/images/ui/buttons/arrow-down.png'
import './Scoreboard.css'

type ScoreboardProps = {
  players: Player[]
  activePlayerIndex: number
  onInventoryClick: (playerIndex: number) => void
}

export function Scoreboard({ players, activePlayerIndex, onInventoryClick }: ScoreboardProps) {
  return (
    <section className="scoreboard">
      {players.map((player, index) => (
        <div
          key={player.name}
          className={`score-card ${
            index === activePlayerIndex ? 'score-card-active' : ''
          }`}
        >
          <div className="score-card-content">
            <div className="player-info">
                <div className="player-name">
                    <span aria-hidden>☠</span>
                    {player.name}
                </div>
                <div className="player-score-row">
                  <div className="player-score">{player.score}</div>
                  {player.stats.passivePointsPerTurn !== 0 && (
                    <div
                      className={`player-passive-value ${
                        player.stats.passivePointsPerTurn >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      <span
                        className="player-passive-arrow"
                        style={{
                          WebkitMaskImage: `url(${player.stats.passivePointsPerTurn >= 0 ? arrowUp : arrowDown})`,
                          maskImage: `url(${player.stats.passivePointsPerTurn >= 0 ? arrowUp : arrowDown})`,
                        }}
                      />
                      <span className="player-passive-amount">
                        {Math.abs(player.stats.passivePointsPerTurn)}
                      </span>
                    </div>
                  )}
                </div>
            </div>
            
            <button 
                className="inventory-btn"
                onClick={(e) => {
                    e.stopPropagation()
                    onInventoryClick(index)
                }}
                title="View Inventory"
            >
                <img src={inventoryIcon} alt="Inventory" />
            </button>
          </div>

          <div className="score-meter">
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(
                  (player.score / gameConfig.gameplay.maxScoreForMeter) * 100,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </section>
  )
}
