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
   - 5: Mere specifik viden indenfor kategorien, som alle ikke kender til.

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

export async function generateCategory(
  apiKey: string,
  categoryName: string,
  description: string,
  model: GeminiModel = DEFAULT_MODEL
): Promise<QuizCategory> {
  const prompt = buildPrompt(categoryName, description)
  const apiUrl = getApiUrl(model)

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

export type CategoryInput = {
  name: string
  description: string
}

export async function generateQuizCategories(
  apiKey: string,
  categories: CategoryInput[],
  onProgress?: (completed: number, total: number) => void,
  model: GeminiModel = DEFAULT_MODEL
): Promise<QuizCategory[]> {
  const results: QuizCategory[] = []

  for (let i = 0; i < categories.length; i++) {
    const { name, description } = categories[i]
    const category = await generateCategory(apiKey, name, description, model)
    results.push(category)
    onProgress?.(i + 1, categories.length)
  }

  return results
}
