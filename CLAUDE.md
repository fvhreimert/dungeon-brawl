# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Type-check (tsc -b) + production build
npm run lint         # Run ESLint
npx vitest run       # Run unit tests
npm run preview      # Serve production build locally
npm run tauri:dev    # Run Tauri desktop app in development
npm run tauri:build  # Build Tauri desktop app
```

## Architecture Overview

**Dungeon Brawl** is a retro pixel-art Jeopardy-style quiz game with strategic card-collecting mechanics. Built with React 19 + TypeScript + Vite, with a Tauri desktop wrapper.

### Core Flow
1. `App.tsx` → Menu or Game state
2. `MainMenuScreen` → Quiz selection → Player setup → Game settings
3. `Game.tsx` → Main game orchestration (board, scoreboard, modals, actions)
4. `useJeopardyGame` hook → All game state, turn logic, card effects, scoring

### Key Directories
- `src/config/` — Game configuration (`gameConfig.ts`), card weights/draw logic (`cardCatalog.ts`), runtime settings
- `src/hooks/useJeopardyGame.ts` — Core game hook (~1500 lines): turns, scoring, card activation, quests, alliances
- `src/data/cards.ts` — Card definitions (22 cards with themes, images, effects)
- `src/features/cards/cardEffectRegistry.ts` — Card behavior implementations (passive effects, activation handlers)
- `src/features/actions/` — Dungeon actions (Mad Seer, Frog of Fate, Golden Idol, Card Jester, Blood Sacrifice, Spider Web)
- `src/components/game/` — Game UI components (GameBoard, Scoreboard, modals)
- `src/types/game.ts` — Core type definitions (Player, Tile, Card, Quest, Alliance)

### Card System Architecture

**Card Definition** (`src/data/cards.ts`):
- Static card data: id, title, description, theme, images, consumesOnActivate

**Card Catalog** (`src/config/cardCatalog.ts`):
- Draw weights and modifiers per card
- `baseWeight`: Static weight (1-10, higher = more common)
- `weightModifiers`: Dynamic functions adjusting weight based on player inventory/state
- `targetSelectMode`: How the card targets (standard, neutral, fel, puppet, roulette, treasure, freeze, coalition, price_cracker, none)
- `pickCardForPlayer(context, cardWeights?)`: Weighted random card selection; optional `cardWeights` override from game settings

**Card Effects** (`src/features/cards/cardEffectRegistry.ts`):
- Lifecycle events: `turnStart`, `turnAdvanced`, `damageTaken`, `activated`
- `getPassiveDelta`: Calculates passive point changes per turn
- Effects use context helpers: `applyScoreChange`, `updateCardState`, `transferCardBetweenPlayers`, `removeCardFromInventory`

### Game State Flow
- Turn starts → Black Market modal (free cards) → Player picks tile → Question answered → Passive effects run → Next turn
- Card effects hook into `turnAdvanced` for per-turn passives (Niffler +25, Tick -1%, Beggar steals)
- `applyScoreChange(playerIndex, delta, reason)` triggers damage reactions on affected players

### Game Settings System

**Configuration Files**:
- `src/config/gameConfig.ts` — Default game settings values
- `src/config/runtimeConfig.tsx` — Runtime config types and context provider
- `src/components/menu/GameSettingsScreen.tsx` — Settings UI component

**Configurable Mechanics**:
- **Card Weights**: Base draw weight for all 21 cards (0-20 scale)
- **Black Market**: Cards shown per turn, enabled/disabled
- **Golden Idol**: Points per turn range (min/max), start bonus
- **Blood Sacrifice**: Max sacrifice amounts (normal/upgraded)
- **Spider Web**: Rerolls per isopod/sheep, upgrades per sheep
- **Treasure Island**: Value multiplier, curse penalty %, curse increase rate, initial curse chance
- **Actions**: Uses per turn, limits for Card Jester, Mad Seer, Frog of Fate, etc.

**Flow**: `GameSettingsScreen` (UI) → `GameplaySettings` (state) → `mapToRuntimeConfig()` → `RuntimeGameConfig` (used in game)

### Quest System
- Quests defined in `src/data/quests.ts`, tracked in `player.quests`
- Progress via `updateQuestProgress(playerIndex, questId, delta)`
- Rewards: cards, points, action upgrades, or combinations

## Coding Conventions

- Path alias: `@/` maps to `src/`
- Components: PascalCase, hooks: camelCase prefixed with `use`
- Styles: Tailwind utilities + component CSS files for pixel aesthetics
- Assets in `src/assets/` must be imported as modules
- Assets in `public/` referenced by absolute path

## Before Adding Cards

Read these docs first:
- `docs/card-creation-guide.md` — Current contract for new cards
- `docs/card-framework.md` — Definition → Instance → Registry flow

Card addition checklist:
1. Add definition to `src/data/cards.ts`
2. Configure weights/targeting in `src/config/cardCatalog.ts`
3. Implement effects in `src/features/cards/cardEffectRegistry.ts`
4. Add images to `src/assets/images/cards/`
5. Update documentation (see `docs/documentation-update-guide.md`)

## Documentation Updates (End of Session)

When requested or before ending a session, consult `docs/documentation-update-guide.md` to determine which documentation files need updating based on completed work. Key files:
- `AGENTS.md` — Technical architecture reference
- `GAME_MANUAL.md` — Player-facing game manual
- `docs/card-creation-guide.md` — Card implementation guide
- `docs/quest-system-guide.md` — Quest implementation guide
