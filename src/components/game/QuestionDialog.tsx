import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { Tile } from '@/types/game'

type QuestionDialogProps = {
  tile: Tile
  answerRevealed: boolean
  onReveal: () => void
  onAnswer: (correct: boolean) => void
  onClose: () => void
}

export function QuestionDialog({
  tile,
  answerRevealed,
  onReveal,
  onAnswer,
  onClose,
}: QuestionDialogProps) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="dialog-header-row">
          <div className="dialog-category-badge">{tile.category}</div>
          <div className="dialog-value-badge">{tile.value}</div>
        </div>

        <div className="dialog-content">
          <p className="dialog-question-text">{tile.question}</p>
          
          {answerRevealed && (
            <div className="dialog-answer-container">
              <div className="dialog-answer-divider"></div>
              <p className="dialog-answer-label">THE ANSWER</p>
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
              Reveal Answer
            </RetroButton>
          ) : (
            <div className="dialog-actions-row">
              <RetroButton
                font="retro"
                variant="secondary"
                className="dialog-button-8bit dialog-button-correct"
                onClick={() => onAnswer(true)}
              >
                Correct
              </RetroButton>
              <RetroButton
                font="retro"
                variant="destructive"
                className="dialog-button-8bit dialog-button-wrong"
                onClick={() => onAnswer(false)}
              >
                Wrong
              </RetroButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
