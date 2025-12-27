import type { QuestId, Quest, QuestReward } from '@/types/game'
import bloodSacrificeIcon from '@/assets/images/actions/blood_sacrifice.png'
import madSeerIcon from '@/assets/images/actions/mad_seer.png'

export interface QuestDefinition {
  id: QuestId
  title: string
  description: string
  target: number
  reward: QuestReward
  iconPath: string
}

export const QUEST_DEFINITIONS: Record<QuestId, QuestDefinition> = {
  blood_quest: {
    id: 'blood_quest',
    title: 'Blood Quest',
    description: 'Sacrifice 300 HP total using blood sacrifice.',
    target: 300,
    reward: {
      type: 'cards',
      amount: 3,
      description: '3 Free Cards',
    },
    iconPath: bloodSacrificeIcon,
  },
  seer_quest: {
    id: 'seer_quest',
    title: 'Seer Quest',
    description: 'Use Mad Seer 5 times.',
    target: 5,
    reward: {
      type: 'points',
      amount: 125,
      description: '125 Gold',
    },
    iconPath: madSeerIcon,
  },
}

export function getQuestDefinition(questId: QuestId): QuestDefinition | undefined {
  return QUEST_DEFINITIONS[questId]
}

export function createQuestInstance(questId: QuestId, sourceCardInstanceId: string): Quest {
  const def = QUEST_DEFINITIONS[questId]
  if (!def) {
    throw new Error(`Unknown quest: ${questId}`)
  }

  const uid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `quest-${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    id: `${questId}-${uid}`,
    questId,
    title: def.title,
    description: def.description,
    progress: { current: 0, target: def.target },
    status: 'active',
    reward: def.reward,
    sourceCardInstanceId,
  }
}
