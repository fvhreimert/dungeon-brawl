import { useState, useEffect, useRef } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { QuizQuestion } from '@/types/quiz'
import './QuestionEditModal.css'

type QuestionEditModalProps = {
  categoryName: string
  pointValue: number
  questionIndex: number
  existingQuestion?: QuizQuestion
  onSave: (question: QuizQuestion) => void
  onCancel: () => void
}

export function QuestionEditModal({
  categoryName,
  pointValue,
  questionIndex,
  existingQuestion,
  onSave,
  onCancel,
}: QuestionEditModalProps) {
  const [question, setQuestion] = useState(existingQuestion?.q ?? '')
  const [answer, setAnswer] = useState(existingQuestion?.a ?? '')
  const questionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus question input on mount
    questionRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (question.trim() && answer.trim()) {
      onSave({ q: question.trim(), a: answer.trim() })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const isValid = question.trim().length > 0 && answer.trim().length > 0

  return (
    <div className="question-edit-backdrop" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div className="question-edit-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="question-edit-header">
          <div className="question-edit-title">Edit Question</div>
          <div className="question-edit-meta">
            <span className="question-edit-category">{categoryName || 'Category'}</span>
            <span className="question-edit-points">{pointValue} pts</span>
            <span className="question-edit-number">Q{questionIndex + 1}</span>
          </div>
        </div>

        <div className="question-edit-field">
          <label className="question-edit-label">Question</label>
          <textarea
            ref={questionRef}
            className="question-edit-textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question..."
            rows={4}
          />
        </div>

        <div className="question-edit-field">
          <label className="question-edit-label">Answer</label>
          <textarea
            className="question-edit-textarea question-edit-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter the answer..."
            rows={2}
          />
        </div>

        <div className="question-edit-actions">
          <RetroButton
            font="retro"
            variant="secondary"
            className="question-edit-save"
            onClick={handleSave}
            disabled={!isValid}
          >
            Save
          </RetroButton>
          <RetroButton
            font="retro"
            variant="destructive"
            className="question-edit-cancel"
            onClick={onCancel}
          >
            Cancel
          </RetroButton>
        </div>
      </div>
    </div>
  )
}
