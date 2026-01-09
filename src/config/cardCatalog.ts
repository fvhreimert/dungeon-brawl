import type { Player } from '@/types/game'
import { CARDS, type CardDefinition } from '@/data/cards'

export type CardWeightModifier = (context: CardDrawContext) => number
export type CardDrawFilter = (context: CardDrawContext) => boolean

export type TargetSelectMode = 'neutral' | 'standard' | 'fel' | 'none' | 'puppet' | 'roulette' | 'treasure' | 'freeze' | 'coalition' | 'neutral_all' | 'price_cracker'

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
  treasureSetBonus?: number
}

const CARD_CONFIG: Record<string, CardCatalogConfig> = {
  niffler: { baseWeight: 50 },
  soul_burst: { baseWeight: 30, targetSelectMode: 'fel' },
  thieving_rat: { baseWeight: 70, targetSelectMode: 'neutral' },
  cursed_coin: { baseWeight: 60 },
  tick: { baseWeight: 10 },
  spiny_shell: { baseWeight: 10, targetSelectMode: 'none' },
  traveling_merchant: { baseWeight: 80, targetSelectMode: 'none' },
  sheep: { baseWeight: 60 },
  puppet_master: { baseWeight: 30, targetSelectMode: 'puppet' },
  beggar: { baseWeight: 30 },
  roulette: { baseWeight: 50, targetSelectMode: 'roulette' },
  shovel: {
    baseWeight: 20,
    targetSelectMode: 'treasure',
    weightModifiers: [
      (context) => {
        // If already have all 3, no bonus
        const hasAll = context.inventoryIds.has('shovel') &&
                       context.inventoryIds.has('compass') &&
                       context.inventoryIds.has('treasure_map')
        if (hasAll) return 0

        const bonus = context.treasureSetBonus ?? 40
        let total = 0
        if (context.inventoryIds.has('compass')) total += bonus
        if (context.inventoryIds.has('treasure_map')) total += bonus
        return total
      }
    ]
  },
  compass: {
    baseWeight: 20,
    targetSelectMode: 'treasure',
    weightModifiers: [
      (context) => {
        // If already have all 3, no bonus
        const hasAll = context.inventoryIds.has('shovel') &&
                       context.inventoryIds.has('compass') &&
                       context.inventoryIds.has('treasure_map')
        if (hasAll) return 0

        const bonus = context.treasureSetBonus ?? 40
        let total = 0
        if (context.inventoryIds.has('shovel')) total += bonus
        if (context.inventoryIds.has('treasure_map')) total += bonus
        return total
      }
    ]
  },
  treasure_map: {
    baseWeight: 20,
    targetSelectMode: 'treasure',
    weightModifiers: [
      (context) => {
        // If already have all 3, no bonus
        const hasAll = context.inventoryIds.has('shovel') &&
                       context.inventoryIds.has('compass') &&
                       context.inventoryIds.has('treasure_map')
        if (hasAll) return 0

        const bonus = context.treasureSetBonus ?? 40
        let total = 0
        if (context.inventoryIds.has('shovel')) total += bonus
        if (context.inventoryIds.has('compass')) total += bonus
        return total
      }
    ]
  },
  glacial_elemental: { baseWeight: 40, targetSelectMode: 'freeze' },
  coalition: { baseWeight: 30, targetSelectMode: 'coalition' },
  loot_goblin: { baseWeight: 70, targetSelectMode: 'neutral_all' },
  isopod: { baseWeight: 100 },
  martin: { baseWeight: 50, targetSelectMode: 'none' },
  infinite_money_glitch: { baseWeight: 30 },
  price_cracker: { baseWeight: 40, targetSelectMode: 'price_cracker' },
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

export function buildCardDrawContext(
  players: readonly Player[],
  activePlayerIndex: number,
  options?: { treasureSetBonus?: number }
): CardDrawContext {
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
    treasureSetBonus: options?.treasureSetBonus,
  }
}

export function pickCardForPlayer(
  context: CardDrawContext,
  cardWeights?: Record<string, number>
): CardCatalogEntry | null {
  const weightedPool = CARD_CATALOG.reduce<
    { entry: CardCatalogEntry; weight: number }[]
  >((acc, entry) => {
    if (!entry.drawFilter(context)) return acc
    const modifierTotal = entry.weightModifiers.reduce(
      (total, modifier) => total + modifier(context),
      0,
    )
    // Use custom weight if provided, otherwise use default base weight
    const baseWeight = cardWeights?.[entry.definition.id] ?? entry.baseWeight
    const weight = Math.max(baseWeight + modifierTotal, 0)
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
