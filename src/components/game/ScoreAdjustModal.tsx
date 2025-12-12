import { useState } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Player } from '@/types/game'
import './ScoreAdjustModal.css'

type ScoreAdjustModalProps = {
  player: Player
  onConfirm: (delta: number) => void
  onCancel: () => void
}

const PRESET_AMOUNTS = [-100, -50, -10, 10, 50, 100]

export function ScoreAdjustModal({ player, onConfirm, onCancel }: ScoreAdjustModalProps) {
  const [delta, setDelta] = useState(0)

  const handlePresetClick = (amount: number) => {
    setDelta((prev) => prev + amount)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setDelta(isNaN(value) ? 0 : value)
  }

  const handleConfirm = () => {
    if (delta !== 0) {
      onConfirm(delta)
    }
  }

  const newScore = player.score + delta

  return (
    <div className="score-adjust-backdrop" onClick={onCancel}>
      <div className="score-adjust-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="score-adjust-header">
          <div className="score-adjust-title">Adjust Score</div>
          <div className="score-adjust-player">
            {player.portrait && (
              <img src={player.portrait} alt="" className="score-adjust-portrait" />
            )}
            <span className="score-adjust-player-name">{player.name}</span>
          </div>
        </div>

        <div className="score-adjust-current">
          <span className="score-adjust-label">Current</span>
          <span className="score-adjust-value">{player.score}</span>
        </div>

        <div className="score-adjust-presets">
          {PRESET_AMOUNTS.map((amount) => (
            <RetroButton
              key={amount}
              font="retro"
              variant="secondary"
              className={`score-adjust-preset ${amount < 0 ? 'negative' : 'positive'}`}
              onClick={() => handlePresetClick(amount)}
            >
              {amount > 0 ? `+${amount}` : amount}
            </RetroButton>
          ))}
        </div>

        <div className="score-adjust-manual">
          <label className="score-adjust-input-label">Custom amount:</label>
          <input
            type="number"
            className="score-adjust-input"
            value={delta}
            onChange={handleInputChange}
            placeholder="0"
          />
        </div>

        <div className="score-adjust-preview">
          <span className="score-adjust-label">New Score</span>
          <span className={`score-adjust-new-value ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}`}>
            {newScore}
          </span>
          {delta !== 0 && (
            <span className={`score-adjust-delta ${delta > 0 ? 'positive' : 'negative'}`}>
              ({delta > 0 ? '+' : ''}{delta})
            </span>
          )}
        </div>

        <div className="score-adjust-actions">
          <RetroButton
            font="retro"
            variant="secondary"
            className="score-adjust-confirm"
            onClick={handleConfirm}
            disabled={delta === 0}
          >
            Confirm
          </RetroButton>
          <RetroButton
            font="retro"
            variant="destructive"
            className="score-adjust-cancel"
            onClick={onCancel}
          >
            Cancel
          </RetroButton>
        </div>
      </div>
    </div>
  )
}
