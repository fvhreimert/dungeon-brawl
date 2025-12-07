# Card Creation Guide

This reference walks through the main frameworks that protect and scale the card system. The workflow can evolve over time, so treat the sections below as the current contract and update them when underlying patterns shift.

## 1. Card metadata
- Definitions live in `src/data/cards.ts`. Each entry must meet the `CardDefinition` shape: `id`, `title`, `description`, optional `inventoryDescription`, `theme`, visual assets, and any future flags like `consumesOnActivate`.
- Keep each file lightweight: visual assets are imported once per card, and any new card you add should reuse the existing `theme` frames or drop new ones under `src/assets/images/cards/{images,frames}`.
- Updating this file alone does not make a card active; every card must appear in the registry and catalog (see below).

## 2. Card catalog & draw weights
- `src/config/cardCatalog.ts` mirrors every card definition while exposing draw-tuning fields: `baseWeight`, `weightModifiers`, and `drawFilter`.
- `buildCardDrawContext(players, activePlayerIndex)` gathers player scores, inventory IDs, and related state so weight modifiers can adjust draws dynamically.
- `pickCardForPlayer(context)` samples from the catalog, applying filters and modifiers before returning the selected definition. Card Jester and other draw systems rely on this; extend it if you need multiple draw sources (e.g., treasure chests vs. action cards).
- When adding a new card, add a config entry to `CARD_CONFIG` if it needs custom weights or filters. Base weight defaults to 1, so you can add modifiers later when balancing without touching the draw logic.
- `CARD_CONFIG` also exposes `targetSelectMode`, which the UI uses to decide which player selector to render when a card needs a victim: `'standard'` shows the blood-sacrifice style, `'neutral'` locks to players with cards (e.g., Thieving Rat), and `'fel'` renders the Soul Burst/green theme. Keep the catalog in sync with any new selection rules you add.

## 3. Effect registry & lifecycle hooks
- `src/features/cards/cardEffectRegistry.ts` ties card IDs to `CardEffectDefinition`s: each definition can expose handlers for lifecycle hooks (`turnStart`, `damageTaken`, `activated`, `turnAdvanced`) plus a `getPassiveDelta` helper that describes how much the card nudges your per-turn meter whenever a turn advances. Keep that helper aligned with whatever happens in `turnAdvanced` so the UI and logic stay consistent.
- `turnAdvanced` now fires whenever the active player rotates—that is the contract we call “per turn.” Countdown drains (Cursed Coin), recurring gains (Niffler), and percent sinks (Tick) all live here, and the system runs them in a deterministic order (tick effects first) so the calculations stay predictable.
- `calculatePassiveDeltaForPlayer` re-uses every inventory card’s `getPassiveDelta` to compute the total passive delta, and the scoreboard reads that value directly so the arrow/badge updates instantly when scores, cards, or state change.
- `runCardEffect` wraps each handler with shared helpers (`applyScoreChange`, `updateCardState`, `transferCardBetweenPlayers`, etc.), so new behaviors stay isolated and explicit. If a card shouldn’t respond to a hook, omit the handler; if it needs to mutate its own state, use `updateCardState`.

## 4. Game hook & activation flow
- `useJeopardyGame` seeds stats and inventory per player, exposes `addCardToInventory`/`activateCard`, and handles undo/history.
- The activation path closes the inventory and reads the card’s `targetSelectMode` from the catalog to decide which player selector to show: `'standard'` keeps the red blood sacrifice style; `'neutral'` disables opponents with empty inventories (Thieving Rat); `'fel'` renders the green Soul Burst/eldritch shell. Keep `CARD_CONFIG[targetSelectMode]` updated if you add new selectors or need filters beyond those defaults.
- When a card is activated it calls `runCardEffect('activated', …)`; the hook also exposes `transferCardBetweenPlayers`, `removeCardFromInventory`, and the context needed for the registry.
- Passive hooks (e.g., `turnStart`, `damageTaken`) are fired automatically from `applyScoreChange` and the `runTurnStartEffects` callback using the same shared context.
- Ensure you keep new helper callbacks in sync with the registry so future cards have everything they need without tight coupling.

## 5. Inventory UI & reveal experience
- `InventoryModal` imports `getCardEffectDefinition` to conditionally show activation affordances and uses card state to drive in-card descriptions/tooltips.
- Activation clicks close the modal and prompt `PlayerSelectModal` (or the new neutral selector) when a card needs a target. The UI pipeline always sits atop the modal stack so cards can show reveal modals or confirm prompts after the effect resolves.
- For passive-only cards, no extra UI is required beyond the existing toolkit, but keep dynamic strings centralized (see `inventoryDescriptionResolvers` in `InventoryModal.tsx`) when card state matters.

## 6. Keeping it flexible for the future
- When introducing new card mechanics, update `docs/card-creation-guide.md` and `AGENTS.md` to capture the new contract so teammates can follow it.
- This guide assumes the `CardDefinition → CardCatalog → CardEffectRegistry → useJeopardyGame/InventoryModal` chain; if you add new systems (e.g., draft pools, per-player decks), extend the catalog or registry helpers rather than scattering logic.
- Tests should live close to their hooks (`src/hooks/useJeopardyGame.test.ts`) once you add behavior for the card; linting (`npm run lint`) has already been part of this workflow, and you can add Vitest coverage where needed.

Following this flow keeps cards easy to reason about while providing the knobs you asked for earlier (per-card weights, player-aware context, single-use cards). If you want to plug in more advanced sourcing (tiered draws, rarity tables), `cardCatalog` is the place to start expanding.
