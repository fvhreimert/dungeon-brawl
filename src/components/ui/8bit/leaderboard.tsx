import React from 'react'
import { cn } from '@/lib/utils'
import './leaderboard.css'

export interface LeaderboardPlayer {
  id: string
  name: string
  score: number
  rank?: number
  isCurrentPlayer?: boolean
  avatar?: string
  avatarFallback?: string
}

export interface LeaderboardProps {
  players: LeaderboardPlayer[]
  className?: string
  title?: string // Kept for compatibility but might not be used if we do custom header
  showAvatar?: boolean // Kept for compatibility
  showRank?: boolean // Kept for compatibility
  currentPlayerId?: string // Kept for compatibility
}

export function Leaderboard({ players, className }: LeaderboardProps) {
  // Ensure players are sorted by score desc
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]
  const others = sortedPlayers.slice(1)

  return (
    <div className={cn("pixel-leaderboard-container", className)}>
      {/* Winner Section - Congratulating the winner on top */}
      {winner && (
        <div className="pixel-winner-card">
          <div className="pixel-rank-badge rank-1">1</div>
          {winner.avatar && (
            <img 
              src={winner.avatar} 
              alt={winner.name} 
              className="pixel-avatar pixel-winner-avatar"
            />
          )}
          <div className="pixel-player-info">
            <div className="pixel-congrats-text">CONGRATULATIONS!</div>
            <div className="pixel-player-name pixel-winner-name">{winner.name}</div>
            <div className="pixel-player-score pixel-winner-score">{winner.score.toLocaleString()} PTS</div>
          </div>
        </div>
      )}

      {/* List of other players */}
      <div className="pixel-leaderboard-list">
        {others.map((player, index) => {
            // Rank is index + 2 because winner is 1
            const rank = index + 2 
            return (
                <div 
                  key={player.id} 
                  className={cn("pixel-player-row", player.isCurrentPlayer && "is-current")}
                >
                    <div className={cn("pixel-rank-badge", rank <= 3 && `rank-${rank}`)}>
                        {rank}
                    </div>
                    {player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.name} 
                          className="pixel-avatar"
                        />
                    ) : (
                        <div className="pixel-avatar" style={{background: '#333'}} />
                    )}
                    <div className="pixel-player-info">
                        <div className="pixel-player-name">{player.name}</div>
                        <div className="pixel-player-score">{player.score.toLocaleString()}</div>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  )
}

// Default export for compatibility
export default Leaderboard;