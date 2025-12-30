import { useState } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import pentagram from '@/assets/images/actions/pentagram.png'
import clickSound from '@/assets/sounds/UI/click.mp3'
import './BloodSacrificeModal.css'

type BloodSacrificeModalProps = {
  playerScore: number
  onConfirm: (amount: number) => void
  onCancel: () => void
  isUpgraded?: boolean
  maxSacrifice?: number
  maxSacrificeUpgraded?: number
}

export function BloodSacrificeModal({
  playerScore,
  onConfirm,
  onCancel,
  isUpgraded = false,
  maxSacrifice = 100,
  maxSacrificeUpgraded = 200,
}: BloodSacrificeModalProps) {
  const capMaxSacrifice = isUpgraded ? maxSacrificeUpgraded : maxSacrifice;
  // Initial amount to sacrifice. If playerScore is 0, start at 0. Otherwise, start at 1 or playerScore if less than 1.
  const [amount, setAmount] = useState(Math.max(0, Math.min(1, playerScore))); 

  // Calculate progress from 0 to 1 based on slider's visual range
  const progress = capMaxSacrifice > 0 ? (amount / capMaxSacrifice) : 0;

  const playTick = () => {
    const audio = new Audio(clickSound)
    audio.volume = 0.15
    audio.play().catch(() => {})
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value)
    // User cannot select more than their current score
    val = Math.min(val, playerScore)
    if (val !== amount) {
      setAmount(val)
      playTick()
    }
  }

  const canSacrifice = amount > 0 && amount <= playerScore;

  return (
    <div className="blood-sacrifice-backdrop" onClick={onCancel}>
      <div className="blood-sacrifice-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="blood-sacrifice-title">Blood Sacrifice{isUpgraded ? ' (Upgraded)' : ''}</div>
        <div className="blood-sacrifice-content">
            <img 
              src={pentagram} 
              alt="Pentagram" 
              className="pentagram-image" 
              style={{ '--sacrifice-progress': progress } as React.CSSProperties}
            />
            <div className="slider-container">
                <label className="sacrifice-label">SACRIFICE: {amount}</label>
                <input 
                    type="range" 
                    min="0" 
                    max={capMaxSacrifice}
                    value={amount} 
                    onChange={handleSliderChange}
                    className="bloody-slider"
                    disabled={playerScore <= 0} // Slider is disabled if player has 0 points
                />
            </div>
            <div className="sacrifice-actions">
                <RetroButton
                    font="retro"
                    variant="secondary"
                    className="dialog-button-8bit sacrifice-btn-confirm"
                    onClick={() => onConfirm(amount)}
                    disabled={!canSacrifice}
                >
                    SACRIFICE
                </RetroButton>
                 <RetroButton
                    font="retro"
                    variant="destructive"
                    className="dialog-button-8bit sacrifice-btn-cancel"
                    onClick={onCancel}
                >
                    CANCEL
                </RetroButton>
            </div>
        </div>
      </div>
    </div>
  )
}
