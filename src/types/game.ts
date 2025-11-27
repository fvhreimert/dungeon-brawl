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
}

export type Player = {
  name: string
  score: number
}
