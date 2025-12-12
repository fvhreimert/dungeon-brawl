import { useEffect, useRef, useState } from 'react'

type AnimationState = 'idle' | 'increasing' | 'decreasing'

type UseAnimatedScoreOptions = {
  duration?: number
}

export function useAnimatedScore(
  targetScore: number,
  options: UseAnimatedScoreOptions = {},
) {
  const { duration = 600 } = options

  const [displayScore, setDisplayScore] = useState(targetScore)
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [trackedTarget, setTrackedTarget] = useState(targetScore)

  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // Skip if target hasn't changed
    if (targetScore === trackedTarget) return

    const previousScore = displayScore
    const delta = targetScore - previousScore

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    // Update tracked target immediately
    setTrackedTarget(targetScore)

    if (delta === 0) return

    const direction: AnimationState = delta > 0 ? 'increasing' : 'decreasing'
    setAnimationState(direction)

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing: ease-out cubic for snappy start, smooth end
      const eased = 1 - Math.pow(1 - progress, 3)

      const currentScore = Math.round(previousScore + delta * eased)
      setDisplayScore(currentScore)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayScore(targetScore)
        // Keep the color state briefly after animation completes
        setTimeout(() => setAnimationState('idle'), 200)
        animationRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetScore, duration])

  return { displayScore, animationState }
}
