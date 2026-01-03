import { useState, useMemo, useCallback } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { QuestionEditModal } from './QuestionEditModal'
import { useQuizStorage } from '@/hooks/useQuizStorage'
import {
  createCustomQuiz,
  updateCustomQuiz,
  type CustomQuiz,
  type QuizCategory,
  type QuizQuestion,
} from '@/types/customQuiz'
import './QuizBuilderScreen.css'

type QuizBuilderScreenProps = {
  existingQuiz?: CustomQuiz
  onSaveAndPlay: (quiz: CustomQuiz) => void
  onBack: () => void
}

const POINT_VALUES = [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000]

function createEmptyQuestions(count: number): QuizQuestion[] {
  return Array.from({ length: count }, () => ({ q: '', a: '' }))
}

function createEmptyCategories(
  categoryCount: number,
  questionsPerCategory: number
): QuizCategory[] {
  return Array.from({ length: categoryCount }, () => ({
    name: '',
    questions: createEmptyQuestions(questionsPerCategory),
  }))
}

export function QuizBuilderScreen({
  existingQuiz,
  onSaveAndPlay,
  onBack,
}: QuizBuilderScreenProps) {
  const { saveQuiz, exportQuiz } = useQuizStorage()

  // Quiz metadata
  const [quizName, setQuizName] = useState(existingQuiz?.displayName ?? '')
  const [categoryCount, setCategoryCount] = useState(
    existingQuiz?.categories.length ?? 5
  )
  const [questionsPerCategory, setQuestionsPerCategory] = useState(
    existingQuiz?.categories[0]?.questions.length ?? 5
  )

  // Initialize categories from existing quiz or create empty ones
  const [categories, setCategories] = useState<QuizCategory[]>(() => {
    if (existingQuiz) {
      return existingQuiz.categories
    }
    return createEmptyCategories(5, 5)
  })

  // Modal state
  const [editingTile, setEditingTile] = useState<{
    categoryIndex: number
    questionIndex: number
  } | null>(null)

  // Saving state
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Adjust categories array when count changes
  const handleCategoryCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, categoryCount + delta))
    setCategoryCount(newCount)

    setCategories((prev) => {
      if (newCount > prev.length) {
        // Add new empty categories
        return [
          ...prev,
          ...Array.from({ length: newCount - prev.length }, () => ({
            name: '',
            questions: createEmptyQuestions(questionsPerCategory),
          })),
        ]
      }
      return prev
    })
  }

  // Adjust questions per category when count changes
  const handleQuestionsPerCategoryChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, questionsPerCategory + delta))
    setQuestionsPerCategory(newCount)

    setCategories((prev) =>
      prev.map((cat) => {
        if (newCount > cat.questions.length) {
          // Add new empty questions
          return {
            ...cat,
            questions: [
              ...cat.questions,
              ...createEmptyQuestions(newCount - cat.questions.length),
            ],
          }
        }
        return cat
      })
    )
  }

  // Update category name
  const handleCategoryNameChange = (index: number, name: string) => {
    setCategories((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], name }
      return updated
    })
  }

  // Open question edit modal
  const handleTileClick = (categoryIndex: number, questionIndex: number) => {
    setEditingTile({ categoryIndex, questionIndex })
  }

  // Save question from modal
  const handleQuestionSave = (question: QuizQuestion) => {
    if (!editingTile) return

    setCategories((prev) => {
      const updated = [...prev]
      const cat = { ...updated[editingTile.categoryIndex] }
      const questions = [...cat.questions]
      questions[editingTile.questionIndex] = question
      cat.questions = questions
      updated[editingTile.categoryIndex] = cat
      return updated
    })

    setEditingTile(null)
  }

  // Check if a question is filled
  const isQuestionFilled = (question: QuizQuestion): boolean => {
    return question.q.trim().length > 0 && question.a.trim().length > 0
  }

  // Validate quiz
  const validation = useMemo(() => {
    const errors: string[] = []

    if (!quizName.trim()) {
      errors.push('Quiz name is required')
    }

    const visibleCategories = categories.slice(0, categoryCount)
    const emptyCategories = visibleCategories.filter((c) => !c.name.trim())
    if (emptyCategories.length > 0) {
      errors.push(`${emptyCategories.length} category name(s) missing`)
    }

    let emptyQuestions = 0
    visibleCategories.forEach((cat) => {
      cat.questions.slice(0, questionsPerCategory).forEach((q) => {
        if (!isQuestionFilled(q)) {
          emptyQuestions++
        }
      })
    })
    if (emptyQuestions > 0) {
      errors.push(`${emptyQuestions} question(s) incomplete`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [quizName, categories, categoryCount, questionsPerCategory])

  // Build the quiz object
  const buildQuiz = useCallback((): CustomQuiz => {
    const trimmedCategories = categories
      .slice(0, categoryCount)
      .map((cat) => ({
        name: cat.name.trim() || 'Unnamed',
        questions: cat.questions.slice(0, questionsPerCategory),
      }))

    if (existingQuiz) {
      return updateCustomQuiz(existingQuiz, {
        displayName: quizName.trim() || 'Untitled Quiz',
        categories: trimmedCategories,
      })
    }

    return {
      ...createCustomQuiz(quizName.trim() || 'Untitled Quiz', trimmedCategories),
    }
  }, [categories, categoryCount, questionsPerCategory, quizName, existingQuiz])

  // Save quiz
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const quiz = buildQuiz()
      const success = await saveQuiz(quiz)
      if (success) {
        setSaveMessage('Quiz saved!')
        setTimeout(() => setSaveMessage(null), 2000)
      } else {
        setSaveMessage('Failed to save')
      }
    } catch {
      setSaveMessage('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  // Save and play
  const handleSaveAndPlay = async () => {
    setIsSaving(true)
    try {
      const quiz = buildQuiz()
      await saveQuiz(quiz)
      onSaveAndPlay(quiz)
    } catch {
      setSaveMessage('Failed to save')
      setIsSaving(false)
    }
  }

  // Export as JSON
  const handleExport = () => {
    const quiz = buildQuiz()
    exportQuiz(quiz)
  }

  // Get visible categories and questions
  const visibleCategories = categories.slice(0, categoryCount)

  return (
    <div className="quiz-builder-screen">
      <div className="quiz-builder-container">
        {/* Header with title, quiz name input, and dimension controls */}
        <div className="quiz-builder-header">
          <h1 className="main-menu-title-standalone">Create Quiz</h1>
          <input
            type="text"
            className="quiz-name-input"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="QUIZ NAME"
            maxLength={50}
          />

          {/* Dimension Controls */}
          <div className="quiz-builder-controls">
            <div className="dimension-control">
              <span className="dimension-label">Categories</span>
              <div className="dimension-buttons">
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="dimension-btn"
                  onClick={() => handleCategoryCountChange(-1)}
                  disabled={categoryCount <= 1}
                >
                  -
                </RetroButton>
                <span className="dimension-value">{categoryCount}</span>
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="dimension-btn"
                  onClick={() => handleCategoryCountChange(1)}
                  disabled={categoryCount >= 10}
                >
                  +
                </RetroButton>
              </div>
            </div>

            <div className="dimension-control">
              <span className="dimension-label">Questions</span>
              <div className="dimension-buttons">
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="dimension-btn"
                  onClick={() => handleQuestionsPerCategoryChange(-1)}
                  disabled={questionsPerCategory <= 1}
                >
                  -
                </RetroButton>
                <span className="dimension-value">{questionsPerCategory}</span>
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="dimension-btn"
                  onClick={() => handleQuestionsPerCategoryChange(1)}
                  disabled={questionsPerCategory >= 10}
                >
                  +
                </RetroButton>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        <div
          className="quiz-builder-board"
          style={{ '--category-count': categoryCount } as React.CSSProperties}
        >
          {/* Category Row */}
          <div className="quiz-builder-category-row">
            {visibleCategories.map((cat, catIndex) => (
              <input
                key={catIndex}
                type="text"
                className={`quiz-builder-category-input ${
                  cat.name.trim() ? '' : 'empty'
                }`}
                value={cat.name}
                onChange={(e) =>
                  handleCategoryNameChange(catIndex, e.target.value)
                }
                placeholder={`CAT ${catIndex + 1}`}
                maxLength={30}
              />
            ))}
          </div>

          {/* Question Grid */}
          <div className="quiz-builder-grid">
            {Array.from({ length: questionsPerCategory }).map((_, qIndex) =>
              visibleCategories.map((cat, catIndex) => {
                const question = cat.questions[qIndex]
                const isFilled = question && isQuestionFilled(question)
                const pointValue = POINT_VALUES[qIndex] ?? (qIndex + 1) * 100

                return (
                  <button
                    type="button"
                    key={`${catIndex}-${qIndex}`}
                    className={`quiz-builder-tile ${isFilled ? 'filled' : 'empty'}`}
                    onClick={() => handleTileClick(catIndex, qIndex)}
                  >
                    <span className="tile-value">{pointValue}</span>
                    {isFilled && <span className="tile-check">✓</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="quiz-builder-footer">
          {saveMessage && (
            <div className="quiz-builder-message">{saveMessage}</div>
          )}

          {/* Action Buttons */}
          <div className="quiz-builder-actions">
            <RetroButton
              font="retro"
              variant="secondary"
              className="action-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              Save
            </RetroButton>
            <RetroButton
              font="retro"
              variant="secondary"
              className="action-btn action-btn-primary"
              onClick={handleSaveAndPlay}
              disabled={!validation.isValid || isSaving}
            >
              Save & Play
            </RetroButton>
            <RetroButton
              font="retro"
              variant="secondary"
              className="action-btn"
              onClick={handleExport}
            >
              Export JSON
            </RetroButton>
            <RetroButton
              font="retro"
              variant="destructive"
              className="action-btn"
              onClick={onBack}
            >
              Back
            </RetroButton>
          </div>
        </div>
      </div>

      {/* Question Edit Modal */}
      {editingTile && (
        <QuestionEditModal
          categoryName={categories[editingTile.categoryIndex]?.name || ''}
          pointValue={
            POINT_VALUES[editingTile.questionIndex] ??
            (editingTile.questionIndex + 1) * 100
          }
          questionIndex={editingTile.questionIndex}
          existingQuestion={
            categories[editingTile.categoryIndex]?.questions[
              editingTile.questionIndex
            ]
          }
          onSave={handleQuestionSave}
          onCancel={() => setEditingTile(null)}
        />
      )}
    </div>
  )
}
