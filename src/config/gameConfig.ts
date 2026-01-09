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
    pointValues: [200, 400, 600, 800, 1000],
  },
  mechanics: {
    startingRerolls: 5, // Number of card rerolls each player starts with
    spiderIsopodRerollBonus: 3, // Number of rerolls gained from feeding spider an isopod
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
      maxTileMultiplier: 65536,
    },
    actionPrices: {
      cardJester: 125,
      madSeer: 50,
      frogOfFate: 150,
    },
    cardJester: {
      cardsToGive: 1,
      cardsToGiveUpgraded: 2,
    },
    madSeer: {
      wordsMin: 1,
      wordsMax: 8,
      wordsMinUpgraded: 8,
      wordsMaxUpgraded: 16,
    },
    frogOfFate: {
      frogs: 1,
      frogsUpgraded: 2,
      multiplier: 2,
      multiplierUpgraded: 2,
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
      startBonus: 30,
      pointsMin: 25,
      pointsMax: 100,
      survivors: 1,
      survivorsUpgraded: 2,
    },
    bloodSacrifice: {
      maxSacrifice: 200,
      maxSacrificeUpgraded: 400,
    },
    blackMarket: {
      enabled: true, // Set to false to skip black market entirely
      cardsToShow: 3, // Number of cards displayed in the black market (1-5)
    },
    treasureIsland: {
      valueMultiplier: 300,    // 300% = 3x treasure values
      cursePenalty: 50,        // Lose 50% of gold on curse (not 100%)
      curseIncreaseRate: 10,   // Curse increases by 10% of remaining per dig
      initialCurse: 10,        // Start with 10% curse chance
      setBonus: 40,            // Weight bonus per treasure card owned (for finding missing pieces)
    },
    cardWeights: {
      niffler: 50,
      soul_burst: 30,
      thieving_rat: 70,
      cursed_coin: 60,
      tick: 10,
      spiny_shell: 10,
      traveling_merchant: 80,
      sheep: 60,
      puppet_master: 30,
      beggar: 30,
      roulette: 50,
      shovel: 20,
      compass: 20,
      treasure_map: 20,
      glacial_elemental: 40,
      coalition: 30,
      loot_goblin: 70,
      isopod: 100,
      martin: 50,
      infinite_money_glitch: 30,
      price_cracker: 40,
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
