import { useEffect } from 'react'
import type { Quest } from '@/types/game'
import { getQuestDefinition } from '@/data/quests'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import './QuestModal.css'

interface QuestModalProps {
  quest: Quest
  onClose: () => void
  onClaim?: () => void
}

const TICK_COUNT = 300

export function QuestModal({ quest, onClose, onClaim }: QuestModalProps) {
  const progressRatio = quest.progress.current / quest.progress.target
  const filledTicks = Math.min(Math.floor(progressRatio * TICK_COUNT), TICK_COUNT)
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
                  {Array.from({ length: TICK_COUNT }, (_, i) => (
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
              <span className="quest-reward-value">{quest.reward.description}</span>
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
