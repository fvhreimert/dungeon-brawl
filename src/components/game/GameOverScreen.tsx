import { useMemo } from 'react'
import { Leaderboard, type LeaderboardPlayer } from '@/components/ui/8bit/leaderboard'
import type { Player } from '@/types/game'
import './GameOverScreen.css'

type GameOverScreenProps = {
  players: Player[]
  onViewStats: () => void
  onPlayAgain: () => void
}

export function GameOverScreen({ players, onViewStats, onPlayAgain }: GameOverScreenProps) {
  const leaderboardPlayers: LeaderboardPlayer[] = useMemo(() => {
    return players.map((player, index) => ({
      id: `player-${index}`,
      name: player.name,
      score: player.score,
      avatar: player.portrait,
      avatarFallback: player.name.charAt(0).toUpperCase(),
    }))
  }, [players])

  const winner = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score)
    return sorted[0]
  }, [players])

  return (
    <div className="game-over-screen">
      <div className="game-over-backdrop" />

      <div className="game-over-content">
        <div className="game-over-header">
          <div className="winner-announcement">
            <span className="winner-name">{winner?.name}</span>
            <span className="winner-label">WINS!</span>
          </div>
          <div className="winner-score">{winner?.score.toLocaleString()} points</div>
        </div>

        <Leaderboard
          players={leaderboardPlayers}
          title="FINAL STANDINGS"
          showAvatar={true}
          showRank={true}
          className="game-over-leaderboard"
        />

        <div className="game-over-actions">
          <button
            className="stats-button"
            onClick={onViewStats}
          >
            VIEW STATS
          </button>
          <button
            className="play-again-button"
            onClick={onPlayAgain}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  )
}
