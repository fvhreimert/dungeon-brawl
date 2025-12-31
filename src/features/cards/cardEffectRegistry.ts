import type { Player, PlayerStats, ScoreChangeReason, CardInstance, PuppetLock, QuestId } from '@/types/game'
import type { CardDefinition } from '@/data/cards'
import { buildCardDrawContext, pickCardForPlayer } from '@/config/cardCatalog'
import { QUEST_DEFINITIONS } from '@/data/quests'

const ALL_QUEST_IDS = Object.keys(QUEST_DEFINITIONS) as QuestId[]
const pickRandomQuest = (): QuestId => {
  const randomIndex = Math.floor(Math.random() * ALL_QUEST_IDS.length)
  return ALL_QUEST_IDS[randomIndex]
}

export type CardEventPayloads = {
  turnStart: Record<string, never>
  damageTaken: {
    damage: number
    reason: ScoreChangeReason
  }
  activated: {
    targetIndex: number
    metadata?: Record<string, unknown>
  }
  turnAdvanced: Record<string, never>
}

export type CardEffectEvent = keyof CardEventPayloads

const calculateTickPenalty = (score: number) => Math.max(1, Math.floor(Math.abs(score) * 0.01))
const calculateMoneyGlitchGain = (score: number) => Math.max(1, Math.floor(Math.abs(score) * 0.01))
const hasCursedCoinTurns = (card: CardInstance) =>
  typeof card.state?.turnsRemaining === 'number' ? card.state.turnsRemaining : 0
const calculateShellDamage = (score: number) => {
  const baseDamage = Math.floor(Math.abs(score) * 0.2)
  return baseDamage > 0 ? baseDamage : 1
}
const getLeaderIndex = (players: Player[]) => {
  let leaderIndex: number | null = null
  let leaderScore = Number.NEGATIVE_INFINITY
  players.forEach((player, index) => {
    if (player.score > leaderScore) {
      leaderScore = player.score
      leaderIndex = index
    }
  })
  return leaderIndex
}
const buildMerchantOffers = (
  players: Player[],
  ownerPlayerIndex: number,
  cardWeights?: Record<string, number>,
  count = 4
) => {
  const context = buildCardDrawContext(players, ownerPlayerIndex)
  const choices: CardDefinition[] = []
  for (let i = 0; i < count; i += 1) {
    const entry = pickCardForPlayer(context, cardWeights)
    if (!entry) continue
    choices.push(entry.definition)
  }
  return choices
}

export type CardEffectContext = {
  players: Player[]
  ownerPlayerIndex: number
  activePlayerIndex: number
  cardWeights?: Record<string, number>
  applyScoreChange: (
    targetIndex: number,
    delta: number,
    reason?: ScoreChangeReason,
  ) => void
  updatePlayerStats: (
    targetIndex: number,
    updater: (stats: PlayerStats) => PlayerStats,
  ) => void
  updateCardState: (
    playerIndex: number,
    cardInstanceId: string,
    updater: (state: Record<string, unknown>) => Record<string, unknown>,
  ) => void
  transferCardBetweenPlayers: (
    fromIndex: number,
    toIndex: number,
    cardInstanceId: string,
  ) => CardInstance | null
  removeCardFromInventory: (playerIndex: number, cardInstanceId: string) => CardInstance | null
  setPuppetLockForPlayer: (playerIndex: number, lock: PuppetLock | null) => void
}

type CardEffectHandler<Event extends CardEffectEvent> = (
  context: CardEffectContext &
    { card: CardInstance } &
    CardEventPayloads[Event],
) => unknown

interface CardEffectDefinition {
  handlers?: Partial<{ [E in CardEffectEvent]: CardEffectHandler<E> }>
  getPassiveDelta?: (context: {
    card: CardInstance
    playerScore: number
    player: Player
    players: Player[]
  }) => number
}

