import type { Player } from '@/types/game'
import { CARDS, type CardDefinition } from '@/data/cards'

export type CardWeightModifier = (context: CardDrawContext) => number
export type CardDrawFilter = (context: CardDrawContext) => boolean

export type TargetSelectMode = 'neutral' | 'standard' | 'fel' | 'none' | 'puppet' | 'roulette' | 'treasure' | 'freeze' | 'coalition'

export interface CardCatalogConfig {
  baseWeight?: number
  weightModifiers?: CardWeightModifier[]
  drawFilter?: CardDrawFilter
  targetSelectMode?: TargetSelectMode
}

export interface CardCatalogEntry extends Required<CardCatalogConfig> {
  definition: CardDefinition
}

export type CardDrawContext = {
  players: readonly Player[]
  activePlayerIndex: number
  activePlayer: Player
  opponents: readonly Player[]
  scoreDelta: number
  inventoryIds: Set<string>
}

const CARD_CONFIG: Record<string, CardCatalogConfig> = {
  niffler: { baseWeight: 1 },
  soul_burst: { baseWeight: 1, targetSelectMode: 'fel' },
  thieving_rat: { baseWeight: 1, targetSelectMode: 'neutral' },
  cursed_coin: { baseWeight: 1 },
  tick: { baseWeight: 1 },
  spiny_shell: { baseWeight: 1, targetSelectMode: 'none' },
  traveling_merchant: { baseWeight: 1, targetSelectMode: 'none' },
  puppet_master: { baseWeight: 1, targetSelectMode: 'puppet' },
  beggar: { baseWeight: 1 },
  roulette: { baseWeight: 1, targetSelectMode: 'roulette' },
  shovel: { baseWeight: 1, targetSelectMode: 'treasure' },
  compass: { baseWeight: 1, targetSelectMode: 'treasure' },
  treasure_map: { baseWeight: 1, targetSelectMode: 'treasure' },
  sad_glacial_elemental: { baseWeight: 1, targetSelectMode: 'freeze' },
  coalition: { baseWeight: 1, targetSelectMode: 'coalition' },
}

export const CARD_CATALOG: CardCatalogEntry[] = CARDS.map((definition) => {
  const config = CARD_CONFIG[definition.id] ?? {}
  return {
    definition,
    baseWeight: config.baseWeight ?? 1,
    weightModifiers: config.weightModifiers ?? [],
    drawFilter: config.drawFilter ?? (() => true),
    targetSelectMode: config.targetSelectMode ?? 'standard',
  }
})

export function getCardCatalogEntry(cardId: string): CardCatalogEntry | undefined {
  return CARD_CATALOG.find((entry) => entry.definition.id === cardId)
}

export function buildCardDrawContext(players: readonly Player[], activePlayerIndex: number): CardDrawContext {
  const activePlayer = players[activePlayerIndex]
  const opponents = players.filter((_, index) => index !== activePlayerIndex)
  const opponentAvgScore =
    opponents.reduce((sum, player) => sum + player.score, 0) /
    Math.max(opponents.length, 1)
  const scoreDelta = activePlayer.score - opponentAvgScore
  const inventoryIds = new Set(activePlayer.inventory.map((card) => card.id))

  return {
    players,
    activePlayerIndex,
    activePlayer,
    opponents,
    scoreDelta,
    inventoryIds,
  }
}

export function pickCardForPlayer(context: CardDrawContext): CardCatalogEntry | null {
  const weightedPool = CARD_CATALOG.reduce<
    { entry: CardCatalogEntry; weight: number }[]
  >((acc, entry) => {
    if (!entry.drawFilter(context)) return acc
    const modifierTotal = entry.weightModifiers.reduce(
      (total, modifier) => total + modifier(context),
      0,
    )
    const weight = Math.max(entry.baseWeight + modifierTotal, 0)
    if (weight === 0) return acc
    acc.push({ entry, weight })
    return acc
  }, [])

  if (weightedPool.length === 0) return null

  const totalWeight = weightedPool.reduce((sum, { weight }) => sum + weight, 0)
  const threshold = Math.random() * totalWeight
  let run = 0
  for (const bucket of weightedPool) {
    run += bucket.weight
    if (threshold <= run) {
      return bucket.entry
    }
  }
  return weightedPool[weightedPool.length - 1].entry
}
