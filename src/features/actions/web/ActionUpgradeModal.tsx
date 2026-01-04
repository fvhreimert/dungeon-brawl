import { useMemo } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import type { UpgradeableAction, PlayerUpgrades } from '@/types/game'
import { useRuntimeConfig } from '@/config/runtimeConfig'
import crossIcon from '@/assets/images/ui/cross.png'

import madSeerUpgraded from '@/assets/images/actions/mad_seer_upraded.png'
import cardJesterUpgraded from '@/assets/images/actions/card_jester_upgraded.png'
import bloodSacrificeUpgraded from '@/assets/images/actions/blood_sacrifice_upgraded.png'
import frogOfFateUpgraded from '@/assets/images/actions/frog_of_fate_upgraded.png'
import goldenIdolUpgraded from '@/assets/images/actions/golden_idol_upgraded.png'

import './ActionUpgradeModal.css'

type ActionUpgradeInfo = {
  id: UpgradeableAction
  name: string
  upgradedName: string
  image: string
  description: string
}

type ActionUpgradeModalProps = {
  playerUpgrades: PlayerUpgrades
  onUpgrade: (actionId: UpgradeableAction) => void
  onClose: () => void
  remainingUpgrades?: number
}

export function ActionUpgradeModal({
  playerUpgrades,
  onUpgrade,
  onClose,
  remainingUpgrades = 1,
}: ActionUpgradeModalProps) {
  const runtimeConfig = useRuntimeConfig()

  const upgradeInfo = useMemo<ActionUpgradeInfo[]>(() => [
    {
      id: 'mad_seer',
      name: 'Mad Seer',
      upgradedName: 'Madder Seer',
      image: madSeerUpgraded,
      description: `Reveals ${runtimeConfig.mechanics.madSeer.wordsMinUpgraded}-${runtimeConfig.mechanics.madSeer.wordsMaxUpgraded} words in the vision (instead of ${runtimeConfig.mechanics.madSeer.wordsMin}-${runtimeConfig.mechanics.madSeer.wordsMax}), making questions easier to identify.`,
    },
    {
      id: 'card_jester',
      name: 'Card Jester',
      upgradedName: 'Cards Jester',
      image: cardJesterUpgraded,
      description: `Draw ${runtimeConfig.mechanics.cardJester.cardsToGiveUpgraded} cards instead of ${runtimeConfig.mechanics.cardJester.cardsToGive} when using the Card Jester.`,
    },
    {
      id: 'blood_sacrifice',
      name: 'Blood Sacrifice',
      upgradedName: 'Blood Sacrifices',
      image: bloodSacrificeUpgraded,
      description: `Maximum sacrifice increased to ${runtimeConfig.mechanics.bloodSacrifice.maxSacrificeUpgraded} points (from ${runtimeConfig.mechanics.bloodSacrifice.maxSacrifice}).`,
    },
    {
      id: 'frog_of_fate',
      name: 'Frog of Fate',
      upgradedName: 'Frog of Fates',
      image: frogOfFateUpgraded,
      description: `${runtimeConfig.mechanics.frogOfFate.frogsUpgraded} frogs are deployed (instead of ${runtimeConfig.mechanics.frogOfFate.frogs}), applying ${runtimeConfig.mechanics.frogOfFate.multiplierUpgraded}x multipliers.`,
    },
    {
      id: 'golden_idol',
      name: 'Golden Idol',
      upgradedName: 'Diamond Idol',
      image: goldenIdolUpgraded,
      description: `${runtimeConfig.mechanics.goldenIdol.survivorsUpgraded} survivor tiles remain instead of ${runtimeConfig.mechanics.goldenIdol.survivors}, giving you a choice.`,
    },
  ], [runtimeConfig])

  const allUpgraded = upgradeInfo.every((info) => playerUpgrades[info.id])

  const getSubtitle = () => {
    if (allUpgraded) return 'All actions have been upgraded!'
    if (remainingUpgrades > 1) return `Choose ${remainingUpgrades} actions to upgrade`
    return 'Choose an action to upgrade'
  }

  return (
    <div className="action-upgrade-backdrop" onClick={onClose}>
      <div className="action-upgrade-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="action-upgrade-close" onClick={onClose}>
          <img src={crossIcon} alt="Close" />
        </button>

        <div className="action-upgrade-title">Spider's Gift</div>
        <div className="action-upgrade-subtitle">
          {getSubtitle()}
        </div>

        <div className="upgrade-grid">
          {upgradeInfo.map((info) => {
            const isUpgraded = playerUpgrades[info.id] ?? false
            return (
              <div
                key={info.id}
                className={`upgrade-card ${isUpgraded ? 'already-upgraded' : ''}`}
              >
                <div className="upgrade-image-wrapper">
                  <img
                    src={info.image}
                    alt={info.name}
                    className="upgrade-image"
                  />
                </div>
                <div className="upgrade-info">
                  <div className="upgrade-name">{info.upgradedName}</div>
                  <div className="upgrade-description">{info.description}</div>
                </div>
                <RetroButton
                  font="retro"
                  variant="default"
                  className="dialog-button-8bit upgrade-btn"
                  onClick={() => onUpgrade(info.id)}
                  disabled={isUpgraded}
                >
                  {isUpgraded ? 'UPGRADED' : 'UPGRADE'}
                </RetroButton>
              </div>
            )
          })}
        </div>

        <div className="upgrade-actions">
          <RetroButton
            font="retro"
            variant="secondary"
            className="dialog-button-8bit close-btn"
            onClick={onClose}
          >
            CLOSE
          </RetroButton>
        </div>
      </div>
    </div>
  )
}
