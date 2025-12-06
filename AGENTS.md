# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Entry is `src/main.tsx`; root layout in `src/App.tsx` with styles in `src/App.css` and global tokens in `src/index.css`.
- `src/config/`: Centralized configuration (`gameConfig.ts`) for gameplay settings, UI labels, and players.
- `src/components/game/`: Feature components (`GameBoard`, `Scoreboard`, `QuestionDialog`, `InventoryModal`, `PlayerSelectModal`) that render the Jeopardy flow. Each component has its own CSS file.
- `src/features/`: Complex feature logic and components, organized by domain.
  - `features/actions/`: Contains logic for Dungeon Actions (Mad Seer, Frog of Fate, Dice of Fortune, Card Jester, Blood Sacrifice).
- `src/components/ui/`: UI primitives, including 8bit buttons in `ui/8bit/`.
- `src/hooks/`: Custom logic like `useJeopardyGame` for turn state, scoring, history (undo), and statistics.
- `src/types/`: Shared TypeScript types (e.g., `game.ts`).
- `src/data/`: Game content such as `questions.json`.
- `src/assets/`: Media files (images, sounds) to be imported directly into components.
- `public/`: Static assets (fonts, `vite.svg`) and assets requiring stable URL paths (e.g., cursor in `public/images/`).
- Config: Vite (`vite.config.ts`), TypeScript (`tsconfig*.json`), Tailwind (`tailwind.config.js`), ESLint (`eslint.config.js`).

## Dungeon Actions (Game Mechanics)
The game features special "Dungeon Actions" available to players, each providing unique strategic advantages or chaos. These are located in the sidebars and interact directly with the game board.

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

### Card Jester
- **Logic:** `src/features/actions/cardJester/`
- **Mechanic:** Grants the player a random item card.
- **Flow:**
  1. Player activates the Card Jester.
  2. A random card is drawn from the deck.
  3. A modal (`CardRevealModal`) reveals the card to the player.
  4. The card is added to the player's inventory.

### Blood Sacrifice
- **Logic:** `src/features/actions/bloodSacrifice/`
  - **Mechanic:** Allows a player to sacrifice points to damage or affect another player.
  - **Flow:**
    1. Player activates Blood Sacrifice.
    2. A modal (`BloodSacrificeModal`) appears with a pentagram slider.
    3. Player selects an amount of points (1-100) to sacrifice.
    4. Player selects a target player from the `PlayerSelectModal`.
    5. The sacrifice is performed (logic handled in game hook).

## Card System & Passive Tracking
- Card definitions live in `src/data/cards.ts`, but the behaviors are resolved via the new registry (`src/features/cards/cardEffectRegistry.ts`). Each card can declare passive per-turn deltas plus handlers for lifecycle events (e.g., `turnStart`, `damageTaken`, `activated`), and cards can share reusable effect helpers.
- Player state now includes `PlayerStats` (passive per-turn total, turn-aware losses, silenced/puppeteered flags) defined in `src/types/game.ts`. The `useJeopardyGame` hook seeds these stats, exposes `applyScoreChange`, and runs registered card effects via `runCardEffect` to centralize passive/active mechanics.
- Card definitions split presentation: `description` surfaces in the reveal modal while inventory use-cases rely on the second description plus live data from `CardInstance.state`. `InventoryModal` now drives dynamic text for cards like Niffler and Soul Burst, routes hover tooltips through a portal, and handles activation by clicking the card itself (`src/components/game/InventoryModal.tsx`).
- The scoreboard only surfaces the passive-per-turn delta (via `PlayerStats.passivePointsPerTurn`) as a single colored arrow + value beside the score; that indicator is hidden for zero deltas so the UI stays clean while all other stats live quietly in `PlayerStats`.
- Passive deltas only render when non-zero, the arrow and number share the same tint via `currentColor`, and the arrow uses the pixel up/down assets so teammates can tell immediately whether the next turn will be a gain or drain.
- See `docs/card-framework.md` for a compact reference on how the definition → instance → registry workflow is wired and how to wire up new cards safely.

## Inventory & Tooltip UX
- Tooltips render via a portal so they float above the inventory modal, sit to the right of the hovered card, and keep the same vertical alignment as long as the player is stationary.
- Hover tooltips appear after a ~450ms pause, disappear immediately when the player scrolls/resizes/drags, and only the hovered card can render a tooltip so there are never duplicates.
- Dynamic inventory descriptions live inside the base card surface (no extra "use" buttons) while the tooltip reiterates the base `description`. The hook handles activation, so cards trigger the action flow when clicked and, if applicable, prompt `PlayerSelectModal` for targets.
- Cards now scale gently on hover so the tooltip aligns with the enlarged bounding rect, the portal tooltip renders a left-pointing arrow that targets the card, and scrolling/wheeling/resizing immediately cancels the tooltip so it never clips the modal.

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
