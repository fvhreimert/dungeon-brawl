import { useState } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { gameConfig } from '@/config/gameConfig'
import { CARDS } from '@/data/cards'
import './GameSettingsScreen.css'

export type GameplaySettings = {
  startingPoints: number
  pointTier1: number
  pointTier2: number
  pointTier3: number
  pointTier4: number
  pointTier5: number
  wrongAnswerPenaltyPercent: number
  startingRerolls: number
  spiderIsopodRerollBonus: number
  spiderSenseBonusPerLevel: number
  spiderSenseMaxLevel: number
  allianceBaseDurationMultiplier: number
  cursedCoinDurationTurns: number
  cursedCoinValue: number
  cardJesterPrice: number
  cardJesterCards: number
  cardJesterCardsUpgraded: number
  madSeerPrice: number
  madSeerWordsMin: number
  madSeerWordsMax: number
  madSeerWordsMinUpgraded: number
  madSeerWordsMaxUpgraded: number
  frogOfFatePrice: number
  cardJesterLimit: number
  madSeerLimit: number
  frogOfFateLimit: number
  goldenIdolLimit: number
  goldenIdolStartBonus: number
  goldenIdolPointsMin: number
  goldenIdolPointsMax: number
  bloodSacrificeLimit: number
  bloodSacrificeMax: number
  bloodSacrificeMaxUpgraded: number
  webLimit: number
  sheepRerollBonus: number
  sheepUpgradesGiven: number
  blackMarketEnabled: boolean
  blackMarketCardsToShow: number
  cardWeights: Record<string, number>
}

type GameSettingsScreenProps = {
  onBack: () => void
  onStartGame: (settings: GameplaySettings) => void
}

const DEFAULT_SETTINGS: GameplaySettings = {
  startingPoints: 0,
  pointTier1: gameConfig.gameplay.pointValues[0],
  pointTier2: gameConfig.gameplay.pointValues[1],
  pointTier3: gameConfig.gameplay.pointValues[2],
  pointTier4: gameConfig.gameplay.pointValues[3],
  pointTier5: gameConfig.gameplay.pointValues[4],
  wrongAnswerPenaltyPercent: 0,
  startingRerolls: gameConfig.mechanics.startingRerolls,
  spiderIsopodRerollBonus: gameConfig.mechanics.spiderIsopodRerollBonus,
  spiderSenseBonusPerLevel: gameConfig.mechanics.spiderSense.bonusPerLevel * 100,
  spiderSenseMaxLevel: gameConfig.mechanics.spiderSense.maxLevel,
  allianceBaseDurationMultiplier: gameConfig.mechanics.alliances.baseDurationMultiplier,
  cursedCoinDurationTurns: gameConfig.mechanics.items.cursedCoin.durationTurns,
  cursedCoinValue: gameConfig.mechanics.items.cursedCoin.value,
  cardJesterPrice: gameConfig.mechanics.actionPrices.cardJester,
  cardJesterCards: gameConfig.mechanics.cardJester.cardsToGive,
  cardJesterCardsUpgraded: gameConfig.mechanics.cardJester.cardsToGiveUpgraded,
  madSeerPrice: gameConfig.mechanics.actionPrices.madSeer,
  madSeerWordsMin: gameConfig.mechanics.madSeer.wordsMin,
  madSeerWordsMax: gameConfig.mechanics.madSeer.wordsMax,
  madSeerWordsMinUpgraded: gameConfig.mechanics.madSeer.wordsMinUpgraded,
  madSeerWordsMaxUpgraded: gameConfig.mechanics.madSeer.wordsMaxUpgraded,
  frogOfFatePrice: gameConfig.mechanics.actionPrices.frogOfFate,
  cardJesterLimit: gameConfig.mechanics.actionLimits.cardJester,
  madSeerLimit: gameConfig.mechanics.actionLimits.madSeer,
  frogOfFateLimit: gameConfig.mechanics.actionLimits.frogOfFate,
  goldenIdolLimit: gameConfig.mechanics.actionLimits.goldenIdol,
  goldenIdolStartBonus: gameConfig.mechanics.goldenIdol.startBonus,
  goldenIdolPointsMin: gameConfig.mechanics.goldenIdol.pointsMin,
  goldenIdolPointsMax: gameConfig.mechanics.goldenIdol.pointsMax,
  bloodSacrificeLimit: gameConfig.mechanics.actionLimits.bloodSacrifice === Infinity ? -1 : gameConfig.mechanics.actionLimits.bloodSacrifice,
  bloodSacrificeMax: gameConfig.mechanics.bloodSacrifice.maxSacrifice,
  bloodSacrificeMaxUpgraded: gameConfig.mechanics.bloodSacrifice.maxSacrificeUpgraded,
  webLimit: gameConfig.mechanics.actionLimits.web === Infinity ? -1 : gameConfig.mechanics.actionLimits.web,
  sheepRerollBonus: gameConfig.mechanics.spiderWeb.sheepRerollBonus,
  sheepUpgradesGiven: gameConfig.mechanics.spiderWeb.sheepUpgradesGiven,
  blackMarketEnabled: gameConfig.mechanics.blackMarket.enabled,
  blackMarketCardsToShow: gameConfig.mechanics.blackMarket.cardsToShow,
  cardWeights: { ...gameConfig.mechanics.cardWeights },
}

