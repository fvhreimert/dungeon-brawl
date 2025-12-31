/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { gameConfig } from '@/config/gameConfig'
import type { GameplaySettings } from '@/components/menu/GameSettingsScreen'

export type RuntimeGameConfig = {
  gameplay: {
    startingPoints: number
    pointValues: number[]
    wrongAnswerPenaltyPercent: number
  }
  mechanics: {
    startingRerolls: number
    spiderIsopodRerollBonus: number
    spiderSense: {
      bonusPerLevel: number
      maxLevel: number
    }
    alliances: {
      baseDurationMultiplier: number
    }
    items: {
      cursedCoin: {
        durationTurns: number
        value: number
      }
    }
    actionPrices: {
      cardJester: number
      madSeer: number
      frogOfFate: number
    }
    cardJester: {
      cardsToGive: number
      cardsToGiveUpgraded: number
    }
    madSeer: {
      wordsMin: number
      wordsMax: number
      wordsMinUpgraded: number
      wordsMaxUpgraded: number
    }
    actionLimits: {
      cardJester: number
      madSeer: number
      frogOfFate: number
      goldenIdol: number
      bloodSacrifice: number
      web: number
    }
    goldenIdol: {
      startBonus: number
      pointsMin: number
      pointsMax: number
    }
    bloodSacrifice: {
      maxSacrifice: number
      maxSacrificeUpgraded: number
    }
    spiderWeb: {
      sheepRerollBonus: number
      sheepUpgradesGiven: number
    }
    blackMarket: {
      enabled: boolean
      cardsToShow: number
    }
    treasureIsland: {
      valueMultiplier: number       // percentage (300 = 3x treasure values)
      cursePenalty: number          // percentage lost on curse (50 = lose half)
      curseIncreaseRate: number     // percentage per dig (10 = +10% of remaining)
      initialCurse: number          // starting curse percentage
    }
    cardWeights: Record<string, number>
  }
}

const defaultRuntimeConfig: RuntimeGameConfig = {
  gameplay: {
    startingPoints: 0,
    pointValues: [...gameConfig.gameplay.pointValues],
    wrongAnswerPenaltyPercent: 0,
  },
  mechanics: {
    startingRerolls: gameConfig.mechanics.startingRerolls,
    spiderIsopodRerollBonus: gameConfig.mechanics.spiderIsopodRerollBonus,
    spiderSense: {
      bonusPerLevel: gameConfig.mechanics.spiderSense.bonusPerLevel,
      maxLevel: gameConfig.mechanics.spiderSense.maxLevel,
    },
    alliances: {
      baseDurationMultiplier: gameConfig.mechanics.alliances.baseDurationMultiplier,
    },
    items: {
      cursedCoin: {
        durationTurns: gameConfig.mechanics.items.cursedCoin.durationTurns,
        value: gameConfig.mechanics.items.cursedCoin.value,
      },
    },
    actionPrices: {
      cardJester: gameConfig.mechanics.actionPrices.cardJester,
      madSeer: gameConfig.mechanics.actionPrices.madSeer,
      frogOfFate: gameConfig.mechanics.actionPrices.frogOfFate,
    },
    cardJester: {
      cardsToGive: gameConfig.mechanics.cardJester.cardsToGive,
      cardsToGiveUpgraded: gameConfig.mechanics.cardJester.cardsToGiveUpgraded,
    },
    madSeer: {
      wordsMin: gameConfig.mechanics.madSeer.wordsMin,
      wordsMax: gameConfig.mechanics.madSeer.wordsMax,
      wordsMinUpgraded: gameConfig.mechanics.madSeer.wordsMinUpgraded,
      wordsMaxUpgraded: gameConfig.mechanics.madSeer.wordsMaxUpgraded,
    },
    actionLimits: {
      cardJester: gameConfig.mechanics.actionLimits.cardJester,
      madSeer: gameConfig.mechanics.actionLimits.madSeer,
      frogOfFate: gameConfig.mechanics.actionLimits.frogOfFate,
      goldenIdol: gameConfig.mechanics.actionLimits.goldenIdol,
      bloodSacrifice: gameConfig.mechanics.actionLimits.bloodSacrifice,
      web: gameConfig.mechanics.actionLimits.web,
    },
    goldenIdol: {
      startBonus: gameConfig.mechanics.goldenIdol.startBonus,
      pointsMin: gameConfig.mechanics.goldenIdol.pointsMin,
      pointsMax: gameConfig.mechanics.goldenIdol.pointsMax,
    },
    bloodSacrifice: {
      maxSacrifice: gameConfig.mechanics.bloodSacrifice.maxSacrifice,
      maxSacrificeUpgraded: gameConfig.mechanics.bloodSacrifice.maxSacrificeUpgraded,
    },
    spiderWeb: {
      sheepRerollBonus: gameConfig.mechanics.spiderWeb.sheepRerollBonus,
      sheepUpgradesGiven: gameConfig.mechanics.spiderWeb.sheepUpgradesGiven,
    },
    blackMarket: {
      enabled: gameConfig.mechanics.blackMarket.enabled,
      cardsToShow: gameConfig.mechanics.blackMarket.cardsToShow,
    },
    treasureIsland: {
      valueMultiplier: gameConfig.mechanics.treasureIsland.valueMultiplier,
      cursePenalty: gameConfig.mechanics.treasureIsland.cursePenalty,
      curseIncreaseRate: gameConfig.mechanics.treasureIsland.curseIncreaseRate,
      initialCurse: gameConfig.mechanics.treasureIsland.initialCurse,
    },
    cardWeights: { ...gameConfig.mechanics.cardWeights },
  },
}

