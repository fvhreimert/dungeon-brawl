# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Entry is `src/main.tsx`; root layout in `src/App.tsx` with styles in `src/App.css` and global tokens in `src/index.css`.
- `src/config/`: Centralized configuration (`gameConfig.ts`) for gameplay settings, UI labels, default players (including portraits).
- `src/components/menu/`: Main menu components (`MainMenuScreen`) for game setup flow before entering the game.
- `src/components/game/`: Feature components (`Game`, `GameBoard`, `Scoreboard`, `QuestionDialog`, `InventoryModal`, `PlayerSelectModal`, `ScoreAdjustModal`) that render the Jeopardy flow. Each component has its own CSS file.
- `src/features/`: Complex feature logic and components, organized by domain.
  - `features/actions/`: Contains logic for Dungeon Actions (Mad Seer, Frog of Fate, Dice of Fortune, Card Jester, Blood Sacrifice).
- `src/components/ui/`: UI primitives, including 8bit components in `ui/8bit/` (buttons, badges, cards).
- `src/hooks/`: Custom logic like `useJeopardyGame` for turn state, scoring, history (undo), and statistics. Also `useGlobalClickSound` for UI click feedback.
- `src/types/`: Shared TypeScript types (e.g., `game.ts`, `quiz.ts`).
- `src/data/`: Game content such as `questions.json`.
  - `src/data/quizzes/`: Quiz JSON files following the template format. Each quiz has a `displayName` and array of `categories` with questions.
- `src/utils/`: Utility functions for quiz loading (`quizLoader.ts`) and portrait management (`portraits.ts`).
- `src/assets/`: Media files (images, sounds) to be imported directly into components.
  - `src/assets/images/ui/portraits/`: Player portrait images (Icons_01.png through Icons_40.png).
  - `src/assets/sounds/UI/`: UI sounds like `click.mp3` for button feedback.
- `public/`: Static assets (fonts, `vite.svg`) and assets requiring stable URL paths (e.g., cursor in `public/images/`).
- Config: Vite (`vite.config.ts`), TypeScript (`tsconfig*.json`), Tailwind (`tailwind.config.js`), ESLint (`eslint.config.js`).

## Main Menu & Game Setup
The game starts with a main menu flow before entering the actual game board.

### Menu Flow
1. **Main Menu** (`src/components/menu/MainMenuScreen.tsx`)
   - Displays "DUNGEON BRAWL" title with the November font
   - Options: "Quiz from File" (active), "Generate Quiz" (disabled/future)
   - Dark overlay on the dungeon background texture

2. **Quiz Selection**
   - Lists all available quizzes from `src/data/quizzes/`
   - Quizzes are loaded via `src/utils/quizLoader.ts` which statically imports all quiz JSON files
   - Each quiz displays its `displayName` property

