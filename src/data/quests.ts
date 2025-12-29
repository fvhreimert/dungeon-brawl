import type { QuestId, Quest, QuestReward } from '@/types/game'
import bloodSacrificeIcon from '@/assets/images/actions/blood_sacrifice.png'
import madSeerIcon from '@/assets/images/actions/mad_seer.png'
import cardJesterIcon from '@/assets/images/actions/card_jester.png'
import frogOfFateIcon from '@/assets/images/actions/frog_of_fate.png'
import goldenIdolIcon from '@/assets/images/actions/golden_idol.png'
import glacialElementalIcon from '@/assets/images/cards/images/glacial_elemental.png'
import spiderIcon from '@/assets/images/ui/spider_sense.png'
import bloodSacrificeUpgraded from '@/assets/images/actions/blood_sacrifice_upgraded.png'
import madSeerUpgraded from '@/assets/images/actions/mad_seer_upraded.png'
import cardJesterUpgraded from '@/assets/images/actions/card_jester_upgraded.png'
import frogOfFateUpgraded from '@/assets/images/actions/frog_of_fate_upgraded.png'
import goldenIdolUpgraded from '@/assets/images/actions/golden_idol_upgraded.png'

export interface QuestDefinition {
  id: QuestId
  title: string
  description: string
  target: number
  reward: QuestReward
  iconPath: string
  upgradeIconPath?: string
}

export const QUEST_DEFINITIONS: Record<QuestId, QuestDefinition> = {
  blood_quest: {
    id: 'blood_quest',
    title: 'Blood Quest',
    description: 'Sacrifice 300 HP total using Blood Sacrifice.',
    target: 300,
    reward: {
      type: 'cards',
      amount: 3,
      description: '3 Free Cards + Blood Sacrifice Upgrade',
      upgradeAction: 'blood_sacrifice',
    },
    iconPath: bloodSacrificeIcon,
    upgradeIconPath: bloodSacrificeUpgraded,
  },
  seer_quest: {
    id: 'seer_quest',
    title: 'Seer Quest',
    description: 'Use Mad Seer 5 times.',
    target: 5,
    reward: {
      type: 'points',
      amount: 125,
      description: '125 Gold + Mad Seer Upgrade',
      upgradeAction: 'mad_seer',
    },
    iconPath: madSeerIcon,
    upgradeIconPath: madSeerUpgraded,
  },
  jester_quest: {
    id: 'jester_quest',
    title: "Jester's Quest",
    description: 'Buy 3 cards from the Card Jester.',
    target: 3,
    reward: {
      type: 'points',
      amount: 200,
      description: '200 Gold + Card Jester Upgrade',
      upgradeAction: 'card_jester',
    },
    iconPath: cardJesterIcon,
    upgradeIconPath: cardJesterUpgraded,
  },
  frog_quest: {
    id: 'frog_quest',
    title: "Frog's Quest",
    description: 'Use Frog of Fate 3 times.',
    target: 3,
    reward: {
      type: 'cards',
      amount: 3,
      description: '3 Free Cards + Frog of Fate Upgrade',
      upgradeAction: 'frog_of_fate',
    },
    iconPath: frogOfFateIcon,
    upgradeIconPath: frogOfFateUpgraded,
  },
  idol_quest: {
    id: 'idol_quest',
    title: "Idol's Quest",
    description: 'Use Golden Idol 3 times.',
    target: 3,
    reward: {
      type: 'cards',
      amount: 3,
      description: '3 Free Cards + Golden Idol Upgrade',
      upgradeAction: 'golden_idol',
    },
    iconPath: goldenIdolIcon,
    upgradeIconPath: goldenIdolUpgraded,
  },
  glacial_quest: {
    id: 'glacial_quest',
    title: 'Glacial Quest',
    description: 'Use Glacial Elemental 2 times.',
    target: 2,
    reward: {
      type: 'points',
      amount: 300,
      description: '300 Gold + 3 Free Cards',
      bonusCards: 3,
    },
    iconPath: glacialElementalIcon,
  },
  wisdom_quest: {
    id: 'wisdom_quest',
    title: 'Wisdom Quest',
    description: 'Answer 3 questions correct in a row.',
    target: 3,
    reward: {
      type: 'cards',
      amount: 3,
      description: '3 Free Cards + 300 Gold',
      bonusPoints: 300,
    },
    iconPath: madSeerIcon,
  },
  spider_quest: {
    id: 'spider_quest',
    title: "Spider's Quest",
    description: 'Feed the spider 3 isopods.',
    target: 3,
    reward: {
      type: 'cards',
      amount: 5,
      description: '5 Free Isopods',
      specificCardId: 'isopod',
    },
    iconPath: spiderIcon,
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
