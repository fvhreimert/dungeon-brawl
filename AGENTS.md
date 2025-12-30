# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Entry is `src/main.tsx`; root layout in `src/App.tsx` with styles in `src/App.css` and global tokens in `src/index.css`.
- `src/config/`: Centralized configuration (`gameConfig.ts`) for gameplay settings, UI labels, default players (including portraits).
- `src/components/menu/`: Main menu components (`MainMenuScreen`) for game setup flow before entering the game.
- `src/components/game/`: Feature components (`Game`, `GameBoard`, `Scoreboard`, `QuestionDialog`, `InventoryModal`, `PlayerSelectModal`, `ScoreAdjustModal`, `BlackMarketModal`) that render the Jeopardy flow. Each component has its own CSS file.
- `src/features/`: Complex feature logic and components, organized by domain.
  - `features/actions/`: Contains logic for Dungeon Actions (Mad Seer, Frog of Fate, Golden Idol, Card Jester, Blood Sacrifice).
  - `features/quests/`: Quest system UI components (QuestIndicator, QuestModal) with pixel-art styling.
- `src/components/ui/`: UI primitives, including 8bit components in `ui/8bit/` (buttons, badges, cards).
- `src/hooks/`: Custom logic like `useJeopardyGame` for turn state, scoring, history (undo), and statistics. Also `useGlobalClickSound` for UI click feedback.
- `src/types/`: Shared TypeScript types (e.g., `game.ts`, `quiz.ts`).
- `src/data/`: Game content such as `questions.json`.
  - `src/data/quizzes/`: Quiz JSON files following the template format. Each quiz has a `displayName` and array of `categories` with questions.
- `src/utils/`: Utility functions for quiz loading (`quizLoader.ts`) and portrait management (`portraits.ts`).
- `src/assets/`: Media files (images, sounds) to be imported directly into components.
  - `src/assets/images/ui/portraits/`: Player portrait images (Icons_01.png through Icons_40.png).
  - `src/assets/images/ui/`: UI images including `reroll.png` and `reroll_pressed.png` for Black Market reroll buttons.
  - `src/assets/sounds/UI/`: UI sounds like `click.mp3` for button feedback.
- `public/`: Static assets (fonts, `vite.svg`) and assets requiring stable URL paths (e.g., cursor in `public/images/`).
- Config: Vite (`vite.config.ts`), TypeScript (`tsconfig*.json`), Tailwind (`tailwind.config.js`), ESLint (`eslint.config.js`).

## Main Menu & Game Setup
The game starts with a main menu flow before entering the actual game board.

### Menu Flow
1. **Main Menu** (`src/components/menu/MainMenuScreen.tsx`)
   - Displays "DUNGEON BRAWL" title with the November font
   - Options: "Quiz from File" (active), "Generate Quiz" (active, grid-based layout for categories/descriptions)
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

4. **Game Settings** (`src/components/menu/GameSettingsScreen.tsx`)
   - Configurable gameplay options before starting a game
   - Settings are converted to `RuntimeGameConfig` via `src/config/runtimeConfig.tsx`
   - Key settings include:
     - **Points**: Starting points, tier values (100-500 default), score meter max
     - **Gameplay**:
       - **Free Cards Per Turn**: Number of cards each player receives at turn start (0-10 or ∞ for player count - 1)
       - **Starting Rerolls**: Number of card rerolls each player starts with (default: 10, configured in `gameConfig.ts`)
       - Max tile multiplier
       - **Subtract Points on Wrong** (disabled by default)
     - **Spider Sense**: Bonus per level, max level
     - **Spider Web**: Rerolls per isopod fed (default: 1), rerolls per sheep fed (default: 3), upgrades per sheep (default: 1)
     - **Alliances**: Duration multiplier
     - **Items**: Cursed Coin duration and value
     - **Golden Idol**: Points per turn range (min/max), start bonus
     - **Blood Sacrifice**: Max sacrifice amounts (normal: 100, upgraded: 200)
     - **Action Prices**: Card Jester, Mad Seer, Frog of Fate costs
     - **Action Limits**: Per-turn limits for each action (supports infinity)
     - **Card Weights**: Base draw weight for all 21 cards (0-20 scale, higher = more common)

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

**Upgrade System:**
Upgraded versions of actions are unlocked via the **Spider Web** mechanic. Players must feed the spider to grow it, and eventually feed it a Sheep to unlock a permanent upgrade for one of their actions.

### Spider Web (New)
- **Logic:** `src/features/actions/web/`
- **Mechanic:** A persistent growth system that rewards feeding the spider.
- **Feeding Isopods:**
  - Players can feed **Isopod** cards to the spider.
  - Each isopod increases the **Spider Sense** level.
  - Each isopod grants bonus rerolls (default: 1, configurable).
  - **Spider Sense:** Grants a **+5% score bonus** per level on all correct answers.
  - The spider grows visually as it is fed (max size at index 8).
