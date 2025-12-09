# Card Framework

This repository keeps cards decoupled from the rest of the game so new mechanics are easy to reason about.

## Core primitives

- `src/data/cards.ts` declares every card that can be drawn. Each `CardDefinition` includes `id`, `title`, `description` (used in the reveal modal), an optional `inventoryDescription`, visual assets, and a `theme` for the pixel frames.
- A drawn card becomes a `CardInstance` (`src/types/game.ts`), which copies the definition, stamps on a unique `instanceId`, and can hold `state` that persists for that copy (stored damage, counters, etc.).
- `CardInstance` metadata flows through the `cardEffectRegistry` (`src/features/cards/cardEffectRegistry.ts`). That registry wires events (`turnStart`, `damageTaken`, `activated` and any future hooks) to handlers that can mutate card state (`updateCardState`) or affect scores/players.
- Passive pacing is centralized through `getPassiveDelta` helpers in the registry and the `calculatePassiveDeltaForPlayer(player, players)` aggregator. This function also accounts for incoming effects from other players' cards (e.g., Beggar stealing from opponents). Scoreboard styling pulls directly from that helper so the arrow/badge always matches the sum of the next `turnAdvanced` passives, while the other stats (passive gains, question losses, card hits) stay in `PlayerStats`.

## Hook responsibilities

- `useJeopardyGame` owns the tile grid, player order, score history, and card lifecycle. It exposes `applyScoreChange`, which gates the `damageTaken` event, seeds `runCardEffect`, and resets turn totals whenever the active player changes.
- Card activations go through `activateCard`, which looks up the owner’s inventory entry, saves a snapshot (for undo), and fires `runCardEffect('activated', …)` so the registry and the card’s own state can resolve the effect.
- Any card that needs a target should expose an `activated` handler in the registry and expect the UI to prompt `PlayerSelectModal` via the `handleCardUseRequest` / `handleCardTargetSelect` flow in `src/App.tsx`.
- When a card needs to impose status effects outside of scoring (e.g., Puppet Master’s category locks), the `CardEffectContext` now exposes `setPuppetLockForPlayer(playerIndex, lock | null)`. Locks live alongside the undo history so they’re restored correctly when stepping back in time.

## Inventory UI & tooltip UX

- `InventoryModal` renders cards using the pixel frames and overlays; clicking a card triggers `onUseCard` when the card has an `activated` handler, so there are no separate “Use” buttons.
- The modal also drives the dynamic inventory description: special cards (Niffler, Soul Burst) query their `CardInstance.state` and format strings like `+25 pts/turn\n*123* pts total` or `*25* pts stored\nActivate to steal stored pts from a foe.` General cards fall back to `inventoryDescription ?? description`.
- Hover tooltips render through a portal anchored to the hovered card’s bounding rect, float above the modal, show the base `description`, and appear only after ~450ms without scrolling. Any scroll/resize/wheel event immediately hides the tooltip so it never clips or duplicates.
- The scoreboard reads `calculatePassiveDeltaForPlayer(player, players)` so the pixel arrow and number always show the same sum of passives that will fire on the next `turnAdvanced` event; `PlayerStats` continues to hold the detailed totals for gains and losses.

## Inventory Tooltip UX

- Inventory cards now scale and lift on hover (`card-wrapper` handles the transform), so the tooltip’s bounding rect is recalculated to reflect the enlarged card and remain aligned with the card’s new size.
- The tooltip respects the portal layout: it is measured after the 450ms hover delay and positioned immediately to the right so the arrow (rendered by `inventory-hover-card::after`) can point left toward the card. Its `pointer-events` are disabled, it floats over other layers, and its `z-index` is high enough to escape the modal clipping.
- The tooltip is canceled before it ever renders if any scroll/wheel/resize events fire, ensuring it never fights the inventory scroll. When it does render, it uses the card’s base `description` text, while the in-card description box shows the inventory-specific text (with the `pre-line` formatting) so the tooltip can remain short and mechanical.

## Adding a new card

1. Add the visual/display metadata to `src/data/cards.ts`, filling `description` (reveal) and `inventoryDescription` (inventory fallback). Use `theme` to pick a frame and drop the new assets under `src/assets/images/cards`.
2. Register the card in `src/features/cards/cardEffectRegistry.ts`. Include `handlers` for any lifecycle hooks you need (`turnStart`, `damageTaken`, `activated`, etc.), leverage `applyScoreChange`, and update stored state with `updateCardState`.
3. If the card grants or drains passive resources, implement `getPassiveDelta` so `calculatePassiveDeltaForPlayer` knows how much the scoreboard should display ahead of the next `turnAdvanced` cycle.
4. If you need dynamic inventory text beyond the static template (new counters, stored values, percent bonuses), extend `InventoryModal.getInventoryDescription` to format the string from `card.state`.
5. Use the card’s state when computing new effects (e.g., Soul Burst accumulates stored damage via the `damageTaken` hook and resets it after activation).

Keeping the registry and hook logic in lockstep keeps new cards isolated and easy to test.
