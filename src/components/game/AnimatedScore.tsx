import { useAnimatedScore } from '@/hooks/useAnimatedScore'

type AnimatedScoreProps = {
  score: number
}

export function AnimatedScore({ score }: AnimatedScoreProps) {
  const { displayScore, animationState } = useAnimatedScore(score)

  const stateClass =
    animationState === 'increasing'
      ? 'score-increasing'
      : animationState === 'decreasing'
        ? 'score-decreasing'
        : ''

  return (
    <div className={`player-score ${stateClass}`}>
      {displayScore}
    </div>
  )
}
