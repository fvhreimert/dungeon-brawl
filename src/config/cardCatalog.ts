import type { Player } from '@/types/game'
import { CARDS, type CardDefinition } from '@/data/cards'

export type CardWeightModifier = (context: CardDrawContext) => number
export type CardDrawFilter = (context: CardDrawContext) => boolean

export type TargetSelectMode = 'neutral' | 'standard' | 'fel' | 'none' | 'puppet' | 'roulette' | 'treasure' | 'freeze' | 'coalition' | 'neutral_all'

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
  niffler: { baseWeight: 5 },
  soul_burst: { baseWeight: 3, targetSelectMode: 'fel' },
  thieving_rat: { baseWeight: 7, targetSelectMode: 'neutral' },
  cursed_coin: { baseWeight: 6 },
  tick: { baseWeight: 1},
  spiny_shell: { baseWeight: 1, targetSelectMode: 'none' },
  traveling_merchant: { baseWeight: 8, targetSelectMode: 'none' },
  sheep: { baseWeight: 6},
  puppet_master: { baseWeight: 3, targetSelectMode: 'puppet' },
  beggar: { baseWeight: 3},
  roulette: { baseWeight: 5, targetSelectMode: 'roulette' },
  shovel: {
    baseWeight: 8,
    targetSelectMode: 'treasure',
    weightModifiers: [
      (context) => {
        // If already have all 3, no bonus (card will stay at weight 8)
        const hasAll = context.inventoryIds.has('shovel') &&
                       context.inventoryIds.has('compass') &&
                       context.inventoryIds.has('treasure_map')
        if (hasAll) return 0

        let bonus = 0
        if (context.inventoryIds.has('compass')) bonus += 4
        if (context.inventoryIds.has('treasure_map')) bonus += 4
        return bonus
      }
    ]
  },
  compass: {
    baseWeight: 8,
    targetSelectMode: 'treasure',
    weightModifiers: [
      (context) => {
        // If already have all 3, no bonus (card will stay at weight 8)
        const hasAll = context.inventoryIds.has('shovel') &&
                       context.inventoryIds.has('compass') &&
                       context.inventoryIds.has('treasure_map')
        if (hasAll) return 0

        let bonus = 0
        if (context.inventoryIds.has('shovel')) bonus += 4
        if (context.inventoryIds.has('treasure_map')) bonus += 4
        return bonus
      }
    ]
  },
  treasure_map: {
    baseWeight: 8,
    targetSelectMode: 'treasure',
    weightModifiers: [
      (context) => {
        // If already have all 3, no bonus (card will stay at weight 8)
        const hasAll = context.inventoryIds.has('shovel') &&
                       context.inventoryIds.has('compass') &&
                       context.inventoryIds.has('treasure_map')
        if (hasAll) return 0

        let bonus = 0
        if (context.inventoryIds.has('shovel')) bonus += 4
        if (context.inventoryIds.has('compass')) bonus += 4
        return bonus
      }
    ]
  },
  glacial_elemental: { baseWeight: 4, targetSelectMode: 'freeze' },
  coalition: { baseWeight: 3, targetSelectMode: 'coalition' },
  loot_goblin: { baseWeight: 7, targetSelectMode: 'neutral_all' },
  isopod: { baseWeight: 10 },
  martin: { baseWeight: 4, targetSelectMode: 'none' },
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