const CARD_EFFECTS: Record<string, CardEffectDefinition> = {
  niffler: {
    handlers: {
      turnAdvanced: ({ ownerPlayerIndex, applyScoreChange, updateCardState, card }) => {
        applyScoreChange(ownerPlayerIndex, 25, 'passiveItem')
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          totalGained:
            (typeof prevState.totalGained === 'number' ? prevState.totalGained : 0) + 25,
        }))
      },
    },
    getPassiveDelta: () => 25,
  },
  soul_burst: {
    handlers: {
      damageTaken: ({ ownerPlayerIndex, damage, card, updateCardState }) => {
        const stored = Math.floor(damage * 0.25)
        if (stored <= 0) return
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          storedDamage: (typeof prevState.storedDamage === 'number' ? prevState.storedDamage : 0) + stored,
        }))
      },
      activated: ({ ownerPlayerIndex, targetIndex, card, applyScoreChange, updateCardState }) => {
        const stored = typeof card.state?.storedDamage === 'number' ? card.state.storedDamage : 0
        if (stored <= 0) return
        applyScoreChange(targetIndex, -stored, 'activeCard')
        applyScoreChange(ownerPlayerIndex, stored, 'activeCard')
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          storedDamage: 0,
        }))
      },
    },
  },
  cursed_coin: {
    handlers: {
      turnAdvanced: ({
        ownerPlayerIndex,
        card,
        applyScoreChange,
        updateCardState,
        removeCardFromInventory,
      }) => {
        const remaining = typeof card.state?.turnsRemaining === 'number' ? card.state.turnsRemaining : 0
        if (remaining <= 0) return
        const nextRemaining = remaining - 1
        applyScoreChange(ownerPlayerIndex, -50, 'passiveItem')
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          turnsRemaining: nextRemaining,
        }))
        if (nextRemaining <= 0) {
          removeCardFromInventory(ownerPlayerIndex, card.instanceId)
        }
      },
    },
    getPassiveDelta: ({ card }) => (hasCursedCoinTurns(card) > 0 ? -50 : 0),
  },
  tick: {
    handlers: {
      turnAdvanced: ({
        ownerPlayerIndex,
        players,
        card,
        applyScoreChange,
        updateCardState,
      }) => {
        const player = players[ownerPlayerIndex]
        if (!player) return
        const penalty = calculateTickPenalty(player.score)
        applyScoreChange(ownerPlayerIndex, -penalty, 'passiveItem')
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          lastPenalty: penalty,
        }))
      },
    },
    getPassiveDelta: ({ playerScore }) => -calculateTickPenalty(playerScore),
  },
  thieving_rat: {
    handlers: {
      activated: ({
        players,
        ownerPlayerIndex,
        targetIndex,
        transferCardBetweenPlayers,
      }) => {
        if (targetIndex === ownerPlayerIndex) return
        const targetPlayer = players[targetIndex]
        if (!targetPlayer || targetPlayer.inventory.length === 0) return
        const randomIndex = Math.floor(Math.random() * targetPlayer.inventory.length)
        const candidate = targetPlayer.inventory[randomIndex]
        const movedCard = transferCardBetweenPlayers(
          targetIndex,
          ownerPlayerIndex,
          candidate.instanceId,
        )
        if (!movedCard) return
        return {
          stolenCard: movedCard,
          stolenFromIndex: targetIndex,
        }
      },
    },
  },
  spiny_shell: {
    handlers: {
      activated: ({ players, applyScoreChange }) => {
        const leaderIndex = getLeaderIndex(players)
        if (leaderIndex === null) return
        const leader = players[leaderIndex]
        if (!leader) return
        const damage = calculateShellDamage(leader.score)
        applyScoreChange(leaderIndex, -damage, 'activeCard')
      },
    },
  },
  traveling_merchant: {
    handlers: {
      activated: ({ players, ownerPlayerIndex, cardWeights }) => {
        const offers = buildMerchantOffers(players, ownerPlayerIndex, cardWeights)
        if (offers.length === 0) return
        return {
          merchantOffers: offers,
        }
      },
    },
  },
  puppet_master: {
    handlers: {
      activated: ({
        targetIndex,
        ownerPlayerIndex,
        card,
        updatePlayerStats,
        metadata,
        setPuppetLockForPlayer,
      }) => {
        const category =
          typeof metadata?.category === 'string' ? metadata.category : null
        if (!category) return
        setPuppetLockForPlayer(targetIndex, {
          category,
          sourceCardId: card.id,
          sourceCardInstanceId: card.instanceId,
          casterIndex: ownerPlayerIndex,
          targetIndex,
        })
        updatePlayerStats(targetIndex, (stats) => ({
          ...stats,
          isPuppeteered: true,
          puppetLock: {
            category,
            sourceCardId: card.id,
            sourceCardInstanceId: card.instanceId,
            casterIndex: ownerPlayerIndex,
            targetIndex,
          },
        }))
      },
    },
  },
  beggar: {
    handlers: {
      turnAdvanced: ({
        ownerPlayerIndex,
        players,
        applyScoreChange,
        updateCardState,
        card,
      }) => {
        const otherPlayerCount = players.length - 1
        if (otherPlayerCount <= 0) return
        // Take 10 points from each other player
        players.forEach((_, playerIndex) => {
          if (playerIndex === ownerPlayerIndex) return
          applyScoreChange(playerIndex, -10, 'passiveItem')
        })
        // Give the owner 10 points per other player
        const totalGained = otherPlayerCount * 10
        applyScoreChange(ownerPlayerIndex, totalGained, 'passiveItem')
        // Track total stolen
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          totalStolen:
            (typeof prevState.totalStolen === 'number' ? prevState.totalStolen : 0) +
            totalGained,
        }))
      },
    },
    getPassiveDelta: ({ player, players }) => {
      // Find the owner's index by matching the player reference
      const ownerIndex = players.findIndex((p) => p === player)
      const otherPlayerCount = players.length - 1
      if (otherPlayerCount <= 0) return 0
      // Owner gains 10 per other player
      if (ownerIndex >= 0) {
        return otherPlayerCount * 10
      }
      return 0
    },
  },
  roulette: {
    handlers: {
      activated: ({ ownerPlayerIndex, players, metadata, applyScoreChange }) => {
        const won = metadata?.won === true
        const amount = typeof metadata?.amount === 'number' ? metadata.amount : 0
        if (amount <= 0) return
        
        const player = players[ownerPlayerIndex]
        if (!player) return
        
        if (won) {
          // Player wins: gain the staked amount (they keep their stake + win same amount)
          applyScoreChange(ownerPlayerIndex, amount, 'activeCard')
        } else {
          // Player loses: lose the staked amount
          applyScoreChange(ownerPlayerIndex, -amount, 'activeCard')
        }
        
        return { rouletteResult: { won, amount } }
      },
    },
  },
  shovel: {
    handlers: {
      activated: () => ({ openTreasureSet: true }),
    },
  },
  compass: {
    handlers: {
      activated: () => ({ openTreasureSet: true }),
    },
  },
  treasure_map: {
    handlers: {
      activated: () => ({ openTreasureSet: true }),
    },
  },
  glacial_elemental: {
    handlers: {
      activated: ({ metadata }) => {
        const tileId = typeof metadata?.tileId === 'string' ? metadata.tileId : null
        if (!tileId) return
        return { freezeTileId: tileId }
      },
    },
  },
  coalition: {
    handlers: {
      activated: ({ ownerPlayerIndex, targetIndex, card }) => {
        return {
          createAlliance: {
            initiatorIndex: ownerPlayerIndex,
            targetIndex,
            cardInstanceId: card.instanceId,
          },
        }
      },
    },
  },
  loot_goblin: {
    handlers: {
      activated: ({ ownerPlayerIndex, targetIndex, applyScoreChange }) => {
        applyScoreChange(targetIndex, -200, 'activeCard')
        applyScoreChange(ownerPlayerIndex, 200, 'activeCard')
        return { playSound: 'loot_goblin' }
      },
    },
  },
  martin: {
    handlers: {
      activated: ({ ownerPlayerIndex, card }) => {
        return {
          grantQuest: {
            playerIndex: ownerPlayerIndex,
            questId: pickRandomQuest(),
            sourceCardInstanceId: card.instanceId,
          },
        }
      },
    },
  },
  infinite_money_glitch: {
    handlers: {
      turnAdvanced: ({
        ownerPlayerIndex,
        players,
        card,
        applyScoreChange,
        updateCardState,
      }) => {
        const player = players[ownerPlayerIndex]
        if (!player) return
        const gain = calculateMoneyGlitchGain(player.score)
        applyScoreChange(ownerPlayerIndex, gain, 'passiveItem')
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          totalGained:
            (typeof prevState.totalGained === 'number' ? prevState.totalGained : 0) + gain,
        }))
      },
    },
    getPassiveDelta: ({ playerScore }) => calculateMoneyGlitchGain(playerScore),
  },
  price_cracker: {
    handlers: {
      activated: ({ ownerPlayerIndex, metadata, applyScoreChange }) => {
        // Modal handles the prize generation and winner determination
        // This handler is called after modal confirms with prizes
        const winnerIndex = typeof metadata?.winnerIndex === 'number' ? metadata.winnerIndex : ownerPlayerIndex
        const points = typeof metadata?.points === 'number' ? metadata.points : 0
        const cards = typeof metadata?.cards === 'number' ? metadata.cards : 0

        if (points > 0) {
          applyScoreChange(winnerIndex, points, 'activeCard')
        }

        return {
          priceCrackerResult: {
            winnerIndex,
            points,
            cards,
          },
        }
      },
    },
  },
}

