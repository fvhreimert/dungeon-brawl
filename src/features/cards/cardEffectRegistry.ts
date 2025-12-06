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
}

export type CardEffectEvent = keyof CardEventPayloads

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
}

type CardEffectHandler<Event extends CardEffectEvent> = (
  context: CardEffectContext &
    { card: CardInstance } &
    CardEventPayloads[Event],
) => void

interface CardEffectDefinition {
  passivePointsPerTurn?: number
  handlers?: Partial<{ [E in CardEffectEvent]: CardEffectHandler<E> }>
}

const CARD_EFFECTS: Record<string, CardEffectDefinition> = {
  niffler: {
    passivePointsPerTurn: 25,
    handlers: {
      turnStart: ({ ownerPlayerIndex, applyScoreChange, updateCardState, card }) => {
        applyScoreChange(ownerPlayerIndex, 25, 'passiveItem')
        updateCardState(ownerPlayerIndex, card.instanceId, (prevState) => ({
          ...prevState,
          totalGained:
            (typeof prevState.totalGained === 'number' ? prevState.totalGained : 0) + 25,
        }))
      },
    },
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
}

export function getCardEffectDefinition(cardId: string) {
  return CARD_EFFECTS[cardId]
}

export function getPassivePointsForCard(cardId: string): number {
  return CARD_EFFECTS[cardId]?.passivePointsPerTurn ?? 0
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
    handler(handlerContext)
  }
}