type SettingRowProps = {
  label: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  isInfinity?: boolean
}

type SettingToggleProps = {
  label: string
  value: boolean
  onChange: (val: boolean) => void
}

function SettingToggle({ label, value, onChange }: SettingToggleProps) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <div className="setting-controls">
        <RetroButton
          font="retro"
          variant={value ? 'default' : 'secondary'}
          className="setting-btn toggle-btn"
          onClick={() => onChange(!value)}
        >
          {value ? 'ON' : 'OFF'}
        </RetroButton>
      </div>
    </div>
  )
}

function SettingRow({ label, value, onChange, min = 0, max = 9999, step = 1, suffix = '', isInfinity = false }: SettingRowProps) {
  const displayValue = isInfinity && value === -1 ? '∞' : value.toString()
  
  const handleDecrease = () => {
    if (isInfinity && value === -1) {
      onChange(max)
    } else if (value - step >= min) {
      onChange(value - step)
    }
  }
  
  const handleIncrease = () => {
    if (isInfinity && value === max) {
      onChange(-1)
    } else if (value + step <= max) {
      onChange(value + step)
    } else if (isInfinity) {
      onChange(-1)
    }
  }

  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <div className="setting-controls">
        <RetroButton
          font="retro"
          variant="secondary"
          className="setting-btn"
          onClick={handleDecrease}
          disabled={!isInfinity && value <= min}
        >
          -
        </RetroButton>
        <span className="setting-value">
          {displayValue}{suffix && value !== -1 ? suffix : ''}
        </span>
        <RetroButton
          font="retro"
          variant="secondary"
          className="setting-btn"
          onClick={handleIncrease}
          disabled={!isInfinity && value >= max}
        >
          +
        </RetroButton>
      </div>
    </div>
  )
}

