import { useAnimatedScore } from '@/hooks/useAnimatedScore'

type AnimatedScoreProps = {
  score: number
}

export function AnimatedScore({ score }: AnimatedScoreProps) {
  const { displayScore, animationState } = useAnimatedScore(score)

  const isNegative = score < 0

  const stateClass =
    animationState === 'increasing'
      ? 'score-increasing'
      : animationState === 'decreasing'
        ? 'score-decreasing'
        : ''

  const negativeClass = isNegative && animationState === 'idle' ? 'score-negative' : ''

  return (
    <div className={`player-score ${stateClass} ${negativeClass}`}>
      {displayScore}
    </div>
  )
}
