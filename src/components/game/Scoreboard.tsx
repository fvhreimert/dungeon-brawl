import type { Player } from '@/types/game'
import { gameConfig } from '@/config/gameConfig'

type ScoreboardProps = {
  players: Player[]
  activePlayerIndex: number
}

export function Scoreboard({ players, activePlayerIndex }: ScoreboardProps) {
  return (
    <section className="scoreboard">
      {players.map((player, index) => (
        <div
          key={player.name}
          className={`score-card ${
            index === activePlayerIndex ? 'score-card-active' : ''
          }`}
        >
          <div className="player-name">
            <span aria-hidden>☠</span>
            {player.name}
          </div>
          <div className="player-score">{player.score}</div>
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
