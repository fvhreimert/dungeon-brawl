import { useState } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import pentagram from '@/assets/images/actions/pentagram.png'
import './BloodSacrificeModal.css'

type BloodSacrificeModalProps = {
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function BloodSacrificeModal({ onConfirm, onCancel }: BloodSacrificeModalProps) {
  const [amount, setAmount] = useState(1) // Default to 1

  // Calculate progress from 0 to 1 based on slider (min 1, max 100)
  const progress = (amount - 1) / 99

  return (
    <div className="blood-sacrifice-backdrop" onClick={onCancel}>
      <div className="blood-sacrifice-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="blood-sacrifice-title">Blood Sacrifice</div>
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
                    min="1" 
                    max="100" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="bloody-slider"
                />
            </div>
            <div className="sacrifice-actions">
                <RetroButton
                    font="retro"
                    variant="secondary"
                    className="dialog-button-8bit sacrifice-btn-confirm"
                    onClick={() => onConfirm(amount)}
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
