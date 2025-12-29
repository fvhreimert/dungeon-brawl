import { useEffect } from 'react'
import type { Quest } from '@/types/game'
import { getQuestDefinition } from '@/data/quests'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import cardBackImg from '@/assets/images/ui/card_back.png'
import './QuestModal.css'

interface QuestModalProps {
  quest: Quest
  onClose: () => void
  onClaim?: () => void
}

export function QuestModal({ quest, onClose, onClaim }: QuestModalProps) {
  const tickCount = quest.progress.target
  const filledTicks = quest.progress.current
  const isCompleted = quest.status === 'completed'
  const questDef = getQuestDefinition(quest.questId)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="quest-modal-backdrop" onClick={onClose}>
      <div className="quest-modal" onClick={(e) => e.stopPropagation()}>
        {/* Scroll top decoration */}
        <div className="scroll-rod scroll-rod-top">
          <div className="scroll-knob scroll-knob-left" />
          <div className="scroll-knob scroll-knob-right" />
        </div>

        {/* Main scroll content */}
        <div className="scroll-body">
          <div className="quest-content">
            <h2 className="quest-title">{quest.title}</h2>

            {/* Quest icon */}
            {questDef?.iconPath && (
              <div className="quest-icon-container">
                <img
                  src={questDef.iconPath}
                  alt={quest.title}
                  className="quest-icon"
                />
              </div>
            )}

            <p className="quest-description">{quest.description}</p>

            {/* Progress section */}
            <div className="quest-progress-section">
              <div className="quest-progress-label">Progress</div>
              <div className="quest-progress-container">
                <div className="quest-progress-bar">
                  {Array.from({ length: tickCount }, (_, i) => (
                    <div
                      key={i}
                      className={`quest-progress-tick ${i < filledTicks ? 'filled' : ''} ${isCompleted ? 'completed' : ''}`}
                    />
                  ))}
                </div>
                <span className="quest-progress-text">
                  {quest.progress.current} / {quest.progress.target}
                </span>
              </div>
            </div>

            {/* Reward section */}
            <div className="quest-reward-section">
              <span className="quest-reward-label">Reward:</span>
              <div className="quest-reward-icons">
                {/* Card rewards */}
                {quest.reward.type === 'cards' && quest.reward.amount > 0 && (
                  <div className="quest-reward-cards">
                    {Array.from({ length: quest.reward.amount }, (_, i) => (
                      <img
                        key={i}
                        src={cardBackImg}
                        alt="Card"
                        className="quest-reward-card"
                        style={{ marginLeft: i > 0 ? '-20px' : '0' }}
                      />
                    ))}
                  </div>
                )}
                {/* Points rewards */}
                {quest.reward.type === 'points' && (
                  <div className="quest-reward-points">
                    <span className="quest-reward-points-value">{quest.reward.amount}g</span>
                  </div>
                )}
                {/* Plus sign if there's also an upgrade */}
                {questDef?.upgradeIconPath && (
                  <span className="quest-reward-plus">+</span>
                )}
                {/* Upgrade icon */}
                {questDef?.upgradeIconPath && (
                  <img
                    src={questDef.upgradeIconPath}
                    alt="Upgrade"
                    className="quest-upgrade-icon"
                  />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="quest-actions">
              {isCompleted && onClaim ? (
                <RetroButton
                  font="retro"
                  variant="secondary"
                  className="quest-claim-btn"
                  onClick={onClaim}
                >
                  CLAIM REWARD
                </RetroButton>
              ) : (
                <RetroButton font="retro" variant="destructive" onClick={onClose}>
                  CLOSE
                </RetroButton>
              )}
            </div>
          </div>
        </div>

        {/* Scroll bottom decoration */}
        <div className="scroll-rod scroll-rod-bottom">
          <div className="scroll-knob scroll-knob-left" />
          <div className="scroll-knob scroll-knob-right" />
        </div>
      </div>
    </div>
  )
}