export function getCardEffectDefinition(cardId: string) {
  return CARD_EFFECTS[cardId]
}

export function runCardEffect<Event extends CardEffectEvent>(
  event: Event,
  card: CardInstance,
  context: CardEffectContext,
  payload: CardEventPayloads[Event],
 ) {
  const handler = CARD_EFFECTS[card.id]?.handlers?.[event] as
    | CardEffectHandler<Event>
    | undefined
  if (handler) {
    const handlerContext = {
      ...context,
      card,
      ...payload,
    } as unknown as CardEffectContext & { card: CardInstance } & CardEventPayloads[Event]
    return handler(handlerContext)
  }
  return undefined
}

// Calculate passive delta from a player's own cards
function calculateOwnPassiveDelta(player: Player, players: Player[]) {
  return player.inventory.reduce((sum, card) => {
    const effect = CARD_EFFECTS[card.id]
    if (!effect?.getPassiveDelta) return sum
    return sum + effect.getPassiveDelta({ card, playerScore: player.score, player, players })
  }, 0)
}

// Calculate incoming passive effects from OTHER players' cards (e.g., Beggar stealing from you)
function calculateIncomingPassiveDelta(player: Player, players: Player[]) {
  const playerIndex = players.indexOf(player)
  if (playerIndex === -1) return 0

  let incomingDelta = 0

  // Check each other player's inventory for cards that affect this player
  players.forEach((otherPlayer, otherIndex) => {
    if (otherIndex === playerIndex) return

    otherPlayer.inventory.forEach((card) => {
      // Beggar steals 10 from each opponent
      if (card.id === 'beggar') {
        incomingDelta -= 10
      }
    })
  })

  return incomingDelta
}

export function calculatePassiveDeltaForPlayer(player: Player, players: Player[]) {
  const ownDelta = calculateOwnPassiveDelta(player, players)
  const incomingDelta = calculateIncomingPassiveDelta(player, players)
  return ownDelta + incomingDelta
}
