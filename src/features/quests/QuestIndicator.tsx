import type { Quest } from '@/types/game'
import questIndicatorIcon from '@/assets/images/ui/quest_indicator.png'
import questIndicatorCompleteIcon from '@/assets/images/ui/quest_indicator_complete.png'
import './QuestIndicator.css'

interface QuestIndicatorProps {
  quests: Quest[]
  onClick: (questId: string) => void
}

export function QuestIndicator({ quests, onClick }: QuestIndicatorProps) {
  const visibleQuests = quests.filter((q) => q.status === 'active' || q.status === 'completed')

  if (visibleQuests.length === 0) return null

  return (
    <div className="quest-indicators-container">
      {visibleQuests.map((quest) => {
        const isCompleted = quest.status === 'completed'
        const iconSrc = isCompleted ? questIndicatorCompleteIcon : questIndicatorIcon

        return (
          <div
            key={quest.id}
            className={`quest-indicator ${isCompleted ? 'has-completed' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onClick(quest.id)
            }}
          >
            <img
              src={iconSrc}
              alt="Quest"
              className="quest-indicator-icon"
            />
            <span className="quest-indicator-exclamation">!</span>
          </div>
        )
      })}
    </div>
  )
}
