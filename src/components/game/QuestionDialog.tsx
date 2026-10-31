import { useEffect } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Tile } from '@/types/game'
import { gameConfig } from '@/config/gameConfig'
import { playAnswerSound } from '@/services/soundService'
import { getSpiderSenseBonus, getSpiderSensePercent } from '@/features/spiderSense'
import spiderSenseIcon from '@/assets/images/ui/spider_sense.png'
import './QuestionDialog.css'

type QuestionDialogProps = {
  tile: Tile
  answerRevealed: boolean
  onReveal: () => void
  onAnswer: (correct: boolean) => void
  onClose: () => void
  /** Active player's Spider Sense level and bonus per level (0.05 = 5%). */
  spiderSenseLevel: number
  spiderSenseBonusPerLevel: number
}

export function QuestionDialog({
  tile,
  answerRevealed,
  onReveal,
  onAnswer,
  onClose,
  spiderSenseLevel,
  spiderSenseBonusPerLevel,
}: QuestionDialogProps) {
  const effectiveValue = tile.value * (tile.multiplier ?? 1)
  const spiderBonus = getSpiderSenseBonus(effectiveValue, spiderSenseLevel, spiderSenseBonusPerLevel)
  const spiderPercent = getSpiderSensePercent(spiderSenseLevel, spiderSenseBonusPerLevel)

  const handleAnswer = (correct: boolean) => {
    playAnswerSound(correct)
    onAnswer(correct)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !answerRevealed) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, answerRevealed])

  return (
    <div 
      className={`dialog-backdrop ${answerRevealed ? 'pointer-events-none' : ''}`} 
      onClick={answerRevealed ? undefined : onClose}
    >
      <div
        className="dialog pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="dialog-header-row">
          <div className="dialog-category-badge">{tile.category}</div>
          <div className="dialog-value-group">
            <div className="dialog-value-badge">
              {effectiveValue}
            </div>
            {spiderBonus > 0 && (
              <div
                className="dialog-spider-bonus"
                title={`Spider Sense Lv ${spiderSenseLevel}: +${spiderPercent}% points on a correct answer`}
              >
                <img src={spiderSenseIcon} alt="" className="dialog-spider-icon" />
                <span className="dialog-spider-amount">+{spiderBonus}</span>
                <span className="dialog-spider-label">Spider Sense</span>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-content">
          <p className="dialog-question-text">{tile.question}</p>
          
          {answerRevealed && (
            <div className="dialog-answer-container">
              <div className="dialog-answer-divider"></div>
              <p className="dialog-answer-label">{gameConfig.ui.labels.answerHeader}</p>
              <p className="dialog-answer-text">{tile.answer}</p>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {!answerRevealed ? (
            <RetroButton
              font="retro"
              variant="secondary"
              className="dialog-button-8bit dialog-button-reveal"
              onClick={onReveal}
            >
              {gameConfig.ui.labels.revealButton}
            </RetroButton>
          ) : (
            <div className="dialog-actions-row">
              <RetroButton
                font="retro"
                variant="secondary"
                className="dialog-button-8bit dialog-button-correct"
                onClick={() => handleAnswer(true)}
              >
                {gameConfig.ui.labels.correctButton}
              </RetroButton>
              <RetroButton
                font="retro"
                variant="destructive"
                className="dialog-button-8bit dialog-button-wrong"
                onClick={() => handleAnswer(false)}
              >
                {gameConfig.ui.labels.wrongButton}
              </RetroButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
