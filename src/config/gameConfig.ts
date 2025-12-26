import type { PlayerConfig } from '@/types/game'
import portrait1 from '@/assets/images/ui/portraits/Icons_01.png'
import portrait2 from '@/assets/images/ui/portraits/Icons_02.png'
import portrait3 from '@/assets/images/ui/portraits/Icons_03.png'
import portrait4 from '@/assets/images/ui/portraits/Icons_04.png'

const defaultPlayers: PlayerConfig[] = [
  { name: 'Rogue', score:0, inventory: [], portrait: portrait1 },
  { name: 'Mage', score:0, inventory: [], portrait: portrait2 },
  { name: 'Paladin', score:0, inventory: [], portrait: portrait3 },
  { name: 'Necro', score:0, inventory: [], portrait: portrait4 },
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
  mechanics: {
    freeCardsPerTurn: -1, // -1 means (player count - 1), or set specific number
    startingRerolls: 10, // Number of card rerolls each player starts with
    spiderIsopodRerollBonus: 2, // Number of rerolls gained from feeding spider an isopod
    spiderSense: {
      bonusPerLevel: 0.05,
      maxLevel: 10,
    },
    alliances: {
      baseDurationMultiplier: 2, // multiplied by number of players
    },
    items: {
      cursedCoin: {
        durationTurns: 10,
        value: 500,
      }
    },
    multipliers: {
      maxTileMultiplier: 128,
    },
    actionPrices: {
      cardJester: 100,
      madSeer: 25,
      frogOfFate: 100,
    },
    actionLimits: {
      cardJester: 1,
      madSeer: 1,
      frogOfFate: 1,
      goldenIdol: 1,
      bloodSacrifice: Infinity,
      web: Infinity,
    },
    goldenIdol: {
      startBonus: 10,
    },
    blackMarket: {
      enabled: true, // Set to false to skip black market entirely
      cardsToShow: 3, // Number of cards displayed in the black market (1-5)
    },
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
