import type { Quest } from '@/types/game'
import questIndicatorIcon from '@/assets/images/ui/quest_indicator.png'
import questIndicatorCompleteIcon from '@/assets/images/ui/quest_indicator_complete.png'
import './QuestIndicator.css'

interface QuestIndicatorProps {
  quests: Quest[]
  onClick: () => void
}

export function QuestIndicator({ quests, onClick }: QuestIndicatorProps) {
  const activeQuests = quests.filter((q) => q.status === 'active')
  const completedQuests = quests.filter((q) => q.status === 'completed')
  const totalCount = activeQuests.length + completedQuests.length

  if (totalCount === 0) return null

  // Determine which icon to show - completed takes priority
  const hasCompleted = completedQuests.length > 0
  const iconSrc = hasCompleted ? questIndicatorCompleteIcon : questIndicatorIcon

  return (
    <div
      className={`quest-indicator ${hasCompleted ? 'has-completed' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
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
}