- **Feeding Sheep:**
  - Once the spider reaches max size, players can feed it a **Sheep** card.
  - Each sheep grants bonus rerolls (default: 3, configurable).
  - This triggers the `ActionUpgradeModal`, allowing the player to choose actions to **permanently upgrade** (default: 1 upgrade per sheep, configurable).
  - **Visuals:** An interactive web interface where the spider grows and options to feed appear based on inventory.

### Mad Seer
- **Logic:** `src/features/actions/madSeer/`
- **Mechanic:** Allows a player to preview the content of a specific tile before committing to it.
- **Standard:**
  - Player selects any open tile.
  - A modal (`MadSeerModal`) appears with a chaotic swirl of words from the question.
  - Player can **Embrace the Vision** (select tile) or **Reject the Omen** (cancel).
- **Upgraded:**
  - **Effect:** Reveals double the amount of words in the vision, making it easier to decipher the question.
  - **Visuals:** Uses `mad_seer_upgraded.png`, white label text, and a white pulsating glow.

### Frog of Fate
- **Logic:** `src/features/actions/frogOfFate/`
- **Mechanic:** Adds a multiplier to random tiles.
- **Standard:**
  - Frog hops across random open tiles and lands on one.
  - Applies a **2x Multiplier** to the landed tile.
- **Upgraded:**
  - **Effect:** Two frogs are deployed simultaneously, selecting **2 unique tiles**. If both land on the same tile (rare but possible logic), multipliers stack.
  - **Visuals:** Uses `frog_of_fate_upgraded.png`, orange label text, and a orange pulsating glow.

### Golden Idol
- **Logic:** `src/features/actions/goldenIdol/`
- **Mechanic:** Forces a random selection by eliminating choices. Accumulates bonus points each turn.
- **Configuration:** Start bonus (default: 10), points per turn range (default: 5-100).
- **Standard:**
  - A "crumbling" effect disables most tiles.
  - **1 Survivor** tile remains. Player is forced to select it.
  - Bonus points are awarded on selection (accumulated over turns).
- **Upgraded:**
  - **Effect:** Selects **2 distinct survivor tiles** instead of 1. Player can choose either of the survivors.
  - **Visuals:** Uses `golden_idol_upgraded.png`, diamond-blue label text, and a diamond-blue pulsating glow.

### Card Jester
- **Logic:** `src/features/actions/cardJester/`
- **Mechanic:** Grants the player random item cards.
- **Standard:**
  - Draws **1 card** from the deck.
  - Displays it in a modal (`CardRevealModal`) and adds to inventory.
- **Upgraded:**
  - **Effect:** Draws **2 cards** simultaneously.
  - **Visuals:** Uses `card_jester_upgraded.png`, green label text, and a green hover glow.

### Blood Sacrifice
- **Logic:** `src/features/actions/bloodSacrifice/`
- **Mechanic:** Allows a player to sacrifice points to damage or affect another player.
- **Standard:**
  - Player selects an amount to sacrifice (max **100**, configurable).
  - Selects a target player to damage.
- **Upgraded:**
  - **Effect:** Maximum sacrifice limit increased to **200** points (configurable).
  - **Visuals:** Uses `blood_sacrifice_upgraded.png` and an intense red pulsating glow.

