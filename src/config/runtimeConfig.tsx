import { createContext, useContext, type ReactNode } from 'react'
import { gameConfig } from '@/config/gameConfig'
import type { GameplaySettings } from '@/components/menu/GameSettingsScreen'

export type RuntimeGameConfig = {
  gameplay: {
    startingPoints: number
    pointValues: number[]
    maxScoreForMeter: number
    subtractPointsOnWrongAnswer: boolean
  }
  mechanics: {
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
    multipliers: {
      maxTileMultiplier: number
    }
    actionPrices: {
      cardJester: number
      madSeer: number
      frogOfFate: number
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
    }
  }
}

const defaultRuntimeConfig: RuntimeGameConfig = {
  gameplay: {
    startingPoints: 0,
    pointValues: [...gameConfig.gameplay.pointValues],
    maxScoreForMeter: gameConfig.gameplay.maxScoreForMeter,
    subtractPointsOnWrongAnswer: false,
  },
  mechanics: {
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
    multipliers: {
      maxTileMultiplier: gameConfig.mechanics.multipliers.maxTileMultiplier,
    },
    actionPrices: {
      cardJester: gameConfig.mechanics.actionPrices.cardJester,
      madSeer: gameConfig.mechanics.actionPrices.madSeer,
      frogOfFate: gameConfig.mechanics.actionPrices.frogOfFate,
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
    },
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
      maxScoreForMeter: settings.maxScoreForMeter,
      subtractPointsOnWrongAnswer: settings.subtractPointsOnWrongAnswer,
    },
    mechanics: {
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
      multipliers: {
        maxTileMultiplier: settings.maxTileMultiplier,
      },
      actionPrices: {
        cardJester: settings.cardJesterPrice,
        madSeer: settings.madSeerPrice,
        frogOfFate: settings.frogOfFatePrice,
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
      },
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
