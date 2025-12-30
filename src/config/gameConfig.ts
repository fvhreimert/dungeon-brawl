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
  },
  mechanics: {
    startingRerolls: 10, // Number of card rerolls each player starts with
    spiderIsopodRerollBonus: 1, // Number of rerolls gained from feeding spider an isopod
    spiderWeb: {
      sheepRerollBonus: 3, // Number of rerolls gained from feeding spider a sheep
      sheepUpgradesGiven: 1, // Number of action upgrades per sheep fed
    },
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
    cardJester: {
      cardsToGive: 1,
      cardsToGiveUpgraded: 2,
    },
    madSeer: {
      wordsMin: 4,
      wordsMax: 8,
      wordsMinUpgraded: 8,
      wordsMaxUpgraded: 16,
    },
    actionLimits: {
      cardJester: 1,
      madSeer: 1,
      frogOfFate: 1,
      goldenIdol: 1,
      bloodSacrifice: 1,
      web: Infinity,
    },
    goldenIdol: {
      startBonus: 10,
      pointsMin: 5,
      pointsMax: 100,
    },
    bloodSacrifice: {
      maxSacrifice: 100,
      maxSacrificeUpgraded: 200,
    },
    blackMarket: {
      enabled: true, // Set to false to skip black market entirely
      cardsToShow: 3, // Number of cards displayed in the black market (1-5)
    },
    cardWeights: {
      niffler: 5,
      soul_burst: 3,
      thieving_rat: 7,
      cursed_coin: 6,
      tick: 1,
      spiny_shell: 1,
      traveling_merchant: 8,
      sheep: 6,
      puppet_master: 3,
      beggar: 3,
      roulette: 5,
      shovel: 2,
      compass: 2,
      treasure_map: 2,
      glacial_elemental: 4,
      coalition: 3,
      loot_goblin: 7,
      isopod: 10,
      martin: 5,
      infinite_money_glitch: 3,
    } as Record<string, number>,
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