## Card System & Passive Tracking
- Card definitions live in `src/data/cards.ts` while runtime behavior flows through the registry (`src/features/cards/cardEffectRegistry.ts`). Each card wires handlers for lifecycle hooks (`turnStart`, `turnAdvanced`, `damageTaken`, `activated`) and, when appropriate, an optional `getPassiveDelta` that describes how the card moves the passive meter every time a turn advances.
- The `turnAdvanced` event fires whenever control moves to the next player (that is what we now mean by "per turn"), so countdowns, recurring drains, or passive gains all happen there before the next claimant acts. `calculatePassiveDeltaForPlayer(player, players)` sums every inventory entry's `getPassiveDelta` plus incoming effects from other players' cards (e.g., Beggar stealing from opponents), and the scoreboard consumes that aggregate so the pixel arrow/number always matches the sum of the next passives. `PlayerStats` keeps the detailed totals (gains, question losses, card hits) but no longer stores the badge's value.
- `useJeopardyGame` seeds stats, exposes `applyScoreChange`, and runs `runCardEffect` so every handler shares the same helpers (`updateCardState`, `transferCardBetweenPlayers`, `removeCardFromInventory`, etc.). Keep new registry behaviors isolated so each lifecycle path stays predictable.
- Before adding cards, read `docs/card-creation-guide.md` for the current contract (catalog knobs, target selectors, and passive tracking guidance) and `docs/card-framework.md` for the lasting reference on how definition → instance → registry flows together.
- Card draw tunings and metadata live in `src/config/cardCatalog.ts`; `CARD_CATALOG` mirrors `CARDS` while letting you tweak `baseWeight`, `weightModifiers`, `drawFilter`, and `targetSelectMode` per card before `Card Jester` (and future drawers) hits `pickCardForPlayer`. The `pickCardForPlayer(context, cardWeights?)` function accepts optional custom weights from game settings, allowing per-game weight overrides. This config can prime future scalings for weights based on player state, inventory, or score deltas.
- **Treasure Set Weight Modifiers:** The treasure set cards (Shovel, Compass, Treasure Map) have dynamic `weightModifiers` that increase draw probability when a player has partial sets:
  - Each treasure card has a base weight of 8.
  - If you have 1 treasure item, the other 2 items get +4 weight each (8→12).
  - If you have 2 treasure items, the missing one gets +8 weight (8→16).
  - If you have all 3, they all return to base weight 8 (no bonuses).
  - This creates a "combo completion" mechanic that helps players finish their treasure sets.
- Available `targetSelectMode` values: `'standard'` (blood sacrifice style), `'neutral'` (players with cards only), `'fel'` (green Soul Burst theme), `'puppet'` (Puppet Master flow with category selection), `'roulette'` (self-targeting gambling modal), `'treasure'` (treasure set combination), `'freeze'` (tile/action freeze selection), `'coalition'` (alliance formation), `'none'` (immediate activation, no target needed).

## Quest System
The quest system allows cards to grant players objectives that track progress over time and reward completion.

### Core Concepts
- **Quest Definitions:** Located in `src/data/quests.ts`. Each quest has an id, title, description, target value, reward, icon, and optional upgrade icon.
- **Quest Instances:** Created via `createQuestInstance(questId, sourceCardInstanceId)` when a card grants a quest.
- **Quest State:** Stored in `player.quests` array on each player in `useJeopardyGame`.

### Current Quests
| Quest | Target | Reward |
|-------|--------|--------|
| **Blood Quest** | 300 HP sacrificed | 3 cards + Blood Sacrifice upgrade |
| **Seer Quest** | 5 Mad Seer uses | 125 gold + Mad Seer upgrade |
| **Jester's Quest** | 3 Card Jester purchases | 200 gold + Card Jester upgrade |
| **Frog's Quest** | 3 Frog of Fate uses | 3 cards + Frog of Fate upgrade |
| **Idol's Quest** | 3 Golden Idol uses | 3 cards + Golden Idol upgrade |
| **Glacial Quest** | 2 Glacial Elemental uses | 300 gold + 3 cards |
| **Wisdom Quest** | 3 correct answers in a row | 3 cards + 300 gold |
| **Spider's Quest** | 3 isopods fed to spider | 5 isopod cards |

### Reward System
Rewards support flexible combinations:
- **Primary reward:** `type: 'cards'` or `type: 'points'` with `amount`
- **Action upgrades:** `upgradeAction` grants permanent action upgrades
- **Mixed rewards:** `bonusPoints` and `bonusCards` add extras on top of primary
- **Specific cards:** `specificCardId` gives exact card types instead of random draws

### Quest Progress
- **Standard progress:** `updateQuestProgress(playerIndex, questId, delta)` increments progress
- **Streak-based quests:** `resetQuestProgress(playerIndex, questId)` resets to 0 on failure (e.g., Wisdom Quest resets on wrong answer)

### UI Components
- **QuestIndicator:** Shows on player panels when they have quests. Glows when completed.
- **QuestModal:** Pixel-art scroll themed modal with progress bar, visual reward display (card backs, gold, upgrade icons).

### Quest Flow
1. Player activates a quest-granting card (e.g., Martin).
2. Card effect returns `grantQuest: { playerIndex, questId, sourceCardInstanceId }`.
3. `Game.tsx` handles the effect and calls `grantQuest()` from the game hook.
4. Quest indicator appears on the player's panel in the Scoreboard.
5. Progress updates automatically based on quest type.
6. When target is reached, quest status changes to `'completed'` and indicator glows.
7. Player clicks indicator to open QuestModal and claim reward.
8. `claimQuestReward()` awards all rewards (cards, points, upgrades, bonuses).

