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

export type PlayerConfig = {
  name: string
  score: number
  inventory: CardInstance[]
  portrait?: string
}

export type Player = PlayerConfig & {
  stats: PlayerStats
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

export type Alliances = Alliance[]

export type GameStateSnapshot = {
  tiles: Tile[]
  players: Player[]
  activePlayerIndex: number
  puppetLocks: Record<number, PuppetLock>
  frozenActions?: FrozenActions
  alliances?: Alliances
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
