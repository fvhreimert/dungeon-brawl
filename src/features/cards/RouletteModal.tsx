import { useState, useEffect, useRef, useCallback } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import rouletteImg from '@/assets/images/ui/roulette.png'
import clickSound from '@/assets/sounds/UI/click.mp3'
import './RouletteModal.css'

type RouletteModalProps = {
  maxStake: number
  onConfirm: (won: boolean, amount: number) => void
  onCancel: () => void
}

type SpinPhase = 'idle' | 'spinning' | 'result'

export function RouletteModal({ maxStake, onConfirm, onCancel }: RouletteModalProps) {
  const [stake, setStake] = useState(Math.min(100, maxStake))
  const [phase, setPhase] = useState<SpinPhase>('idle')
  const [result, setResult] = useState<'win' | 'lose' | null>(null)
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveMax = Math.min(500, Math.max(1, maxStake))

  // Memoize cancel handler to avoid re-running effect
  const handleCancel = useCallback(() => {
    if (phase === 'idle') {
      onCancel()
    }
  }, [phase, onCancel])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'idle') {
        onCancel()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel, phase])

  // Separate cleanup effect for the timeout
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  const playTick = () => {
    const audio = new Audio(clickSound)
    audio.volume = 0.15
    audio.play().catch(() => {})
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStake(Number(e.target.value))
    playTick()
  }

  const handleSpin = () => {
    if (phase !== 'idle') return

    setPhase('spinning')
    
    // Determine outcome (50/50 chance)
    const won = Math.random() >= 0.5

    // Build suspense with spinning animation
    spinTimeoutRef.current = setTimeout(() => {
      setResult(won ? 'win' : 'lose')
      setPhase('result')
    }, 2500) // 2.5 seconds of suspense
  }

  const handleCollect = () => {
    if (result === null) return
    onConfirm(result === 'win', stake)
  }

  const progress = effectiveMax > 1 ? (stake - 1) / (effectiveMax - 1) : 0

  return (
    <div 
      className="roulette-backdrop" 
      onClick={handleCancel}
    >
      <div className="roulette-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="roulette-title">Roulette</div>
        
        <div className="roulette-content">
          <div className={`roulette-wheel-container ${phase}`}>
            <img 
              src={rouletteImg} 
              alt="Roulette Wheel" 
              className={`roulette-wheel ${phase} ${result ?? ''}`}
            />
            {phase === 'result' && (
              <div className={`roulette-result-overlay ${result}`}>
                {result === 'win' ? 'JACKPOT!' : 'BUST'}
              </div>
            )}
          </div>

          {phase === 'idle' && (
            <>
              <div className="roulette-subtitle">
                Stake your gold for a chance to double it... or lose it all!
              </div>
              
              <div className="roulette-slider-container">
                <label className="roulette-label">STAKE: {stake} pts</label>
                <input 
                  type="range" 
                  min="1" 
                  max={effectiveMax}
                  value={stake} 
                  onChange={handleSliderChange}
                  className="roulette-slider"
                  style={{ '--stake-progress': progress } as React.CSSProperties}
                />
                <div className="roulette-range-labels">
                  <span>1</span>
                  <span>{effectiveMax}</span>
                </div>
              </div>

              <div className="roulette-odds">
                <div className="odds-row win">
                  <span className="odds-label">Win:</span>
                  <span className="odds-value">+{stake} pts</span>
                </div>
                <div className="odds-row lose">
                  <span className="odds-label">Lose:</span>
                  <span className="odds-value">-{stake} pts</span>
                </div>
              </div>
            </>
          )}

          {phase === 'spinning' && (
            <div className="roulette-spinning-text">
              Spinning the wheel of fortune...
            </div>
          )}

          {phase === 'result' && (
            <div className={`roulette-result-text ${result}`}>
              {result === 'win' 
                ? `You won ${stake} points!` 
                : `You lost ${stake} points!`}
            </div>
          )}

          <div className="roulette-actions">
            {phase === 'idle' && (
              <>
                <RetroButton
                  font="retro"
                  variant="default"
                  className="dialog-button-8bit roulette-btn-spin"
                  onClick={handleSpin}
                >
                  SPIN!
                </RetroButton>
                <RetroButton
                  font="retro"
                  variant="destructive"
                  className="dialog-button-8bit roulette-btn-cancel"
                  onClick={onCancel}
                >
                  CANCEL
                </RetroButton>
              </>
            )}

            {phase === 'result' && (
              <RetroButton
                font="retro"
                variant={result === 'win' ? 'default' : 'destructive'}
                className={`dialog-button-8bit roulette-btn-collect ${result}`}
                onClick={handleCollect}
              >
                {result === 'win' ? 'COLLECT WINNINGS!' : 'ACCEPT FATE'}
              </RetroButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
