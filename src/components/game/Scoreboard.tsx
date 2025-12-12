import type { Player, Alliance, AllianceColor } from '@/types/game'
import inventoryIcon from '@/assets/images/ui/buttons/inventory.png'
import arrowUp from '@/assets/images/ui/buttons/arrow-up.png'
import arrowDown from '@/assets/images/ui/buttons/arrow-down.png'
import allianceRed from '@/assets/images/ui/alliance_red.png'
import allianceYellow from '@/assets/images/ui/alliance_yellow.png'
import allianceGreen from '@/assets/images/ui/alliance_green.png'
import allianceBlue from '@/assets/images/ui/alliance_blue.png'
import { calculatePassiveDeltaForPlayer } from '@/features/cards/cardEffectRegistry'
import { AnimatedScore } from './AnimatedScore'
import './Scoreboard.css'

const ALLIANCE_BANNERS: Record<AllianceColor, string> = {
  red: allianceRed,
  yellow: allianceYellow,
  green: allianceGreen,
  blue: allianceBlue,
}

type ScoreboardProps = {
  players: Player[]
  activePlayerIndex: number
  alliances: readonly Alliance[]
  onInventoryClick: (playerIndex: number) => void
  onSetActivePlayer: (playerIndex: number) => void
  onAdjustScoreClick: (playerIndex: number) => void
}

export function Scoreboard({
  players,
  activePlayerIndex,
  alliances,
  onInventoryClick,
  onSetActivePlayer,
  onAdjustScoreClick,
}: ScoreboardProps) {
  const getPlayerAlliances = (playerIndex: number): Alliance[] => {
    return alliances.filter((alliance) => alliance.playerIndices.includes(playerIndex))
  }

  return (
    <section className="scoreboard">
      {players.map((player, index) => {
        const passiveDelta = calculatePassiveDeltaForPlayer(player, players)
        const displayPassive = passiveDelta !== 0
        const playerAlliances = getPlayerAlliances(index)
        return (
          <div
            key={player.name}
            className={`score-card ${
              index === activePlayerIndex ? 'score-card-active' : ''
            } ${player.stats.isPuppeteered ? 'score-card-puppeted' : ''} ${
              player.stats.isPuppeteered && index === activePlayerIndex
                ? 'score-card-puppeted-active'
                : ''
            }`}
            onDoubleClick={() => onSetActivePlayer(index)}
          >
            {playerAlliances.length > 0 && (
              <div className="alliance-banners-container">
                {playerAlliances.map((alliance) => (
                  <div key={alliance.id} className="alliance-banner-wrapper">
                    <img
                      src={ALLIANCE_BANNERS[alliance.color]}
                      alt={`${alliance.color} alliance`}
                      className="alliance-banner"
                    />
                    <span className="alliance-turns">{alliance.turnsRemaining}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="score-card-content">
              <div className="player-name">{player.name}</div>
              <div className="score-card-row">
                {player.portrait && (
                  <img
                    src={player.portrait}
                    alt={`${player.name} portrait`}
                    className="player-portrait"
                  />
                )}
                <div className="player-info">
                  <div
                    className="player-score-clickable"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      onAdjustScoreClick(index)
                    }}
                  >
                    <AnimatedScore score={player.score} />
                  </div>
                  {displayPassive && (
                    <div
                      className={`player-passive-value ${
                        passiveDelta >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      <span
                        className="player-passive-arrow"
                        style={{
                          WebkitMaskImage: `url(${passiveDelta >= 0 ? arrowUp : arrowDown})`,
                          maskImage: `url(${passiveDelta >= 0 ? arrowUp : arrowDown})`,
                        }}
                      />
                      <span className="player-passive-amount">
                        {Math.abs(passiveDelta)}
                      </span>
                    </div>
                  )}
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
            </div>
          </div>
        )
      })}
    </section>
  )
}
