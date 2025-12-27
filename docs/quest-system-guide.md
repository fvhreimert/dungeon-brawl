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
}
```

### Adding a New Quest Definition

1. Import any required assets (icons):
```typescript
import myQuestIcon from '@/assets/images/actions/my_quest_icon.png'
```

2. Add your quest to `QUEST_DEFINITIONS`:
```typescript
export const QUEST_DEFINITIONS: Record<QuestId, QuestDefinition> = {
  blood_quest: { /* existing */ },
  my_new_quest: {
    id: 'my_new_quest',
    title: 'My New Quest',
    description: 'Do something interesting 50 times.',
    target: 50,
    reward: { type: 'cards', amount: 2, description: '2 Free Cards' },
    iconPath: myQuestIcon,
  },
}
```

### Reward Types
- `{ type: 'cards', amount: N, description: string }` - Awards N random cards
- `{ type: 'points', amount: N, description: string }` - Awards N points (not yet implemented)

## 2. Quest Types

Quest types are defined in `src/types/game.ts`:

```typescript
export type QuestId = 'blood_quest' | 'my_new_quest'  // Add new IDs here
export type QuestStatus = 'active' | 'completed'
export type QuestReward = { type: 'cards' | 'points'; amount: number; description: string }
export type QuestProgress = { current: number; target: number }

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

## 3. Quest Instance Creation

Quests are created via the factory function in `src/data/quests.ts`:

```typescript
const quest = createQuestInstance('blood_quest', card.instanceId)
```

This creates a new quest instance with:
- A unique `id` (generated UUID)
- Progress initialized to `{ current: 0, target: definition.target }`
- Status set to `'active'`

## 4. Granting Quests via Cards

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

## 5. Tracking Quest Progress

Progress tracking happens in `useJeopardyGame.ts`. Find the appropriate action or event and call `updateQuestProgress`:

### Example: Blood Quest tracks HP sacrificed

In `performBloodSacrifice()`:
```typescript
// After applying the sacrifice...
const player = playersRef.current[activePlayerIndex]
const bloodQuest = player?.quests?.find(
  (q) => q.questId === 'blood_quest' && q.status === 'active'
)
if (bloodQuest) {
  updateQuestProgress(activePlayerIndex, 'blood_quest', amount)
}
```

### Progress Update Function

```typescript
const updateQuestProgress = useCallback(
  (playerIndex: number, questId: QuestId, delta: number) => {
    setPlayers((prev) =>
      prev.map((p, i) => {
        if (i !== playerIndex) return p
        const updatedQuests = (p.quests ?? []).map((q) => {
          if (q.questId !== questId || q.status !== 'active') return q
          const newCurrent = Math.min(q.progress.current + delta, q.progress.target)
          const newStatus = newCurrent >= q.progress.target ? 'completed' : 'active'
          return { ...q, progress: { ...q.progress, current: newCurrent }, status: newStatus }
        })
        return { ...p, quests: updatedQuests }
      })
    )
  },
  []
)
```

## 6. Quest UI Components

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
- Quest icon display (large, no frame)
- Progress bar with 300 ticks for granular tracking
- "Claim Reward" button when quest is completed

## 7. Claiming Rewards

When a player claims a quest reward:

1. Player clicks "Claim Reward" in QuestModal
2. `handleClaimQuestReward()` in `Game.tsx` is called
3. This calls `claimQuestReward(playerIndex, questId)` from the hook
4. The function:
   - Finds and removes the completed quest
   - Awards the reward (draws cards for `type: 'cards'`)
   - Returns the awarded cards (or null)
5. `Game.tsx` shows the cards via `CardRevealModal`

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

## 8. Integration Points

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

## 9. Styling

Quest UI uses pixel-art styling consistent with the game:
- `QuestIndicator.css`: Indicator positioning, exclamation mark styling, glow animations
- `QuestModal.css`: Scroll-themed modal, progress bar ticks, reward section

Key CSS classes:
- `.quest-modal-backdrop`: Modal overlay
- `.quest-modal`: Main modal container with drop-shadow
- `.scroll-rod`, `.scroll-body`: Scroll decoration elements
- `.quest-progress-bar`, `.quest-progress-tick`: 300-tick progress bar

## 10. Adding a Complete New Quest

Checklist:
1. [ ] Add quest ID to `QuestId` type in `src/types/game.ts`
2. [ ] Add definition to `QUEST_DEFINITIONS` in `src/data/quests.ts`
3. [ ] Create/import quest icon asset
4. [ ] Add progress tracking in `useJeopardyGame.ts` at the appropriate event
5. [ ] Create a card that grants the quest (definition, catalog config, effect handler)
6. [ ] Test the full flow: grant -> progress -> complete -> claim
