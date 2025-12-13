import type { PlayerConfig } from '@/types/game'
import portrait1 from '@/assets/images/ui/portraits/Icons_01.png'
import portrait2 from '@/assets/images/ui/portraits/Icons_02.png'
import portrait3 from '@/assets/images/ui/portraits/Icons_03.png'
import portrait4 from '@/assets/images/ui/portraits/Icons_04.png'

const defaultPlayers: PlayerConfig[] = [
  { name: 'Rogue', score: 1200, inventory: [], portrait: portrait1 },
  { name: 'Mage', score: 900, inventory: [], portrait: portrait2 },
  { name: 'Paladin', score: 700, inventory: [], portrait: portrait3 },
  { name: 'Necro', score: 300, inventory: [], portrait: portrait4 },
]

export const gameConfig = {
  meta: {
    title: "DUNGEON BRAWL",
    description: "A retro pixel-art jeopardy game",
  },
  gameplay: {
    categories: ['Arcana', 'Relics', 'Beasts', 'Lore', 'Traps'],
    pointValues: [100, 200, 300, 400, 500],
    maxScoreForMeter: 2000, // Used to calculate the width of the score bar
  },
  players: defaultPlayers,
  ui: {
    labels: {
      revealButton: "Reveal Answer",
      correctButton: "Correct",
      wrongButton: "Wrong",
      passButton: "Nobody",
      answerHeader: "THE ANSWER",
      fallbackQuestion: (category: string, value: number) => 
        `Answer the ${category.toLowerCase()} challenge worth ${value} points.`,
      fallbackAnswer: "TBD"
    }
  }
} as const;

export const TREASURE_SET_CARD_IDS = ['shovel', 'compass', 'treasure_map'] as const

export type GameConfig = typeof gameConfig;
