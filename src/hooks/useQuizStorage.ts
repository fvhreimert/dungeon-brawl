import { useState, useEffect, useCallback } from 'react'
import { getQuizStorage, type QuizStorageService } from '@/services/quizStorageService'
import type { CustomQuiz, StoredQuizIndex } from '@/types/customQuiz'

export interface UseQuizStorageReturn {
  /** List of all stored custom quizzes (metadata only) */
  quizzes: StoredQuizIndex['quizzes']
  /** Whether the initial load is in progress */
  loading: boolean
  /** Error message if any operation failed */
  error: string | null
  /** Refresh the quiz list */
  refresh: () => Promise<void>
  /** Load a specific quiz by ID */
  loadQuiz: (id: string) => Promise<CustomQuiz | null>
  /** Save a quiz (create or update) */
  saveQuiz: (quiz: CustomQuiz) => Promise<boolean>
  /** Delete a quiz by ID */
  deleteQuiz: (id: string) => Promise<boolean>
  /** Export a quiz as JSON download */
  exportQuiz: (quiz: CustomQuiz) => void
}

/**
 * React hook for managing custom quiz storage.
 * Automatically loads the quiz list on mount and provides
 * methods for CRUD operations.
 */
export function useQuizStorage(): UseQuizStorageReturn {
  const [quizzes, setQuizzes] = useState<StoredQuizIndex['quizzes']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storage] = useState<QuizStorageService>(() => getQuizStorage())

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const index = await storage.listQuizzes()
      // Sort by most recently updated
      const sorted = [...index.quizzes].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      setQuizzes(sorted)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load quizzes'
      setError(message)
      console.error('Failed to refresh quiz list:', err)
    }
  }, [storage])

  const loadQuiz = useCallback(
    async (id: string): Promise<CustomQuiz | null> => {
      try {
        setError(null)
        return await storage.loadQuiz(id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load quiz'
        setError(message)
        console.error(`Failed to load quiz ${id}:`, err)
        return null
      }
    },
    [storage]
  )

  const saveQuiz = useCallback(
    async (quiz: CustomQuiz): Promise<boolean> => {
      try {
        setError(null)
        await storage.saveQuiz(quiz)
        await refresh()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save quiz'
        setError(message)
        console.error('Failed to save quiz:', err)
        return false
      }
    },
    [storage, refresh]
  )

  const deleteQuiz = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        await storage.deleteQuiz(id)
        await refresh()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete quiz'
        setError(message)
        console.error(`Failed to delete quiz ${id}:`, err)
        return false
      }
    },
    [storage, refresh]
  )

  const exportQuiz = useCallback(
    (quiz: CustomQuiz): void => {
      try {
        storage.exportQuiz(quiz)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to export quiz'
        setError(message)
        console.error('Failed to export quiz:', err)
      }
    },
    [storage]
  )

  // Load quiz list on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    }
    load()
  }, [refresh])

  return {
    quizzes,
    loading,
    error,
    refresh,
    loadQuiz,
    saveQuiz,
    deleteQuiz,
    exportQuiz,
  }
}
