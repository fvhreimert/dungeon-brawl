import { useState } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { gameConfig } from '@/config/gameConfig'
import './GameSettingsScreen.css'

export type GameplaySettings = {
  startingPoints: number
  pointTier1: number
  pointTier2: number
  pointTier3: number
  pointTier4: number
  pointTier5: number
  maxScoreForMeter: number
  subtractPointsOnWrongAnswer: boolean
  freeCardsPerTurn: number
  startingRerolls: number
  spiderIsopodRerollBonus: number
  spiderSenseBonusPerLevel: number
  spiderSenseMaxLevel: number
  allianceBaseDurationMultiplier: number
  cursedCoinDurationTurns: number
  cursedCoinValue: number
  maxTileMultiplier: number
  cardJesterPrice: number
  madSeerPrice: number
  frogOfFatePrice: number
  cardJesterLimit: number
  madSeerLimit: number
  frogOfFateLimit: number
  goldenIdolLimit: number
  bloodSacrificeLimit: number
  webLimit: number
  goldenIdolStartBonus: number
  blackMarketEnabled: boolean
  blackMarketCardsToShow: number
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
  maxScoreForMeter: gameConfig.gameplay.maxScoreForMeter,
  subtractPointsOnWrongAnswer: false,
  freeCardsPerTurn: gameConfig.mechanics.freeCardsPerTurn,
  startingRerolls: gameConfig.mechanics.startingRerolls,
  spiderIsopodRerollBonus: gameConfig.mechanics.spiderIsopodRerollBonus,
  spiderSenseBonusPerLevel: gameConfig.mechanics.spiderSense.bonusPerLevel * 100,
  spiderSenseMaxLevel: gameConfig.mechanics.spiderSense.maxLevel,
  allianceBaseDurationMultiplier: gameConfig.mechanics.alliances.baseDurationMultiplier,
  cursedCoinDurationTurns: gameConfig.mechanics.items.cursedCoin.durationTurns,
  cursedCoinValue: gameConfig.mechanics.items.cursedCoin.value,
  maxTileMultiplier: gameConfig.mechanics.multipliers.maxTileMultiplier,
  cardJesterPrice: gameConfig.mechanics.actionPrices.cardJester,
  madSeerPrice: gameConfig.mechanics.actionPrices.madSeer,
  frogOfFatePrice: gameConfig.mechanics.actionPrices.frogOfFate,
  cardJesterLimit: gameConfig.mechanics.actionLimits.cardJester,
  madSeerLimit: gameConfig.mechanics.actionLimits.madSeer,
  frogOfFateLimit: gameConfig.mechanics.actionLimits.frogOfFate,
  goldenIdolLimit: gameConfig.mechanics.actionLimits.goldenIdol,
  bloodSacrificeLimit: gameConfig.mechanics.actionLimits.bloodSacrifice === Infinity ? -1 : gameConfig.mechanics.actionLimits.bloodSacrifice,
  webLimit: gameConfig.mechanics.actionLimits.web === Infinity ? -1 : gameConfig.mechanics.actionLimits.web,
  goldenIdolStartBonus: gameConfig.mechanics.goldenIdol.startBonus,
  blackMarketEnabled: gameConfig.mechanics.blackMarket.enabled,
  blackMarketCardsToShow: gameConfig.mechanics.blackMarket.cardsToShow,
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

          {/* Gameplay Section */}
          <div className="settings-section">
            <h2 className="section-title">Gameplay</h2>
            <SettingRow
              label="Free Cards Per Turn"
              value={settings.freeCardsPerTurn}
              onChange={(val) => updateSetting('freeCardsPerTurn', val)}
              min={0}
              max={10}
              step={1}
              isInfinity
            />
            <SettingRow
              label="Score Meter Max"
              value={settings.maxScoreForMeter}
              onChange={(val) => updateSetting('maxScoreForMeter', val)}
              min={500}
              max={10000}
              step={500}
            />
            <SettingRow
              label="Max Tile Multiplier"
              value={settings.maxTileMultiplier}
              onChange={(val) => updateSetting('maxTileMultiplier', val)}
              min={2}
              max={256}
              step={2}
            />
            <SettingToggle
              label="Subtract Points on Wrong"
              value={settings.subtractPointsOnWrongAnswer}
              onChange={(val) => updateSetting('subtractPointsOnWrongAnswer', val)}
            />
          </div>

          {/* Rerolls Section */}
          <div className="settings-section">
            <h2 className="section-title">Rerolls</h2>
            <SettingRow
              label="Starting Rerolls"
              value={settings.startingRerolls}
              onChange={(val) => updateSetting('startingRerolls', val)}
              min={0}
              max={50}
              step={1}
            />
            <SettingRow
              label="Isopod Feed Bonus"
              value={settings.spiderIsopodRerollBonus}
              onChange={(val) => updateSetting('spiderIsopodRerollBonus', val)}
              min={0}
              max={10}
              step={1}
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

          {/* Items Section */}
          <div className="settings-section">
            <h2 className="section-title">Items</h2>
            <SettingRow
              label="Cursed Coin Duration"
              value={settings.cursedCoinDurationTurns}
              onChange={(val) => updateSetting('cursedCoinDurationTurns', val)}
              min={1}
              max={30}
              step={1}
              suffix=" turns"
            />
            <SettingRow
              label="Cursed Coin Value"
              value={settings.cursedCoinValue}
              onChange={(val) => updateSetting('cursedCoinValue', val)}
              min={100}
              max={2000}
              step={100}
            />
          </div>

          {/* Action Prices Section */}
          <div className="settings-section">
            <h2 className="section-title">Action Prices</h2>
            <SettingRow
              label="Card Jester"
              value={settings.cardJesterPrice}
              onChange={(val) => updateSetting('cardJesterPrice', val)}
              min={0}
              max={500}
              step={25}
            />
            <SettingRow
              label="Mad Seer"
              value={settings.madSeerPrice}
              onChange={(val) => updateSetting('madSeerPrice', val)}
              min={0}
              max={500}
              step={25}
            />
            <SettingRow
              label="Frog of Fate"
              value={settings.frogOfFatePrice}
              onChange={(val) => updateSetting('frogOfFatePrice', val)}
              min={0}
              max={500}
              step={25}
            />
          </div>

          {/* Action Limits Section */}
          <div className="settings-section">
            <h2 className="section-title">Action Limits (per turn)</h2>
            <SettingRow
              label="Card Jester"
              value={settings.cardJesterLimit}
              onChange={(val) => updateSetting('cardJesterLimit', val)}
              min={1}
              max={10}
              step={1}
              isInfinity
            />
            <SettingRow
              label="Mad Seer"
              value={settings.madSeerLimit}
              onChange={(val) => updateSetting('madSeerLimit', val)}
              min={1}
              max={10}
              step={1}
              isInfinity
            />
            <SettingRow
              label="Frog of Fate"
              value={settings.frogOfFateLimit}
              onChange={(val) => updateSetting('frogOfFateLimit', val)}
              min={1}
              max={10}
              step={1}
              isInfinity
            />
            <SettingRow
              label="Golden Idol"
              value={settings.goldenIdolLimit}
              onChange={(val) => updateSetting('goldenIdolLimit', val)}
              min={1}
              max={10}
              step={1}
              isInfinity
            />
            <SettingRow
              label="Blood Sacrifice"
              value={settings.bloodSacrificeLimit}
              onChange={(val) => updateSetting('bloodSacrificeLimit', val)}
              min={1}
              max={10}
              step={1}
              isInfinity
            />
            <SettingRow
              label="Spider Web"
              value={settings.webLimit}
              onChange={(val) => updateSetting('webLimit', val)}
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
              max={100}
              step={5}
            />
          </div>

          {/* Black Market Section */}
          <div className="settings-section">
            <h2 className="section-title">Black Market</h2>
            <SettingToggle
              label="Enable Black Market"
              value={settings.blackMarketEnabled}
              onChange={(val) => updateSetting('blackMarketEnabled', val)}
            />
            <SettingRow
              label="Cards to Show"
              value={settings.blackMarketCardsToShow}
              onChange={(val) => updateSetting('blackMarketCardsToShow', val)}
              min={1}
              max={5}
              step={1}
            />
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
