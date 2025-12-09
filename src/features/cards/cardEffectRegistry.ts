import type { Player, PlayerStats, ScoreChangeReason, CardInstance } from '@/types/game'

export type CardEventPayloads = {
  turnStart: Record<string, never>
  damageTaken: {
    damage: number
    reason: ScoreChangeReason
  }
  activated: {
    targetIndex: number
  }
  turnAdvanced: Record<string, never>
}

export type CardEffectEvent = keyof CardEventPayloads

const calculateTickPenalty = (score: number) => Math.max(1, Math.floor(Math.abs(score) * 0.01))
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

export type CardEffectContext = {
  players: Player[]
  ownerPlayerIndex: number
  activePlayerIndex: number
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

export function calculatePassiveDeltaForPlayer(player: Player) {
  return player.inventory.reduce((sum, card) => {
    const effect = CARD_EFFECTS[card.id]
    if (!effect?.getPassiveDelta) return sum
    return sum + effect.getPassiveDelta({ card, playerScore: player.score, player })
  }, 0)
}
