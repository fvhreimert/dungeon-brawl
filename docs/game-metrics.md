# Game Metrics & Post-Game Statistics

This document describes the game metrics tracking system and post-game statistics dashboard.

## Overview

The game tracks comprehensive statistics throughout gameplay, which are displayed in a post-game dashboard when all questions have been answered. Players can view detailed performance metrics, score progression over time, and compare their gameplay across multiple dimensions.

## Core Types

All metric types are defined in `src/types/game.ts`:

### PlayerMetrics

Tracks per-player statistics throughout the game:

```typescript
type PlayerMetrics = {
  // Question performance
  questionsAnswered: number
  questionsCorrect: number
  questionsWrong: number
  questionsPassed: number
  totalQuestionPointsGained: number
  totalQuestionPointsLost: number

  // Combat/damage stats
  damageTaken: number      // Points lost to cards/effects (not questions)
  damageDealt: number      // Points taken from other players via cards

  // Card usage
  cardsUsed: number
  cardsReceived: number
  actionsUsed: ActionUsageStats  // Tracks usage of each action type

  // Gameplay stats
  isopodsFed: number
  sheepFed: number
  alliancesFormed: number
  timesPuppeteered: number
  tilesFrozen: number
  treasureSetsCompleted: number
  goldenIdolPointsGained: number
  passiveIncomeGained: number

  // Records
  highestSingleGain: number
  biggestLoss: number
}
```

### TurnSnapshot

Captures the game state at each turn for the score progression chart:

```typescript
type TurnSnapshot = {
  turnNumber: number
  activePlayerIndex: number
  playerScores: number[]  // Score for each player at end of turn
  timestamp: number
}
```

### CardUsageEntry

Records individual card plays for detailed analysis:

```typescript
type CardUsageEntry = {
  turnNumber: number
  playerIndex: number
  cardId: string
  cardName: string
  targetPlayerIndex?: number
  timestamp: number
}
```

### GameMetrics

The top-level container for all game statistics:

```typescript
type GameMetrics = {
  turnSnapshots: TurnSnapshot[]
  cardUsage: CardUsageEntry[]
  playerMetrics: PlayerMetrics[]
  gameStartTime: number
  totalTurns: number
}
```

## Tracking Implementation

Metrics are tracked in `src/hooks/useJeopardyGame.ts` through several helper functions:

### incrementPlayerMetric

Increments a numeric field in a player's metrics:

```typescript
incrementPlayerMetric(playerIndex: number, field: keyof PlayerMetrics, amount?: number)
```

### recordCardUsage

Records when a player uses a card:

```typescript
recordCardUsage(playerIndex: number, card: CardInstance, targetPlayerIndex?: number)
```

### recordTurnSnapshot

Captures the current game state at the end of each turn:

```typescript
recordTurnSnapshot()
```

### recordActionUsage

Tracks usage of board actions (Mad Seer, Card Jester, etc.):

```typescript
recordActionUsage(playerIndex: number, actionId: ActionId)
```

### recordPointChange

Updates highest gain/biggest loss records:

```typescript
recordPointChange(playerIndex: number, amount: number)
```

## Post-Game UI Components

### GameOverScreen

Located at `src/components/game/GameOverScreen.tsx`

Displays when all tiles are completed:
- Winner announcement with name and score
- Final standings leaderboard
- Buttons to view detailed statistics or play again

The screen appears as an overlay on top of the game board with a darkened background.

### StatsScreen

Located at `src/components/game/StatsScreen.tsx`

Comprehensive statistics dashboard featuring:

#### Game Overview Section
- Total turns played
- Game duration
- Total cards played

#### Score Progression Chart
- Line chart showing each player's score over time
- Custom legend with player portraits, color indicators, and names
- Tooltips showing exact scores at each turn
- Uses Recharts library with ResponsiveContainer for responsive sizing

#### Player Statistics Cards
For each player, displays:
- Portrait and name (color-coded to match chart line)
- Final score
- Question accuracy (correct/answered with percentage)
- Question points gained
- Damage dealt and taken
- Passive income earned
- Cards used
- Isopods and sheep fed
- Golden Idol points
- Alliances formed
- Tiles frozen
- Treasure sets completed
- Highest single gain and biggest loss
- Actions used (with usage counts)

## Chart Legend

The score progression chart features a custom legend with:
- Player portrait (32x32 pixels, pixelated rendering)
- Color indicator square matching the player's line color
- Player name in the same color as their line

This makes it easy to identify which line belongs to which player at a glance.

## Styling

Both screens follow the game's pixel art aesthetic:
- Press Start 2P / VT323 fonts
- Dark gradient backgrounds (#1a1a1a to #141414)
- 3D beveled borders using box-shadows
- Dashed separators
- Color scheme matching the main menu (#b51a2c red, #ffb347 orange/gold)
- Pixelated image rendering for portraits

The StatsScreen uses the same textured background as the main menu for visual consistency.

## Integration Points

### Game.tsx

The main game component handles:
- Detecting game over (all tiles completed)
- Showing/hiding the GameOverScreen and StatsScreen
- Passing player data and metrics to the screens
- Handling navigation between screens

### Metric Recording Locations

Metrics are recorded at various points in the codebase:
- Question answers: `useJeopardyGame.ts` in answer handling
- Card usage: Throughout card effect handlers
- Action usage: In action button click handlers in `Game.tsx`
- Turn snapshots: At the end of each turn transition

## Dependencies

- **recharts**: Used for the score progression line chart
  - ResponsiveContainer for responsive sizing
  - LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip
