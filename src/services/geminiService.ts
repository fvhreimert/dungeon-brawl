import type { QuizCategory } from '@/types/quiz'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

const CATEGORY_PROMPT_TEMPLATE = `Du er en ekspert i at udforme quizspørgsmål. Generér præcis 5 quizspørgsmål inden for kategorien: [Category].
Følg eventuelle særlige instruktioner: [Instructions].

Krav:

1. Alle spørgsmål og svar skal være på dansk.
2. Svarene skal være faktuelt korrekte, verificerbare og formuleret som korte, præcise udsagn.
2. Spørgsmålene skal være relevante og interessante for et publikum i alderen 25–30 år.
3. Spørgsmålene skal kunne besvares mundtligt uden hjælpemidler.
4. Spørgsmålene skal stige gradvist i sværhedsgrad (1 = let, 5 = svært).
5. Spørgsmålene må ikke være ledende eller afsløre svarene på sig selv.
6. Spørgsmålene må ikke afsløre svarene på de andre spørgsmål.
7. Undgå at gentage nøgleord fra et svar i senere spørgsmål.
8. Spørgsmålene skal være korte, naturligt formulerede og uden unødige detaljer.
9. Undgå "trick questions" – spørg hellere klart og fængende.
10. Undgå at lave for lange spørgsmål om muligt. 

Tjek før du svarer:

1. Intet spørgsmål må indeholde sit eget svar.
2. Ingen spørgsmål må bruge et ord eller navn, der direkte optræder i et andet spørgsmål eller svar.

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
  description: string
): Promise<QuizCategory> {
  const prompt = buildPrompt(categoryName, description)
  
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
  onProgress?: (completed: number, total: number) => void
): Promise<QuizCategory[]> {
  const results: QuizCategory[] = []
  
  for (let i = 0; i < categories.length; i++) {
    const { name, description } = categories[i]
    const category = await generateCategory(apiKey, name, description)
    results.push(category)
    onProgress?.(i + 1, categories.length)
  }
  
  return results
}
