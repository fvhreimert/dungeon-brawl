# Quest System Guide

This guide covers the quest system architecture and how to add new quests to the game.

## 1. Quest Definitions

Quest definitions live in `src/data/quests.ts`. Each quest is defined with the following structure:

```typescript
export interface QuestDefinition {
  id: QuestId
  title: string
  description: string
  target: number
  reward: QuestReward
  iconPath: string
  upgradeIconPath?: string  // Optional icon for action upgrade rewards
}
```

### Current Quests

| Quest ID | Title | Target | Reward |
|----------|-------|--------|--------|
| `blood_quest` | Blood Quest | 300 HP sacrificed | 3 cards + Blood Sacrifice upgrade |
| `seer_quest` | Seer Quest | 5 Mad Seer uses | 125 gold + Mad Seer upgrade |
| `jester_quest` | Jester's Quest | 3 Card Jester purchases | 200 gold + Card Jester upgrade |
| `frog_quest` | Frog's Quest | 3 Frog of Fate uses | 3 cards + Frog of Fate upgrade |
| `idol_quest` | Idol's Quest | 3 Golden Idol uses | 3 cards + Golden Idol upgrade |
| `glacial_quest` | Glacial Quest | 2 Glacial Elemental uses | 300 gold + 3 cards |
| `wisdom_quest` | Wisdom Quest | 3 correct answers in a row | 3 cards + 300 gold |
| `spider_quest` | Spider's Quest | 3 isopods fed to spider | 5 isopod cards |

### Adding a New Quest Definition

1. Import any required assets (icons):
```typescript
import myQuestIcon from '@/assets/images/actions/my_quest_icon.png'
import myQuestUpgradedIcon from '@/assets/images/actions/my_quest_upgraded.png'
```

2. Add your quest to `QUEST_DEFINITIONS`:
```typescript
export const QUEST_DEFINITIONS: Record<QuestId, QuestDefinition> = {
  // ... existing quests
  my_new_quest: {
    id: 'my_new_quest',
    title: 'My New Quest',
    description: 'Do something interesting 5 times.',
    target: 5,
    reward: {
      type: 'cards',
      amount: 3,
      description: '3 Free Cards + My Action Upgrade',
      upgradeAction: 'my_action',
    },
    iconPath: myQuestIcon,
    upgradeIconPath: myQuestUpgradedIcon,
  },
}
```

## 2. Reward Types

The `QuestReward` type supports flexible reward combinations:

```typescript
export type QuestReward = {
  type: 'cards' | 'points'     // Primary reward type
  amount: number               // Amount of primary reward
  description: string          // Display text
  upgradeAction?: UpgradeableAction  // Optional action upgrade
  bonusPoints?: number         // Additional points on top of primary reward
  bonusCards?: number          // Additional cards on top of primary reward
  specificCardId?: string      // Give specific card type instead of random
}
```

### Reward Examples

**Cards only:**
```typescript
{ type: 'cards', amount: 3, description: '3 Free Cards' }
```

**Points only:**
```typescript
{ type: 'points', amount: 200, description: '200 Gold' }
```

**Cards + Action Upgrade:**
```typescript
{
  type: 'cards',
  amount: 3,
  description: '3 Free Cards + Blood Sacrifice Upgrade',
  upgradeAction: 'blood_sacrifice',
}
```

**Points + Bonus Cards (mixed reward):**
```typescript
{
  type: 'points',
  amount: 300,
  description: '300 Gold + 3 Free Cards',
  bonusCards: 3,
}
```

**Specific Cards (not random):**
```typescript
{
  type: 'cards',
  amount: 5,
  description: '5 Free Isopods',
  specificCardId: 'isopod',
}
```

## 3. Quest Types

Quest types are defined in `src/types/game.ts`:

```typescript
export type QuestId =
  | 'blood_quest'
  | 'seer_quest'
  | 'jester_quest'
  | 'frog_quest'
  | 'idol_quest'
  | 'glacial_quest'
  | 'wisdom_quest'
  | 'spider_quest'

export type QuestStatus = 'active' | 'completed'

export type Quest = {
  id: string                    // Unique instance ID (uuid)
  questId: QuestId              // References the definition
  title: string
  description: string
  progress: QuestProgress
  status: QuestStatus
  reward: QuestReward
  sourceCardInstanceId: string  // Card that granted this quest
}
```

When adding a new quest, update the `QuestId` union type.

## 4. Quest Instance Creation

Quests are created via the factory function in `src/data/quests.ts`:

```typescript
const quest = createQuestInstance('blood_quest', card.instanceId)
```

This creates a new quest instance with:
- A unique `id` (generated UUID)
- Progress initialized to `{ current: 0, target: definition.target }`
- Status set to `'active'`

## 5. Granting Quests via Cards

To create a card that grants a quest, add a card effect in `src/features/cards/cardEffectRegistry.ts`:

```typescript
my_quest_card: {
  handlers: {
    activated: ({ ownerPlayerIndex, card }) => {
      return {
        grantQuest: {
          playerIndex: ownerPlayerIndex,
          questId: 'my_new_quest',
          sourceCardInstanceId: card.instanceId,
        },
      }
    },
  },
},
```

The `grantQuest` effect result is handled in `Game.tsx`, which calls the `grantQuest()` function from `useJeopardyGame`.