export function gameplaySettingsToRuntimeConfig(settings: GameplaySettings): RuntimeGameConfig {
  return {
    gameplay: {
      startingPoints: settings.startingPoints,
      pointValues: [
        settings.pointTier1,
        settings.pointTier2,
        settings.pointTier3,
        settings.pointTier4,
        settings.pointTier5,
      ],
      wrongAnswerPenaltyPercent: settings.wrongAnswerPenaltyPercent,
    },
    mechanics: {
      startingRerolls: settings.startingRerolls,
      spiderIsopodRerollBonus: settings.spiderIsopodRerollBonus,
      spiderSense: {
        bonusPerLevel: settings.spiderSenseBonusPerLevel / 100,
        maxLevel: settings.spiderSenseMaxLevel,
      },
      alliances: {
        baseDurationMultiplier: settings.allianceBaseDurationMultiplier,
      },
      items: {
        cursedCoin: {
          durationTurns: settings.cursedCoinDurationTurns,
          value: settings.cursedCoinValue,
        },
      },
      actionPrices: {
        cardJester: settings.cardJesterPrice,
        madSeer: settings.madSeerPrice,
        frogOfFate: settings.frogOfFatePrice,
      },
      cardJester: {
        cardsToGive: settings.cardJesterCards,
        cardsToGiveUpgraded: settings.cardJesterCardsUpgraded,
      },
      madSeer: {
        wordsMin: settings.madSeerWordsMin,
        wordsMax: settings.madSeerWordsMax,
        wordsMinUpgraded: settings.madSeerWordsMinUpgraded,
        wordsMaxUpgraded: settings.madSeerWordsMaxUpgraded,
      },
      actionLimits: {
        cardJester: settings.cardJesterLimit === -1 ? Infinity : settings.cardJesterLimit,
        madSeer: settings.madSeerLimit === -1 ? Infinity : settings.madSeerLimit,
        frogOfFate: settings.frogOfFateLimit === -1 ? Infinity : settings.frogOfFateLimit,
        goldenIdol: settings.goldenIdolLimit === -1 ? Infinity : settings.goldenIdolLimit,
        bloodSacrifice: settings.bloodSacrificeLimit === -1 ? Infinity : settings.bloodSacrificeLimit,
        web: settings.webLimit === -1 ? Infinity : settings.webLimit,
      },
      goldenIdol: {
        startBonus: settings.goldenIdolStartBonus,
        pointsMin: settings.goldenIdolPointsMin,
        pointsMax: settings.goldenIdolPointsMax,
      },
      bloodSacrifice: {
        maxSacrifice: settings.bloodSacrificeMax,
        maxSacrificeUpgraded: settings.bloodSacrificeMaxUpgraded,
      },
      spiderWeb: {
        sheepRerollBonus: settings.sheepRerollBonus,
        sheepUpgradesGiven: settings.sheepUpgradesGiven,
      },
      blackMarket: {
        enabled: settings.blackMarketEnabled ?? true,
        cardsToShow: settings.blackMarketCardsToShow ?? 3,
      },
      treasureIsland: {
        valueMultiplier: settings.treasureValueMultiplier,
        cursePenalty: settings.treasureCursePenalty,
        curseIncreaseRate: settings.treasureCurseIncreaseRate,
        initialCurse: settings.treasureInitialCurse,
      },
      cardWeights: { ...settings.cardWeights },
    },
  }
}

const RuntimeConfigContext = createContext<RuntimeGameConfig>(defaultRuntimeConfig)

export function RuntimeConfigProvider({ 
  children, 
  config 
}: { 
  children: ReactNode
  config?: RuntimeGameConfig 
}) {
  return (
    <RuntimeConfigContext.Provider value={config ?? defaultRuntimeConfig}>
      {children}
    </RuntimeConfigContext.Provider>
  )
}

export function useRuntimeConfig() {
  return useContext(RuntimeConfigContext)
}
