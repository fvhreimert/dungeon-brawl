# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Entry is `src/main.tsx`; root layout in `src/App.tsx` with styles in `src/App.css` and global tokens in `src/index.css`.
- `src/config/`: Centralized configuration (`gameConfig.ts`) for gameplay settings, UI labels, and players.
- `src/components/game/`: Feature components (`GameBoard`, `Scoreboard`, `QuestionDialog`) that render the Jeopardy flow. Each component has its own CSS file.
- `src/features/`: Complex feature logic and components, organized by domain.
  - `features/actions/`: Contains logic for Dungeon Actions (Mad Seer, Frog of Fate, Dice of Fortune).
- `src/components/ui/`: UI primitives, including 8bit buttons in `ui/8bit/`.
- `src/hooks/`: Custom logic like `useJeopardyGame` for turn state, scoring, history (undo), and statistics.
- `src/types/`: Shared TypeScript types (e.g., `game.ts`).
- `src/data/`: Game content such as `questions.json`.
- `src/assets/`: Media files (images, sounds) to be imported directly into components.
- `public/`: Static assets (fonts, `vite.svg`) and assets requiring stable URL paths (e.g., cursor in `public/images/`).
- Config: Vite (`vite.config.ts`), TypeScript (`tsconfig*.json`), Tailwind (`tailwind.config.js`), ESLint (`eslint.config.js`).

## Dungeon Actions (Game Mechanics)
The game features three special "Dungeon Actions" available to players, each providing unique strategic advantages or chaos. These are located in the sidebars and interact directly with the game board.

### Mad Seer
- **Logic:** `src/features/actions/madSeer/`
- **Mechanic:** Allows a player to preview the content of a specific tile before committing to it.
- **Flow:**
  1. Player activates the Mad Seer.
  2. Selects any open tile on the board.
  3. A modal (`MadSeerModal`) appears, showing a chaotic swirl of words from the question.
  4. Player can choose to **Embrace the Vision** (select the tile immediately) or **Reject the Omen** (cancel and return to board).

### Frog of Fate
- **Logic:** `src/features/actions/frogOfFate/`
- **Mechanic:** Adds a multiplier to a random tile.
- **Flow:**
  1. Player activates the Frog of Fate.
  2. The frog automatically "hops" across random open tiles (visual and audio cues).
  3. Lands on a final tile and applies a **2x Multiplier**.
  4. The multiplier persists until the tile is selected.

### Dice of Fortune
- **Logic:** `src/features/actions/diceOfFortune/`
- **Mechanic:** Forces a random selection by eliminating choices.
- **Flow:**
  1. Player activates the Dice of Fortune.
  2. A "crumbling" effect ripples through the board, visually disabling tiles.
  3. One single **Survivor** tile remains (highlighted in gold).
  4. All other tiles are effectively locked/crumbled.
  5. The player is forced to select the survivor tile to proceed, which clears the crumbled state.

## Build, Test, and Development Commands
- `npm run dev` — Start Vite dev server with HMR.
- `npm run build` — Type-check (`tsc -b`) then create production build.
- `npm run preview` — Serve the production build locally.
- `npm run lint` — Run ESLint across the repo.
- `npx vitest run` — Run unit tests.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Styles: Tailwind utilities plus component-specific CSS files (e.g., `GameBoard.css`, `Actions.css`) for custom pixel/dungeon aesthetics.
- Naming: Components PascalCase (`QuestionDialog.tsx`), hooks camelCase (`useJeopardyGame`), CSS classes kebab-case if added.
- Asset Handling: Assets in `src/assets` must be imported as modules (e.g., `import icon from '@/assets/icon.png'`) rather than referenced by string paths. Assets in `public/` should be referenced by absolute paths (e.g., `/images/cursor.png`).
- Imports: Use path alias `@/` for `src/` (configured in `tsconfig.json`).
- Formatting: 2-space indentation; rely on ESLint for consistency.

## Testing Guidelines
- Vitest is configured for unit testing. Tests are located near their source files (e.g., `src/hooks/useJeopardyGame.test.ts`).
- Always validate changes with `npm run build`, `npm run lint`, and `npx vitest run`.

## Commit & Pull Request Guidelines
- Commits: Use clear, imperative summaries (e.g., “Refactor board into GameBoard component”) and keep related changes together.
- Pull Requests: Describe the change, note UI impacts (screenshots/GIFs welcome), list validation commands, and link issues if applicable.
- Keep diffs small and focused; update docs or config when behavior changes.

## Security & Configuration Tips
- No secrets should be committed. Environment-specific values belong in `.env` (not tracked). Vite exposes variables prefixed with `VITE_`.
- Dependencies are local; avoid adding network-installed binaries to source. Use `npm ci` in automation for deterministic installs.