### Adding New Quests
1. Add quest ID to `QuestId` type in `src/types/game.ts`.
2. Add definition to `QUEST_DEFINITIONS` in `src/data/quests.ts`.
3. Add progress tracking at the appropriate location (action handler, effect, etc.).
4. For streak quests, also call `resetQuestProgress()` on failure conditions.
5. Create a card that grants the quest via `grantQuest` effect result.

See `docs/quest-system-guide.md` for detailed implementation guidance.

## Black Market (Turn Start Card Selection)
- **Logic:** `src/components/game/BlackMarketModal.tsx` and `src/components/game/BlackMarketModal.css`
- **Mechanic:** At the start of each player's turn, a turn intro animation plays followed by the "Black Market" interface where players can view, reroll, and accept their free cards before continuing.
- **Configuration:** Controlled by the `blackMarket` settings in `gameConfig.ts` and the Game Settings screen:
  - `blackMarket.enabled`: Set to `true` to show the Black Market at the start of each turn, or `false` to skip it entirely. Default: `true`.
  - `blackMarket.cardsToShow`: Number of cards displayed in the Black Market (1-5). Default: `3`. Cards are scaled down for 4-5 cards to fit the display.
  - `startingRerolls`: Number of rerolls each player starts with. Default: `10`.
- **Flow:**
  1. When a turn begins, cards are drawn using the weighted card system (`pickCardForPlayer`).
  2. **Turn Intro Animation** plays first:
     - Shows player's portrait with a bounce animation.
     - Displays "[Player Name]'s Turn" and "Choose your cards!" text.
     - Title bar shows "[PLAYER]'S TURN".
     - Lasts ~1.4 seconds, then fades out with scale-down animation.
  3. The question grid (board-shell) is replaced with `BlackMarketModal` with entrance animation.
  4. The main title changes to "BLACK MARKET" (dark blueish-purple metallic style).
  5. Cards fly in one-by-one from below with staggered timing and bounce effect.
  6. The current player's name in the Scoreboard turns red with a glow effect.
  7. Cards are displayed full-size in a horizontally centered row with theme-colored glows.
  8. Each card has a reroll button below it (uses `reroll.png` and `reroll_pressed.png` assets).
  9. Player can reroll individual cards (consumes 1 reroll per use) to get a new random card.
  10. "Accept" button in the lower-right corner confirms selection and adds cards to inventory.
  11. After accepting, the Black Market closes and the normal question grid returns.
- **Visual Effects:**
  - **Turn Intro:** Portrait bounces in, title slides up, subtitle fades in. Exit animation scales down and fades out.
  - **Cards Entrance:** Cards fly in from below with staggered delays (0.1s apart) and subtle bounce.
  - Cards have a subtle glow using their theme's `--col-gold-main` CSS variable.
  - Cards scale up slightly on hover (1.06x) with increased glow.
  - Reroll animation: card slides down and fades out, new card slides up and fades in (350ms duration).
  - Disabled reroll buttons are grayed out when no rerolls remain.
- **State Management:**
  - `rerollsRemaining` tracked per player in `Player` type (`src/types/game.ts`).
  - `blackMarketData` state in `Game.tsx` stores pending cards and player info.
  - `acceptBlackMarketCards()` and `consumeReroll()` functions in `useJeopardyGame` hook.
  - Cards are NOT added to inventory until player clicks "Accept".
- **Implementation:**
  - `onBlackMarketStart` callback in `useJeopardyGame` triggers the modal.
  - Modal reuses `board-shell` class from `GameBoard.css` to maintain exact sizing.
  - Scoreboard receives `isBlackMarketActive` prop to style active player name red.

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

### Glacial Elemental (Freeze Mechanic)
- **Card:** `glacial_elemental` in `src/data/cards.ts`
- **Mechanic:** Freezes a tile OR an action until the caster's next turn. Frozen targets cannot be used by anyone (including the caster).
- **Flow:**
  1. Player activates Glacial Elemental from inventory (uses `targetSelectMode: 'freeze'`).
  2. All open tiles and actions get an icy blue highlight indicating they can be frozen.
  3. Player clicks a tile or action to freeze it.
  4. The target becomes frozen with a strong icy blue visual effect and floating ice particles.
  5. Frozen tiles/actions are disabled for ALL players until unfrozen.
  6. When the caster's turn comes back around, the frozen target automatically unfreezes.
- **State:**
  - Tile freeze info stored in `tile.modifiers.frozen` (`FrozenTileInfo` type in `src/types/game.ts`).
  - Action freeze info stored in `frozenActions` state in `useJeopardyGame` (`FrozenActions` type).
  - Both track `frozenByPlayerIndex` and `frozenByCardInstanceId` for proper unfreezing.
- **Freezable Actions:** `card_jester`, `mad_seer`, `blood_sacrifice`, `frog_of_fate`, `golden_idol`, `web`.
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