import type { Quiz } from '@/types/quiz';

export async function fetchJeopardyLabsQuiz(inputUrl: string): Promise<Quiz> {
  // 1. Transform URL to print version and prepare for proxy fetching
  // Expected input: https://jeopardylabs.com/play/some-slug
  // Target: /jeopardy-api/print/some-slug (using vite proxy)
  
  let slug = '';
  try {
    const urlObj = new URL(inputUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    // Usually path is /play/slug or just /print/slug
    // We want the last part basically, or specifically the one after 'play' or 'print'
    slug = pathParts[pathParts.length - 1];
  } catch (e) {
    // If not a valid URL, maybe it's just the slug?
    slug = inputUrl.trim();
  }

  // Construct the proxy URL
  // In development, this hits localhost:5173/jeopardy-api/print/... -> https://jeopardylabs.com/print/...
  // In production (without backend), this might fail if not handled, but we are designing for the dev setup as requested.
  const proxyUrl = `/jeopardy-api/print/${slug}`;

  console.log(`Fetching quiz from: ${proxyUrl} (Original: ${inputUrl})`);

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch quiz: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  return parseJeopardyHtmlToQuiz(html, slug);
}

function parseJeopardyHtmlToQuiz(html: string, defaultTitle: string): Quiz {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Strategy: Semantic DOM Parsing
  // JeopardyLabs Print page uses a grid layout with specific classes.
  
  // 1. Extract Categories
  const categoryElements = doc.querySelectorAll('.grid-row-cats .cat-cell');
  const categories: { name: string; questions: { q: string; a: string }[] }[] = [];

  categoryElements.forEach((el) => {
    categories.push({
      name: el.textContent?.trim() || 'Untitled Category',
      questions: []
    });
  });

  if (categories.length === 0) {
    throw new Error("No categories found in the quiz page.");
  }

  // 2. Extract Questions
  // Questions are in .grid-row-questions .grid-cell
  // Each cell has a data-col attribute that maps to the category index.
  const questionCells = doc.querySelectorAll('.grid-row-questions .grid-cell');

  questionCells.forEach((cell) => {
    const colIndex = parseInt(cell.getAttribute('data-col') || '-1', 10);
    
    if (colIndex >= 0 && colIndex < categories.length) {
      // JeopardyLabs HTML structure:
      // .answer -> The Clue (what appears on the board)
      // .question -> The Response (what the player says)
      const clueEl = cell.querySelector('.answer');
      const responseEl = cell.querySelector('.question');

      if (clueEl && responseEl) {
        // Use textContent to strip HTML tags, or innerHTML if we wanted formatting (but game uses plain text mostly)
        const q = clueEl.textContent?.trim() || '';
        const aRaw = responseEl.textContent?.trim() || '';
        const a = normalizeAnswer(aRaw);

        // Only add if there is actual content
        if (q) {
           categories[colIndex].questions.push({ q, a });
        }
      }
    }
  });

  return {
    displayName: defaultTitle || 'Stealed Quiz',
    categories: categories.map(c => ({
      name: c.name,
      questions: c.questions
    }))
  };
}

function normalizeAnswer(aRaw: string): string {
  let a = aRaw.trim();
  // Remove leading Jeopardy-style prefix if present
  a = a.replace(/^(Hvad|Hvem|What|Who)\s+(er|is|are)\s+/i, "");
  // Remove surrounding quotes if present
  a = a.replace(/^"+"|"+"$/g, "").replace(/^“|”$/g, "");
  // Remove trailing question mark
  a = a.replace(/\?$/, "").trim();
  // Remove surrounding quotes again
  a = a.replace(/^"+"|"+"$/g, "").trim();
  return a;
}