export function GameSettingsScreen({ onBack, onStartGame }: GameSettingsScreenProps) {
  const [settings, setSettings] = useState<GameplaySettings>(DEFAULT_SETTINGS)

  const updateSetting = <K extends keyof GameplaySettings>(key: K, value: GameplaySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateCardWeight = (cardId: string, weight: number) => {
    setSettings(prev => ({
      ...prev,
      cardWeights: {
        ...prev.cardWeights,
        [cardId]: weight,
      },
    }))
  }

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  const handleStartGame = () => {
    onStartGame(settings)
  }

  return (
    <div className="game-settings-screen">
      <div className="game-settings-container">
        <h1 className="game-settings-title">Game Settings</h1>
        
        <div className="settings-content">
          <div className="settings-column">
            {/* Points Section */}
            <div className="settings-section">
              <h2 className="section-title">Points</h2>
              <SettingRow
                label="Starting Points"
                value={settings.startingPoints}
                onChange={(val) => updateSetting('startingPoints', val)}
                min={0}
                max={5000}
                step={100}
              />
              <SettingRow
                label="Tier 1 (Row 1)"
                value={settings.pointTier1}
                onChange={(val) => updateSetting('pointTier1', val)}
                min={50}
                max={1000}
                step={50}
              />
              <SettingRow
                label="Tier 2 (Row 2)"
                value={settings.pointTier2}
                onChange={(val) => updateSetting('pointTier2', val)}
                min={50}
                max={1000}
                step={50}
              />
              <SettingRow
                label="Tier 3 (Row 3)"
                value={settings.pointTier3}
                onChange={(val) => updateSetting('pointTier3', val)}
                min={50}
                max={1000}
                step={50}
              />
              <SettingRow
                label="Tier 4 (Row 4)"
                value={settings.pointTier4}
                onChange={(val) => updateSetting('pointTier4', val)}
                min={50}
                max={1000}
                step={50}
              />
              <SettingRow
                label="Tier 5 (Row 5)"
                value={settings.pointTier5}
                onChange={(val) => updateSetting('pointTier5', val)}
                min={50}
                max={1000}
                step={50}
              />
            </div>

            {/* Spider Sense Section */}
            <div className="settings-section">
              <h2 className="section-title">Spider Sense</h2>
              <SettingRow
                label="Bonus Per Level"
                value={settings.spiderSenseBonusPerLevel}
                onChange={(val) => updateSetting('spiderSenseBonusPerLevel', val)}
                min={1}
                max={50}
                step={1}
                suffix="%"
              />
              <SettingRow
                label="Max Level"
                value={settings.spiderSenseMaxLevel}
                onChange={(val) => updateSetting('spiderSenseMaxLevel', val)}
                min={1}
                max={20}
                step={1}
              />
            </div>

            {/* Items Section */}
            <div className="settings-section">
              <h2 className="section-title">Cursed Coin</h2>
              <SettingRow
                label="Duration"
                value={settings.cursedCoinDurationTurns}
                onChange={(val) => updateSetting('cursedCoinDurationTurns', val)}
                min={1}
                max={30}
                step={1}
                suffix=" turns"
              />
              <SettingRow
                label="Value"
                value={settings.cursedCoinValue}
                onChange={(val) => updateSetting('cursedCoinValue', val)}
                min={100}
                max={2000}
                step={100}
              />
            </div>

            {/* Mad Seer Section */}
            <div className="settings-section">
              <h2 className="section-title">Mad Seer</h2>
              <SettingRow
                label="Price"
                value={settings.madSeerPrice}
                onChange={(val) => updateSetting('madSeerPrice', val)}
                min={0}
                max={500}
                step={25}
              />
              <SettingRow
                label="Words (Min)"
                value={settings.madSeerWordsMin}
                onChange={(val) => updateSetting('madSeerWordsMin', val)}
                min={1}
                max={20}
                step={1}
              />
              <SettingRow
                label="Words (Max)"
                value={settings.madSeerWordsMax}
                onChange={(val) => updateSetting('madSeerWordsMax', val)}
                min={1}
                max={20}
                step={1}
              />
              <SettingRow
                label="Words Min (Upgraded)"
                value={settings.madSeerWordsMinUpgraded}
                onChange={(val) => updateSetting('madSeerWordsMinUpgraded', val)}
                min={1}
                max={30}
                step={1}
              />
              <SettingRow
                label="Words Max (Upgraded)"
                value={settings.madSeerWordsMaxUpgraded}
                onChange={(val) => updateSetting('madSeerWordsMaxUpgraded', val)}
                min={1}
                max={30}
                step={1}
              />
              <SettingRow
                label="Limit (per turn)"
                value={settings.madSeerLimit}
                onChange={(val) => updateSetting('madSeerLimit', val)}
                min={1}
                max={10}
                step={1}
                isInfinity
              />
            </div>

            {/* Golden Idol Section */}
            <div className="settings-section">
              <h2 className="section-title">Golden Idol</h2>
              <SettingRow
                label="Start Bonus"
                value={settings.goldenIdolStartBonus}
                onChange={(val) => updateSetting('goldenIdolStartBonus', val)}
                min={0}
                max={500}
                step={5}
              />
              <SettingRow
                label="Points Per Turn (Min)"
                value={settings.goldenIdolPointsMin}
                onChange={(val) => updateSetting('goldenIdolPointsMin', val)}
                min={0}
                max={200}
                step={5}
              />
              <SettingRow
                label="Points Per Turn (Max)"
                value={settings.goldenIdolPointsMax}
                onChange={(val) => updateSetting('goldenIdolPointsMax', val)}
                min={5}
                max={500}
                step={5}
              />
              <SettingRow
                label="Limit (per turn)"
                value={settings.goldenIdolLimit}
                onChange={(val) => updateSetting('goldenIdolLimit', val)}
                min={1}
                max={10}
                step={1}
                isInfinity
              />
            </div>
          </div>

          <div className="settings-column">
            {/* Gameplay Section */}
            <div className="settings-section">
              <h2 className="section-title">Gameplay</h2>
              <SettingRow
                label="Wrong Answer Penalty"
                value={settings.wrongAnswerPenaltyPercent}
                onChange={(val) => updateSetting('wrongAnswerPenaltyPercent', val)}
                min={0}
                max={100}
                step={5}
                suffix="%"
              />
              <SettingRow
                label="Starting Rerolls"
                value={settings.startingRerolls}
                onChange={(val) => updateSetting('startingRerolls', val)}
                min={0}
                max={50}
                step={1}
              />
              <SettingToggle
                label="Enable Black Market"
                value={settings.blackMarketEnabled}
                onChange={(val) => updateSetting('blackMarketEnabled', val)}
              />
              <SettingRow
                label="Black Market Cards"
                value={settings.blackMarketCardsToShow}
                onChange={(val) => updateSetting('blackMarketCardsToShow', val)}
                min={1}
                max={5}
                step={1}
              />
            </div>

            {/* Alliances Section */}
            <div className="settings-section">
              <h2 className="section-title">Alliances</h2>
              <SettingRow
                label="Duration Multiplier"
                value={settings.allianceBaseDurationMultiplier}
                onChange={(val) => updateSetting('allianceBaseDurationMultiplier', val)}
                min={1}
                max={10}
                step={1}
                suffix="x players"
              />
            </div>

            {/* Card Jester Section */}
            <div className="settings-section">
              <h2 className="section-title">Card Jester</h2>
              <SettingRow
                label="Price"
                value={settings.cardJesterPrice}
                onChange={(val) => updateSetting('cardJesterPrice', val)}
                min={0}
                max={500}
                step={25}
              />
              <SettingRow
                label="Cards Given"
                value={settings.cardJesterCards}
                onChange={(val) => updateSetting('cardJesterCards', val)}
                min={1}
                max={5}
                step={1}
              />
              <SettingRow
                label="Cards Given (Upgraded)"
                value={settings.cardJesterCardsUpgraded}
                onChange={(val) => updateSetting('cardJesterCardsUpgraded', val)}
                min={1}
                max={10}
                step={1}
              />
              <SettingRow
                label="Limit (per turn)"
                value={settings.cardJesterLimit}
                onChange={(val) => updateSetting('cardJesterLimit', val)}
                min={1}
                max={10}
                step={1}
                isInfinity
              />
            </div>

            {/* Frog of Fate Section */}
            <div className="settings-section">
              <h2 className="section-title">Frog of Fate</h2>
              <SettingRow
                label="Price"
                value={settings.frogOfFatePrice}
                onChange={(val) => updateSetting('frogOfFatePrice', val)}
                min={0}
                max={500}
                step={25}
              />
              <SettingRow
                label="Limit (per turn)"
                value={settings.frogOfFateLimit}
                onChange={(val) => updateSetting('frogOfFateLimit', val)}
                min={1}
                max={10}
                step={1}
                isInfinity
              />
            </div>

            {/* Blood Sacrifice Section */}
            <div className="settings-section">
              <h2 className="section-title">Blood Sacrifice</h2>
              <SettingRow
                label="Max Sacrifice"
                value={settings.bloodSacrificeMax}
                onChange={(val) => updateSetting('bloodSacrificeMax', val)}
                min={10}
                max={500}
                step={10}
              />
              <SettingRow
                label="Max Sacrifice (Upgraded)"
                value={settings.bloodSacrificeMaxUpgraded}
                onChange={(val) => updateSetting('bloodSacrificeMaxUpgraded', val)}
                min={10}
                max={1000}
                step={10}
              />
              <SettingRow
                label="Limit (per turn)"
                value={settings.bloodSacrificeLimit}
                onChange={(val) => updateSetting('bloodSacrificeLimit', val)}
                min={1}
                max={10}
                step={1}
                isInfinity
              />
            </div>

            {/* Spider Web Section */}
            <div className="settings-section">
              <h2 className="section-title">Spider Web</h2>
              <SettingRow
                label="Rerolls Per Isopod"
                value={settings.spiderIsopodRerollBonus}
                onChange={(val) => updateSetting('spiderIsopodRerollBonus', val)}
                min={0}
                max={10}
                step={1}
              />
              <SettingRow
                label="Rerolls Per Sheep"
                value={settings.sheepRerollBonus}
                onChange={(val) => updateSetting('sheepRerollBonus', val)}
                min={0}
                max={10}
                step={1}
              />
              <SettingRow
                label="Upgrades Per Sheep"
                value={settings.sheepUpgradesGiven}
                onChange={(val) => updateSetting('sheepUpgradesGiven', val)}
                min={1}
                max={5}
                step={1}
              />
              <SettingRow
                label="Limit (per turn)"
                value={settings.webLimit}
                onChange={(val) => updateSetting('webLimit', val)}
                min={1}
                max={10}
                step={1}
                isInfinity
              />
            </div>

            {/* Card Weights Section */}
            <div className="settings-section">
              <h2 className="section-title">Card Weights</h2>
              {CARDS.map((card) => (
                <SettingRow
                  key={card.id}
                  label={card.title}
                  value={settings.cardWeights[card.id] ?? 1}
                  onChange={(val) => updateCardWeight(card.id, val)}
                  min={0}
                  max={20}
                  step={1}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <RetroButton
            font="retro"
            variant="destructive"
            className="settings-btn-action"
            onClick={onBack}
          >
            Back
          </RetroButton>
          <RetroButton
            font="retro"
            variant="secondary"
            className="settings-btn-action"
            onClick={handleResetDefaults}
          >
            Reset
          </RetroButton>
          <RetroButton
            font="retro"
            className="settings-btn-action start-btn"
            onClick={handleStartGame}
          >
            Start Game
          </RetroButton>
        </div>
      </div>
    </div>
  )
}
