import type { Quiz, QuizFile } from '@/types/quiz'
import type { QAItem } from '@/types/game'

// Import all quiz files statically (Vite requires static imports for JSON)
import quiz1 from '@/data/quizzes/quiz_1.json'
import quiz2 from '@/data/quizzes/quiz_2.json'
import quiz3 from '@/data/quizzes/quiz_3.json'
import quiz4 from '@/data/quizzes/quiz_4.json'
import quiz5 from '@/data/quizzes/quiz_5.json'
import quiz6 from '@/data/quizzes/quiz_6.json'
import quiz7 from '@/data/quizzes/quiz_7.json'
import quiz8 from '@/data/quizzes/quiz_8.json'
import quiz9 from '@/data/quizzes/quiz_9.json'
import dutQuiz from '@/data/quizzes/dut.json'

const quizModules: Record<string, Quiz> = {
  'quiz_1.json': quiz1 as Quiz,
  'quiz_2.json': quiz2 as Quiz,
  'quiz_3.json': quiz3 as Quiz,
  'quiz_4.json': quiz4 as Quiz,
  'quiz_5.json': quiz5 as Quiz,
  'quiz_6.json': quiz6 as Quiz,
  'quiz_7.json': quiz7 as Quiz,
  'quiz_8.json': quiz8 as Quiz,
  'quiz_9.json': quiz9 as Quiz,
  'dut.json': dutQuiz as Quiz,
}

export function getAvailableQuizzes(): QuizFile[] {
  return Object.entries(quizModules).map(([fileName, quiz]) => ({
    fileName,
    displayName: quiz.displayName,
  }))
}

export function loadQuiz(fileName: string): Quiz | null {
  return quizModules[fileName] ?? null
}

/**
 * Convert a Quiz to the QAItem[] format used by the game.
 * Assigns point values based on question index (harder questions = more points).
 */
export function quizToQAItems(quiz: Quiz, pointValues: number[]): QAItem[] {
  const items: QAItem[] = []

  for (const category of quiz.categories) {
    category.questions.forEach((question, index) => {
      const value = pointValues[index] ?? pointValues[pointValues.length - 1]
      items.push({
        category: category.name,
        value,
        question: question.q,
        answer: question.a,
      })
    })
  }

  return items
}

/**
 * Get categories from a quiz.
 */
export function getQuizCategories(quiz: Quiz): string[] {
  return quiz.categories.map((c) => c.name)
}

/**
 * Infer point values based on the maximum number of questions in any category.
 */
export function inferPointValues(quiz: Quiz, baseValues: number[] = [200, 400, 600, 800, 1000]): number[] {
  const maxQuestions = Math.max(...quiz.categories.map((c) => c.questions.length))
  if (maxQuestions <= baseValues.length) {
    return baseValues.slice(0, maxQuestions)
  }
  // Extend base values for quizzes with more questions
  const extended = [...baseValues]
  for (let i = baseValues.length; i < maxQuestions; i++) {
    extended.push(baseValues[baseValues.length - 1] + (i - baseValues.length + 1) * 200)
  }
  return extended
}
