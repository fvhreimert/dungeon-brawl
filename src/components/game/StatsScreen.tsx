import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts'
import type { Player, GameMetrics, ActionId } from '@/types/game'
import './StatsScreen.css'

type StatsScreenProps = {
  players: Player[]
  gameMetrics: GameMetrics
  gameEndTime: number
  onBack: () => void
}

const PLAYER_COLORS = ['#FF6B6B', '#54A0FF', '#FFE66D', '#2ECC71']

const ACTION_LABELS: Record<ActionId, string> = {
  card_jester: 'Card Jester',
  mad_seer: 'Mad Seer',
  blood_sacrifice: 'Blood Sacrifice',
  frog_of_fate: 'Frog of Fate',
  golden_idol: 'Golden Idol',
  web: 'Spider Web',
}

export function StatsScreen({ players, gameMetrics, gameEndTime, onBack }: StatsScreenProps) {
  // Transform turn snapshots into chart data
  const chartData = useMemo(() => {
    if (gameMetrics.turnSnapshots.length === 0) {
      // If no snapshots, create initial state
      return [{ turn: 0, ...players.reduce((acc, p, i) => ({ ...acc, [`player${i}`]: p.score }), {}) }]
    }

    return gameMetrics.turnSnapshots.map((snapshot) => {
      const dataPoint: Record<string, number> = { turn: snapshot.turnNumber }
      snapshot.playerScores.forEach((score, index) => {
        dataPoint[`player${index}`] = score
      })
      return dataPoint
    })
  }, [gameMetrics.turnSnapshots, players])

  // Calculate game duration
  const gameDuration = useMemo(() => {
    const durationMs = gameEndTime - gameMetrics.gameStartTime
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }, [gameEndTime, gameMetrics.gameStartTime])

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <h1 className="stats-title">GAME STATISTICS</h1>
        <button onClick={onBack} className="stats-back-button">
          BACK
        </button>
      </div>

      <div className="stats-content">
        {/* Game Overview */}
        <div className="stats-section overview-section">
          <h2 className="section-title">GAME OVERVIEW</h2>
          <div className="overview-grid">
            <div className="stat-box">
              <span className="stat-value">{gameMetrics.totalTurns}</span>
              <span className="stat-label">Total Turns</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{gameDuration}</span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{gameMetrics.cardUsage.length}</span>
              <span className="stat-label">Cards Played</span>
            </div>
          </div>
        </div>

        {/* Score Chart */}
        <div className="stats-section chart-section">
          <h2 className="section-title">SCORE PROGRESSION</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="turn"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  stroke="#666"
                  tick={{ fill: '#666', fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  stroke="#666"
                  width={50}
                  tick={{ fill: '#666', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '2px solid #333',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                  }}
                  labelStyle={{ color: '#888' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '12px' }}
                  content={() => (
                    <div className="chart-legend">
                      {players.map((player, index) => {
                        const color = PLAYER_COLORS[index % PLAYER_COLORS.length]
                        return (
                          <div key={index} className="chart-legend-item">
                            {player.portrait && (
                              <img
                                src={player.portrait}
                                alt={player.name}
                                className="chart-legend-portrait"
                              />
                            )}
                            <span
                              className="chart-legend-color"
                              style={{ background: color }}
                            />
                            <span
                              className="chart-legend-name"
                              style={{ color }}
                            >
                              {player.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                />
                {players.map((_, index) => (
                  <Line
                    key={`player${index}`}
                    type="monotone"
                    dataKey={`player${index}`}
                    name={`player${index}`}
                    stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PLAYER_COLORS[index % PLAYER_COLORS.length] }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Player Stats */}
        <div className="stats-section players-section">
          <h2 className="section-title">PLAYER STATISTICS</h2>
          <div className="player-stats-grid">
            {players.map((player, index) => {
              const metrics = gameMetrics.playerMetrics[index]
              const accuracy = metrics.questionsAnswered > 0
                ? Math.round((metrics.questionsCorrect / metrics.questionsAnswered) * 100)
                : 0

              return (
                <div
                  key={index}
                  className="player-stat-card"
                  style={{ borderColor: PLAYER_COLORS[index % PLAYER_COLORS.length] }}
                >
                  <div className="player-stat-header">
                    {player.portrait && (
                      <img src={player.portrait} alt={player.name} className="player-avatar" />
                    )}
                    <span className="player-name" style={{ color: PLAYER_COLORS[index % PLAYER_COLORS.length] }}>
                      {player.name}
                    </span>
                  </div>

                  <div className="player-stat-body">
                    <div className="stat-row">
                      <span className="stat-key">Final Score</span>
                      <span className="stat-val">{player.score.toLocaleString()}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Questions</span>
                      <span className="stat-val">
                        {metrics.questionsCorrect}/{metrics.questionsAnswered} ({accuracy}%)
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Question Pts</span>
                      <span className="stat-val positive">+{metrics.totalQuestionPointsGained}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Damage Dealt</span>
                      <span className="stat-val">{metrics.damageDealt}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Damage Taken</span>
                      <span className="stat-val negative">{metrics.damageTaken}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Passive Income</span>
                      <span className="stat-val positive">+{metrics.passiveIncomeGained}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Cards Used</span>
                      <span className="stat-val">{metrics.cardsUsed}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Isopods Fed</span>
                      <span className="stat-val">{metrics.isopodsFed}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Sheep Fed</span>
                      <span className="stat-val">{metrics.sheepFed}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Golden Idol Pts</span>
                      <span className="stat-val positive">+{metrics.goldenIdolPointsGained}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Alliances</span>
                      <span className="stat-val">{metrics.alliancesFormed}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Tiles Frozen</span>
                      <span className="stat-val">{metrics.tilesFrozen}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Treasures</span>
                      <span className="stat-val">{metrics.treasureSetsCompleted}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Best Gain</span>
                      <span className="stat-val positive">+{metrics.highestSingleGain}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Worst Loss</span>
                      <span className="stat-val negative">-{metrics.biggestLoss}</span>
                    </div>
                  </div>

                  {/* Action Usage */}
                  <div className="player-actions-section">
                    <span className="actions-title">Actions Used</span>
                    <div className="actions-list">
                      {Object.entries(metrics.actionsUsed).map(([actionId, count]) => (
                        <div key={actionId} className="action-usage">
                          <span className="action-name">{ACTION_LABELS[actionId as ActionId] || actionId}</span>
                          <span className="action-count">x{count}</span>
                        </div>
                      ))}
                      {Object.keys(metrics.actionsUsed).length === 0 && (
                        <span className="no-actions">None</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
