import type { CardDefinition } from '@/data/cards'

export type TileStatus = 'open' | 'done'

export type QAItem = {
  category: string
  value: number
  question: string
  answer: string
}

export type TileModifiers = {
  isCrumbled?: boolean
  // Add more trackers here as needed (e.g., isFrozen, isPoisoned)
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

export type GameStateSnapshot = {
  tiles: Tile[]
  players: Player[]
  activePlayerIndex: number
  puppetLocks: Record<number, PuppetLock>
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
