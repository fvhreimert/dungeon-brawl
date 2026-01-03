import type { Quiz, QuizCategory, QuizQuestion } from './quiz'

/**
 * Extended quiz type for user-created quizzes.
 * Adds metadata for storage and identification.
 */
export interface CustomQuiz extends Quiz {
  id: string
  createdAt: string
  updatedAt: string
  isCustom: true
}

/**
 * Metadata stored in the quiz index for quick listing.
 */
export interface CustomQuizMeta {
  id: string
  displayName: string
  updatedAt: string
  categoryCount: number
  questionsPerCategory: number
}

/**
 * Index of all stored custom quizzes.
 */
export interface StoredQuizIndex {
  quizzes: CustomQuizMeta[]
}

/**
 * Extended quiz file type that includes custom quiz indicator.
 */
export interface CustomQuizFile {
  fileName: string
  displayName: string
  isCustom: true
  updatedAt: string
}

/**
 * Creates a new empty custom quiz with default structure.
 */
export function createEmptyCustomQuiz(
  categoryCount: number = 5,
  questionsPerCategory: number = 5
): Omit<CustomQuiz, 'id' | 'createdAt' | 'updatedAt'> & { isCustom: true } {
  const categories: QuizCategory[] = Array.from({ length: categoryCount }, () => ({
    name: '',
    questions: Array.from({ length: questionsPerCategory }, () => ({
      q: '',
      a: '',
    })),
  }))

  return {
    displayName: '',
    categories,
    isCustom: true,
  }
}

/**
 * Generates a unique ID for a new quiz.
 */
export function generateQuizId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Creates a full CustomQuiz with all required fields.
 */
export function createCustomQuiz(
  displayName: string,
  categories: QuizCategory[]
): CustomQuiz {
  const now = new Date().toISOString()
  return {
    id: generateQuizId(),
    displayName,
    categories,
    createdAt: now,
    updatedAt: now,
    isCustom: true,
  }
}

/**
 * Updates an existing custom quiz's metadata.
 */
export function updateCustomQuiz(
  quiz: CustomQuiz,
  updates: Partial<Pick<CustomQuiz, 'displayName' | 'categories'>>
): CustomQuiz {
  return {
    ...quiz,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
}

// Re-export base types for convenience
export type { Quiz, QuizCategory, QuizQuestion }
