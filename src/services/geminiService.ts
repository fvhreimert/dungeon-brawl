import type { QuizCategory } from '@/types/quiz'

export type GeminiModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-preview'

export const GEMINI_MODELS: { id: GeminiModel; name: string }[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)' },
]

const DEFAULT_MODEL: GeminiModel = 'gemini-2.5-flash'

function getApiUrl(model: GeminiModel): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

const STORAGE_KEY = 'dungeon_brawl_gemini_key'
const MODEL_STORAGE_KEY = 'dungeon_brawl_gemini_model'

export function getSavedApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function saveApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getSavedModel(): GeminiModel {
  const saved = localStorage.getItem(MODEL_STORAGE_KEY)
  if (saved && GEMINI_MODELS.some(m => m.id === saved)) {
    return saved as GeminiModel
  }
  return DEFAULT_MODEL
}

export function saveModel(model: GeminiModel): void {
  localStorage.setItem(MODEL_STORAGE_KEY, model)
}

export async function verifyApiKey(apiKey: string, model: GeminiModel = DEFAULT_MODEL): Promise<{ valid: boolean; error?: string }> {
  try {
    const apiUrl = getApiUrl(model)
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Say hi' }],
          },
        ],
      }),
    })

    if (!response.ok) {
      if (response.status === 400 || response.status === 403) {
        return { valid: false, error: 'Invalid API key' }
      }
      return { valid: false, error: `API error: ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Network error - could not reach API' }
  }
}

const CATEGORY_PROMPT_TEMPLATE = `Du er en ekspert i at udforme quizspørgsmål. Generér præcis 5 quizspørgsmål inden for kategorien: [Category].
Følg eventuelle særlige instruktioner: [Instructions].

Du er en professionel redaktør for TV-programmet Jeopardy. Din opgave er at spørgsmål og svar der er underholdende, præcise og interestante, for et publikum i alderen 20-35 år. 

REGLER FOR INDHOLD:

A. SVÆRHEDSGRAD
Spørgsmålene skal stige i sværhedsgrad. 
   - 1: Alle i rummet bør kunne svare (almen viden)
   - 5: Mere specifik viden indenfor kategorien, som kun meget få kender til. 

B. Spørgsmålene må ikke indeholde svaret på spørgsmålet. Det må altså ikke være indlysende og afsløre svaret i teksten. Undgå at spørgsmålene i kategorien minder om hinanden eller afslører svarene på andre spørgsmål i kategorien.

C. Spørgsmålene skal helst være korte og præcise, uden unødige detaljer. 

D. Undgå "trick spørgsmål"

Svar udelukkende i dette JSON-format (Der må IKKE være noget ekstra tekst udenfor JSON):

{
  "name": "[Category]",
  "questions": [
    { "q": "Spørgsmål 1", "a": "Svar 1" },
    { "q": "Spørgsmål 2", "a": "Svar 2" },
    { "q": "Spørgsmål 3", "a": "Svar 3" },
    { "q": "Spørgsmål 4", "a": "Svar 4" },
    { "q": "Spørgsmål 5", "a": "Svar 5" }
  ]
}`

function buildPrompt(categoryName: string, description: string): string {
  return CATEGORY_PROMPT_TEMPLATE
    .replace(/\[Category\]/g, categoryName)
    .replace('[Instructions]', description || 'Ingen særlige instruktioner.')
}

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  return cleaned.trim()
}

export type RateLimitCallback = (waitingSeconds: number) => void

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const MAX_RETRIES = 5
const INITIAL_BACKOFF_MS = 2000

export async function generateCategory(
  apiKey: string,
  categoryName: string,
  description: string,
  model: GeminiModel = DEFAULT_MODEL,
  onRateLimit?: RateLimitCallback
): Promise<QuizCategory> {
  const prompt = buildPrompt(categoryName, description)
  const apiUrl = getApiUrl(model)

  let backoffMs = INITIAL_BACKOFF_MS

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    })

    // Handle retryable errors: rate limiting (429) and overloaded (503)
    const isRetryable = response.status === 429 || response.status === 503

    if (isRetryable) {
      const retryAfterHeader = response.headers.get('Retry-After')
      let waitMs: number

      if (retryAfterHeader) {
        // Retry-After can be seconds or a date string
        const retryAfterSeconds = parseInt(retryAfterHeader, 10)
        if (!isNaN(retryAfterSeconds)) {
          waitMs = retryAfterSeconds * 1000
        } else {
          // Try parsing as date
          const retryDate = new Date(retryAfterHeader).getTime()
          waitMs = Math.max(0, retryDate - Date.now())
        }
      } else {
        // Use longer initial wait for 503 (overloaded) vs 429 (rate limit)
        waitMs = response.status === 503 ? Math.max(backoffMs, 5000) : backoffMs
      }

      // Notify UI about the wait time
      if (onRateLimit) {
        onRateLimit(Math.ceil(waitMs / 1000))
      }

      await sleep(waitMs)
      backoffMs = Math.min(backoffMs * 2, 60000) // Cap at 60 seconds
      continue
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No content generated from Gemini API')
    }

    const cleanedJson = cleanJsonResponse(generatedText)
    const category: QuizCategory = JSON.parse(cleanedJson)

    return category
  }

  throw new Error('Rate limit exceeded - max retries reached')
}

export type CategoryInput = {
  name: string
  description: string
}

export type GenerationCallbacks = {
  onProgress?: (completed: number, total: number) => void
  onRateLimit?: (waitingSeconds: number) => void
}

// Proactive delay between requests to reduce rate limit hits
const DELAY_BETWEEN_REQUESTS_MS = 1500

export async function generateQuizCategories(
  apiKey: string,
  categories: CategoryInput[],
  callbacks?: GenerationCallbacks,
  model: GeminiModel = DEFAULT_MODEL
): Promise<QuizCategory[]> {
  const results: QuizCategory[] = []

  for (let i = 0; i < categories.length; i++) {
    const { name, description } = categories[i]
    const category = await generateCategory(
      apiKey,
      name,
      description,
      model,
      callbacks?.onRateLimit
    )
    results.push(category)
    callbacks?.onProgress?.(i + 1, categories.length)

    // Proactive throttling: wait between requests (except after last one)
    if (i < categories.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS)
    }
  }

  return results
}
