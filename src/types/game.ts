import type { CardDefinition } from '@/data/cards'

export type TileStatus = 'open' | 'done'

export type QAItem = {
  category: string
  value: number
  question: string
  answer: string
}

export type FrozenTileInfo = {
  frozenByPlayerIndex: number
  frozenByCardInstanceId: string
}

export type TileModifiers = {
  isCrumbled?: boolean
  frozen?: FrozenTileInfo
}

export type Tile = QAItem & {
  id: string
  status: TileStatus
  multiplier?: number
  modifiers?: TileModifiers
}

export type CardInstance = CardDefinition & {
  instanceId: string
  state?: Record<string, unknown>
}

export type TurnTotals = {
  total: number
  thisTurn: number
}

export type PlayerStats = {
  passivePointsGained: TurnTotals
  pointsLostToQuestions: TurnTotals
  pointsLostToActiveCards: TurnTotals
  pointsLostToPassiveItems: TurnTotals
  isSilenced: boolean
  isPuppeteered: boolean
  puppetLock?: PuppetLock | null
}

export type UpgradeableAction = 'mad_seer' | 'card_jester' | 'blood_sacrifice' | 'frog_of_fate' | 'golden_idol'

export type PlayerUpgrades = Partial<Record<UpgradeableAction, boolean>>

export type PlayerActionCounts = Partial<Record<ActionId, number>>

export type PlayerConfig = {
  name: string
  score: number
  inventory: CardInstance[]
  portrait?: string
  spiderSenseLevel?: number
  upgradedActions?: PlayerUpgrades
  actionCounts?: PlayerActionCounts
  rerollsRemaining?: number
}

export type Player = PlayerConfig & {
  stats: PlayerStats
  quests?: Quest[]
}

export type ScoreChangeReason = 'question' | 'activeCard' | 'passiveItem' | 'other'

export type PuppetLock = {
  category: string
  sourceCardId: string
  sourceCardInstanceId: string
  casterIndex: number
  targetIndex: number
}

export type ActionId = 'card_jester' | 'mad_seer' | 'blood_sacrifice' | 'frog_of_fate' | 'golden_idol' | 'web'

export type FrozenActionInfo = {
  frozenByPlayerIndex: number
  frozenByCardInstanceId: string
}

export type FrozenActions = Partial<Record<ActionId, FrozenActionInfo>>

export type AllianceColor = 'red' | 'yellow' | 'green' | 'blue'

export type Alliance = {
  id: string
  color: AllianceColor
  playerIndices: number[]
  turnsRemaining: number
  sourceCardInstanceId: string
}

// Quest System Types
export type QuestId = 'blood_quest' | 'seer_quest' | 'jester_quest' | 'frog_quest' | 'idol_quest' | 'glacial_quest' | 'wisdom_quest' | 'spider_quest'

export type QuestStatus = 'active' | 'completed'

export type QuestReward = {
  type: 'cards' | 'points'
  amount: number
  description: string
  upgradeAction?: UpgradeableAction
  bonusPoints?: number
  bonusCards?: number
  specificCardId?: string
}

export type QuestProgress = {
  current: number
  target: number
}

export type Quest = {
  id: string
  questId: QuestId
  title: string
  description: string
  progress: QuestProgress
  status: QuestStatus
  reward: QuestReward
  sourceCardInstanceId: string
}

export type Alliances = Alliance[]

export type GameStateSnapshot = {
  tiles: Tile[]
  players: Player[]
  activePlayerIndex: number
  puppetLocks: Record<number, PuppetLock>
  frozenActions?: FrozenActions
  alliances?: Alliances
  goldenIdolBonus?: number
}

export type GameStatEntry = {
  turnNumber: number
  playerId: string // Name as ID for now since unique
  playerName: string
  tileId: string
  tileValue: number
  result: 'correct' | 'wrong' | 'pass'
  scoreChange: number
  timestamp: number
}

// Comprehensive game metrics tracking for endgame scoreboard
export type CardUsageEntry = {
  turnNumber: number
  playerIndex: number
  cardId: string
  cardName: string
  targetPlayerIndex?: number
  timestamp: number
}

export type TurnSnapshot = {
  turnNumber: number
  activePlayerIndex: number
  playerScores: number[] // Score for each player at end of turn
  timestamp: number
}

export type ActionUsageStats = Partial<Record<ActionId, number>>

export type PlayerMetrics = {
  // Question stats
  questionsAnswered: number
  questionsCorrect: number
  questionsWrong: number
  questionsPassed: number
  totalQuestionPointsGained: number
  totalQuestionPointsLost: number
  // Damage stats (non-question)
  damageTaken: number // Points lost to cards/effects (not questions)
  damageDealt: number // Points taken from other players via cards
  // Card stats
  cardsUsed: number
  cardsReceived: number
  // Action stats
  actionsUsed: ActionUsageStats
  // Spider/feeding stats
  isopodsFed: number
  sheepFed: number
  // Misc gameplay stats
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

export type GameMetrics = {
  turnSnapshots: TurnSnapshot[]
  cardUsage: CardUsageEntry[]
  playerMetrics: PlayerMetrics[]
  gameStartTime: number
  totalTurns: number
}
