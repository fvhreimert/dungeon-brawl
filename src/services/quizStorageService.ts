import type {
  CustomQuiz,
  CustomQuizMeta,
  StoredQuizIndex,
} from '@/types/customQuiz'

const STORAGE_KEY_PREFIX = 'dungeon_brawl_custom_quiz_'
const INDEX_KEY = 'dungeon_brawl_quiz_index'

/**
 * Interface for quiz storage operations.
 * Implemented by both web (localStorage) and Tauri (filesystem) storage.
 */
export interface QuizStorageService {
  listQuizzes(): Promise<StoredQuizIndex>
  loadQuiz(id: string): Promise<CustomQuiz | null>
  saveQuiz(quiz: CustomQuiz): Promise<void>
  deleteQuiz(id: string): Promise<void>
  exportQuiz(quiz: CustomQuiz): void
}

/**
 * Check if running in Tauri desktop environment.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Web storage implementation using localStorage.
 */
class WebQuizStorage implements QuizStorageService {
  async listQuizzes(): Promise<StoredQuizIndex> {
    try {
      const indexStr = localStorage.getItem(INDEX_KEY)
      if (!indexStr) {
        return { quizzes: [] }
      }
      return JSON.parse(indexStr) as StoredQuizIndex
    } catch (error) {
      console.error('Failed to load quiz index:', error)
      return { quizzes: [] }
    }
  }

  async loadQuiz(id: string): Promise<CustomQuiz | null> {
    try {
      const quizStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`)
      if (!quizStr) {
        return null
      }
      return JSON.parse(quizStr) as CustomQuiz
    } catch (error) {
      console.error(`Failed to load quiz ${id}:`, error)
      return null
    }
  }

  async saveQuiz(quiz: CustomQuiz): Promise<void> {
    try {
      // Save the quiz data
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${quiz.id}`,
        JSON.stringify(quiz)
      )

      // Update the index
      const index = await this.listQuizzes()
      const existingIdx = index.quizzes.findIndex((q) => q.id === quiz.id)

      const meta: CustomQuizMeta = {
        id: quiz.id,
        displayName: quiz.displayName,
        updatedAt: quiz.updatedAt,
        categoryCount: quiz.categories.length,
        questionsPerCategory: quiz.categories[0]?.questions.length ?? 0,
      }

      if (existingIdx >= 0) {
        index.quizzes[existingIdx] = meta
      } else {
        index.quizzes.push(meta)
      }

      localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    } catch (error) {
      console.error('Failed to save quiz:', error)
      throw new Error('Failed to save quiz to storage')
    }
  }

  async deleteQuiz(id: string): Promise<void> {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`)

      const index = await this.listQuizzes()
      index.quizzes = index.quizzes.filter((q) => q.id !== id)
      localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    } catch (error) {
      console.error(`Failed to delete quiz ${id}:`, error)
      throw new Error('Failed to delete quiz')
    }
  }

  exportQuiz(quiz: CustomQuiz): void {
    // Create downloadable JSON file
    const exportData = {
      displayName: quiz.displayName,
      categories: quiz.categories,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${quiz.displayName.replace(/\s+/g, '_').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Tauri storage implementation using filesystem.
 * Falls back to web storage if Tauri APIs are not available.
 */
class TauriQuizStorage implements QuizStorageService {
  private webFallback = new WebQuizStorage()
  private initialized = false
  private quizDir: string | null = null

  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) {
      return this.quizDir !== null
    }

    try {
      // Dynamic import to avoid bundling issues in web builds
      const { appDataDir, join } = await import('@tauri-apps/api/path')
      const { exists, mkdir } = await import('@tauri-apps/plugin-fs')

      const appData = await appDataDir()
      this.quizDir = await join(appData, 'custom_quizzes')

      if (!(await exists(this.quizDir))) {
        await mkdir(this.quizDir, { recursive: true })
      }

      this.initialized = true
      return true
    } catch (error) {
      console.warn('Tauri fs not available, falling back to localStorage:', error)
      this.initialized = true
      this.quizDir = null
      return false
    }
  }

  async listQuizzes(): Promise<StoredQuizIndex> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.listQuizzes()
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { exists, readTextFile } = await import('@tauri-apps/plugin-fs')

      const indexPath = await join(this.quizDir!, 'index.json')

      if (!(await exists(indexPath))) {
        return { quizzes: [] }
      }

      const indexStr = await readTextFile(indexPath)
      return JSON.parse(indexStr) as StoredQuizIndex
    } catch (error) {
      console.error('Failed to load quiz index from filesystem:', error)
      return { quizzes: [] }
    }
  }

  async loadQuiz(id: string): Promise<CustomQuiz | null> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.loadQuiz(id)
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { exists, readTextFile } = await import('@tauri-apps/plugin-fs')

      const quizPath = await join(this.quizDir!, `${id}.json`)

      if (!(await exists(quizPath))) {
        return null
      }

      const quizStr = await readTextFile(quizPath)
      return JSON.parse(quizStr) as CustomQuiz
    } catch (error) {
      console.error(`Failed to load quiz ${id} from filesystem:`, error)
      return null
    }
  }

  async saveQuiz(quiz: CustomQuiz): Promise<void> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.saveQuiz(quiz)
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')

      // Save quiz file
      const quizPath = await join(this.quizDir!, `${quiz.id}.json`)
      await writeTextFile(quizPath, JSON.stringify(quiz, null, 2))

      // Update index
      const index = await this.listQuizzes()
      const existingIdx = index.quizzes.findIndex((q) => q.id === quiz.id)

      const meta: CustomQuizMeta = {
        id: quiz.id,
        displayName: quiz.displayName,
        updatedAt: quiz.updatedAt,
        categoryCount: quiz.categories.length,
        questionsPerCategory: quiz.categories[0]?.questions.length ?? 0,
      }

      if (existingIdx >= 0) {
        index.quizzes[existingIdx] = meta
      } else {
        index.quizzes.push(meta)
      }

      const indexPath = await join(this.quizDir!, 'index.json')
      await writeTextFile(indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
      console.error('Failed to save quiz to filesystem:', error)
      throw new Error('Failed to save quiz')
    }
  }

  async deleteQuiz(id: string): Promise<void> {
    if (!(await this.ensureInitialized())) {
      return this.webFallback.deleteQuiz(id)
    }

    try {
      const { join } = await import('@tauri-apps/api/path')
      const { remove, exists, writeTextFile } = await import('@tauri-apps/plugin-fs')

      const quizPath = await join(this.quizDir!, `${id}.json`)

      if (await exists(quizPath)) {
        await remove(quizPath)
      }

      // Update index
      const index = await this.listQuizzes()
      index.quizzes = index.quizzes.filter((q) => q.id !== id)

      const indexPath = await join(this.quizDir!, 'index.json')
      await writeTextFile(indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
      console.error(`Failed to delete quiz ${id} from filesystem:`, error)
      throw new Error('Failed to delete quiz')
    }
  }

  exportQuiz(quiz: CustomQuiz): void {
    // Use same web download for export (works in Tauri too)
    this.webFallback.exportQuiz(quiz)
  }
}

// Singleton instance
let storageInstance: QuizStorageService | null = null

/**
 * Get the appropriate storage service for the current platform.
 */
export function getQuizStorage(): QuizStorageService {
  if (!storageInstance) {
    storageInstance = isTauri() ? new TauriQuizStorage() : new WebQuizStorage()
  }
  return storageInstance
}

/**
 * Reset the storage instance (useful for testing).
 */
export function resetQuizStorage(): void {
  storageInstance = null
}