3. **Player Setup**
   - Configure number of players (2-8)
   - Each player can set a custom name
   - Each player can select a portrait from 40 available options
   - Used portraits are grayed out (can't be selected by multiple players)
   - Portrait picker modal shows all portraits in a grid

### Quiz Format
Quizzes are JSON files in `src/data/quizzes/` following this structure:
```json
{
  "displayName": "Quiz Name",
  "categories": [
    {
      "name": "CATEGORY NAME",
      "questions": [
        { "q": "Question text?", "a": "Answer" },
        ...
      ]
    },
    ...
  ]
}
```
- Point values are inferred based on question index (100, 200, 300, 400, 500 by default)
- The game board dynamically adjusts columns based on number of categories

### Adding New Quizzes
1. Create a new JSON file in `src/data/quizzes/` following the template
2. Add the import and entry in `src/utils/quizLoader.ts` in the `quizModules` object
3. The quiz will automatically appear in the quiz selection menu

## Fonts
- **Press Start 2P**: Default UI font for buttons, labels, scores, and general text. Imported from Google Fonts.
- **November**: Used for the "DUNGEON BRAWL" title and menu headers. Custom font loaded from `/november.regular.ttf`.
- **ArcadeClassic**: Available via `.arcade-font` class for specific retro text needs. Custom font from `/arcadeclassic.regular.ttf`.

## Global UI Sound
- `useGlobalClickSound` hook (called in `App.tsx`) plays a click sound (`src/assets/sounds/UI/click.mp3`) on every click throughout the app
- Uses capture phase event listener to catch all clicks, even with `stopPropagation`
- Volume set to 0.15 for subtle feedback

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
- Card definitions live in `src/data/cards.ts` while runtime behavior flows through the registry (`src/features/cards/cardEffectRegistry.ts`). Each card wires handlers for lifecycle hooks (`turnStart`, `turnAdvanced`, `damageTaken`, `activated`) and, when appropriate, an optional `getPassiveDelta` that describes how the card moves the passive meter every time a turn advances.
- The `turnAdvanced` event fires whenever control moves to the next player (that is what we now mean by "per turn"), so countdowns, recurring drains, or passive gains all happen there before the next claimant acts. `calculatePassiveDeltaForPlayer(player, players)` sums every inventory entry's `getPassiveDelta` plus incoming effects from other players' cards (e.g., Beggar stealing from opponents), and the scoreboard consumes that aggregate so the pixel arrow/number always matches the sum of the next passives. `PlayerStats` keeps the detailed totals (gains, question losses, card hits) but no longer stores the badge's value.
- `useJeopardyGame` seeds stats, exposes `applyScoreChange`, and runs `runCardEffect` so every handler shares the same helpers (`updateCardState`, `transferCardBetweenPlayers`, `removeCardFromInventory`, etc.). Keep new registry behaviors isolated so each lifecycle path stays predictable.
- Before adding cards, read `docs/card-creation-guide.md` for the current contract (catalog knobs, target selectors, and passive tracking guidance) and `docs/card-framework.md` for the lasting reference on how definition → instance → registry flows together.
- Card draw tunings and metadata live in `src/config/cardCatalog.ts`; `CARD_CATALOG` mirrors `CARDS` while letting you tweak `baseWeight`, `weightModifiers`, `drawFilter`, and `targetSelectMode` per card before `Card Jester` (and future drawers) hits `pickCardForPlayer`. This config can prime future scalings for weights based on player state, inventory, or score deltas.
- Available `targetSelectMode` values: `'standard'` (blood sacrifice style), `'neutral'` (players with cards only), `'fel'` (green Soul Burst theme), `'puppet'` (Puppet Master flow with category selection), `'roulette'` (self-targeting gambling modal), `'treasure'` (treasure set combination), `'freeze'` (tile/action freeze selection), `'coalition'` (alliance formation), `'none'` (immediate activation, no target needed).

### Coalition (Alliance Mechanic)
- **Card:** `coalition` in `src/data/cards.ts`
- **Mechanic:** Forms a temporary alliance between two players. Allied players cannot target each other in any player select modals.
- **Flow:**
  1. Player activates Coalition from inventory (uses `targetSelectMode: 'coalition'`).
  2. A gold-themed player select modal appears showing available players.
  3. Players already allied with the caster are disabled.
  4. Upon selection, an alliance is formed lasting `player_count * 2` turns.
  5. Both players display colored alliance banners on their score panels.
- **State:**
  - Alliance info stored in `alliances` array in `useJeopardyGame` (`Alliance` type in `src/types/game.ts`).
  - Each alliance tracks: `id`, `color` (red/yellow/green/blue), `playerIndices`, `turnsRemaining`, `sourceCardInstanceId`.
  - Alliance timers tick down each turn via `tickDownAlliances()`.
- **Visual Effects:**
  - Colored pixel banners appear in top-right of allied players' score panels.
  - Banner shows remaining turns as a pixel number.
  - Multiple alliances display multiple banners side by side.
- **Targeting Restriction:**
  - All player select modals (`PlayerSelectModal`, `NeutralPlayerSelectModal`, `FelPlayerSelectModal`, `PuppetMasterPlayerSelectModal`) filter out allied players.
  - Allied players show "• allied" label and are disabled.

### Sad Glacial Elemental (Freeze Mechanic)
- **Card:** `sad_glacial_elemental` in `src/data/cards.ts`
- **Mechanic:** Freezes a tile OR an action until the caster's next turn. Frozen targets cannot be used by anyone (including the caster).
- **Flow:**
  1. Player activates Sad Glacial Elemental from inventory (uses `targetSelectMode: 'freeze'`).
  2. All open tiles and actions get an icy blue highlight indicating they can be frozen.
  3. Player clicks a tile or action to freeze it.
  4. The target becomes frozen with a strong icy blue visual effect and floating ice particles.
  5. Frozen tiles/actions are disabled for ALL players until unfrozen.
  6. When the caster's turn comes back around, the frozen target automatically unfreezes.
- **State:**
  - Tile freeze info stored in `tile.modifiers.frozen` (`FrozenTileInfo` type in `src/types/game.ts`).
  - Action freeze info stored in `frozenActions` state in `useJeopardyGame` (`FrozenActions` type).
  - Both track `frozenByPlayerIndex` and `frozenByCardInstanceId` for proper unfreezing.
- **Freezable Actions:** `card_jester`, `mad_seer`, `blood_sacrifice`, `frog_of_fate`, `dice_of_fortune`, `web`.
- **Visual Effects:**
  - Frozen tiles: Icy blue background, glowing border, floating ice particles (in `GameBoard.css`).
  - Frozen actions: Icy blue color shift via CSS filters, ice particle overlays in front and behind (in `Actions.css`).
  - Freeze target mode: Subtle icy glow on valid targets.

### Treasure Set & Treasure Island Mini-Game
- **Logic:** `src/features/cards/TreasureSetModal.tsx` and `src/features/cards/TreasureIslandModal.tsx`
- **Cards:** Shovel, Compass, and Treasure Map form the Treasure Set.
- **Mechanic:** When a player collects all three treasure set cards, they can combine them to play the Treasure Island mini-game.
- **Flow:**
  1. Player activates any treasure set card from inventory (uses `targetSelectMode: 'treasure'`).
  2. `TreasureSetModal` shows collected artifacts; if all three are present, player can "Dig for Treasure".
  3. `TreasureIslandModal` opens with a pirate-themed treasure hunting mini-game.
  4. Player clicks the red X marker on the island map to dig. Each dig plays 3 "throb" sounds before revealing the result.
  5. Successful digs yield treasures with rarity-based values:
     - **Common (50g):** Ring, Scepter, Scroll - gray glow
     - **Rare (100g):** Gold Coins, Gold Bars - blue glow
     - **Epic (150g):** Vessel, Jewellery - purple glow
     - **Legendary (300g):** Treasure Chests - golden orange animated glow
     - **Prismatic (500g):** Crown - rainbow cycling effect
  6. Each treasure can only be found once. Curse risk starts at 10% and increases by `(100 - current) * 0.1` per dig.
  7. If the Pirate King's Curse is triggered, all collected treasure is lost (items gray out).
  8. Player can collect earned gold at any time or continue digging for more (risk vs reward).
- **Assets:** Treasure images in `src/assets/images/ui/treasure/`, sounds in `src/assets/sounds/cards/treasure_set/`.

## Inventory & Tooltip UX
- Tooltips render via a portal so they float above the inventory modal, sit to the right of the hovered card, and keep the same vertical alignment as long as the player is stationary.
- Hover tooltips appear after a ~450ms pause, disappear immediately when the player scrolls/resizes/drags, and only the hovered card can render a tooltip so there are never duplicates.
- Dynamic inventory descriptions live inside the base card surface (no extra "use" buttons) while the tooltip reiterates the base `description`. The hook handles activation, so cards trigger the action flow when clicked and the UI reads the card’s `targetSelectMode` to pick the appropriate selector (blood `PlayerSelectModal`, the neutral modal for cards like Thieving Rat, or the Fel selector for Soul Burst).
- Cards now scale gently on hover so the tooltip aligns with the enlarged bounding rect, the portal tooltip renders a left-pointing arrow that targets the card, and scrolling/wheeling/resizing immediately cancels the tooltip so it never clips the modal.
- **Card Stacking:** Identical cards stack in the inventory with an 8bitcn Badge showing the count (e.g., "x3"). Non-stackable cards with unique state (`soul_burst`, `cursed_coin`) are always shown individually.

## Player Panels & Portraits
- Each player has a portrait image selected during game setup or configured in `gameConfig.ts` via the `portrait` property on `PlayerConfig`.
- Panel layout (top to bottom): Player name, then row with portrait + score + inventory button.
- Portraits appear in:
  - **Scoreboard:** Left side of each player panel (48x48px).
  - **Player Select Modals:** All target selection modals (Blood Sacrifice, Thieving Rat, Soul Burst, Puppet Master) show 56x56px portraits next to player names.
- Portrait images are stored in `src/assets/images/ui/portraits/` (40 portraits available: Icons_01.png through Icons_40.png).
- **Score Colors:**
  - Gold/yellow (`#ffb347`): Normal positive score
  - Green (`#8effb9`): Score increasing animation
  - Red (`#ff8e8e`): Score decreasing animation
  - Red (`#ff6b6b`): Persistent negative score (below 0)

## Game Master Controls
- **Switch Active Player:** Double-click on a player panel to make it that player's turn.
- **Adjust Score:** Double-click on a player's score to open `ScoreAdjustModal` with preset buttons (-100, -50, -10, +10, +50, +100) and manual input.

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