## 6. Tracking Quest Progress

Progress tracking happens in `useJeopardyGame.ts` or `Game.tsx`. Find the appropriate action or event and call `updateQuestProgress`:

### Standard Progress Update

```typescript
updateQuestProgress(activePlayerIndex, 'my_quest_id', 1)
```

### Resetting Progress (for streak-based quests)

For quests like `wisdom_quest` that reset on failure:

```typescript
// On success - increment progress
updateQuestProgress(activePlayerIndex, 'wisdom_quest', 1)

// On failure - reset to zero
resetQuestProgress(activePlayerIndex, 'wisdom_quest')
```

### Progress Tracking Locations

| Quest | Tracked In | Location |
|-------|------------|----------|
| `blood_quest` | `useJeopardyGame.ts` | `trackBloodSacrificeForQuest()` |
| `seer_quest` | `Game.tsx` | `handleMadSeerAccept/Reject()` |
| `jester_quest` | `Game.tsx` | `handleCardJesterClick()` |
| `frog_quest` | `Game.tsx` | `handleFrogClick()` |
| `idol_quest` | `Game.tsx` | `handleIdolClick()` |
| `glacial_quest` | `Game.tsx` | `handleTileSelect()` (freeze mode) |
| `wisdom_quest` | `useJeopardyGame.ts` | `handleAnswer()` |
| `spider_quest` | `Game.tsx` | `handleSpiderFeedIsopod()` |

## 7. Quest UI Components

### QuestIndicator
Located at `src/features/quests/QuestIndicator.tsx`.

Shows on player panels when they have quests. Props:
- `quests: Quest[]` - Player's quest array
- `onClick: () => void` - Handler for opening quest modal

Visual states:
- Active quest: Uses `quest_indicator.png`
- Completed quest: Uses `quest_indicator_complete.png` with glow animation

### QuestModal
Located at `src/features/quests/QuestModal.tsx`.

Pixel-art scroll themed modal showing quest details. Props:
- `quest: Quest` - The quest to display
- `onClose: () => void` - Close handler
- `onClaim?: () => void` - Claim reward handler (shown when completed)

Features:
- Quest icon display (from quest definition)
- Progress bar with 300 ticks for granular tracking
- Visual reward display (card backs, gold amount, upgrade icon)
- "Claim Reward" button when quest is completed

## 8. Claiming Rewards

When a player claims a quest reward:

1. Player clicks "Claim Reward" in QuestModal
2. `handleClaimQuestReward()` in `Game.tsx` is called
3. This calls `claimQuestReward(playerIndex, questId)` from the hook
4. The function awards rewards in this order:
   - Primary reward (cards or points)
   - Action upgrade (if `upgradeAction` is set)
   - Bonus points (if `bonusPoints` is set)
   - Bonus cards (if `bonusCards` is set)
5. Quest is removed from player
6. `Game.tsx` shows any awarded cards via `CardRevealModal`

```typescript
const handleClaimQuestReward = () => {
  if (selectedQuestPlayerIndex === null || !selectedQuest) return
  const rewardCards = claimQuestReward(selectedQuestPlayerIndex, selectedQuest.id)
  setSelectedQuest(null)
  setSelectedQuestPlayerIndex(null)
  if (rewardCards && rewardCards.length > 0) {
    setRevealedCards(rewardCards)
  }
}
```

## 9. Integration Points

### Scoreboard Integration
`Scoreboard.tsx` renders `QuestIndicator` for each player:

```tsx
{(player.quests?.length ?? 0) > 0 && (
  <QuestIndicator
    quests={player.quests ?? []}
    onClick={() => onQuestClick(index)}
  />
)}
```

### Game.tsx State
```typescript
const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
const [selectedQuestPlayerIndex, setSelectedQuestPlayerIndex] = useState<number | null>(null)
```

### Effect Result Handling
In the effect result handler after card activation:
```typescript
if (effectResult?.grantQuest) {
  const { playerIndex, questId, sourceCardInstanceId } = effectResult.grantQuest
  grantQuest(playerIndex, questId, sourceCardInstanceId)
}
```

## 10. Styling

Quest UI uses pixel-art styling consistent with the game:
- `QuestIndicator.css`: Indicator positioning, exclamation mark styling, glow animations
- `QuestModal.css`: Scroll-themed modal, progress bar ticks, reward section

Key CSS classes:
- `.quest-modal-backdrop`: Modal overlay
- `.quest-modal`: Main modal container with drop-shadow
- `.scroll-rod`, `.scroll-body`: Scroll decoration elements
- `.quest-progress-bar`, `.quest-progress-tick`: 300-tick progress bar
- `.quest-reward-cards`, `.quest-upgrade-icon`: Visual reward display

## 11. Adding a Complete New Quest

Checklist:
1. [ ] Add quest ID to `QuestId` type in `src/types/game.ts`
2. [ ] Add definition to `QUEST_DEFINITIONS` in `src/data/quests.ts`
3. [ ] Create/import quest icon asset (and upgrade icon if applicable)
4. [ ] Add progress tracking at the appropriate event location
5. [ ] If quest can reset (streak-based), use `resetQuestProgress()` on failure
6. [ ] Create a card that grants the quest (definition, catalog config, effect handler)
7. [ ] Test the full flow: grant -> progress -> complete -> claim
