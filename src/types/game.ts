export type TileStatus = 'open' | 'done'

export type QAItem = {
  category: string
  value: number
  question: string
  answer: string
}

export type Tile = QAItem & {
  id: string
  status: TileStatus
  multiplier?: number
}

export type Player = {
  name: string
  score: number
}

export type GameStateSnapshot = {
  tiles: Tile[]
  players: Player[]
  activePlayerIndex: number
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
