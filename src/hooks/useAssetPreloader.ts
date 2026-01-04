import { useEffect, useState } from 'react'
import { CARDS } from '@/data/cards'

export function useAssetPreloader() {
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const imagesToLoad: string[] = []
    
    // Add card images and frames
    CARDS.forEach(card => {
      if (card.imagePath) imagesToLoad.push(card.imagePath)
      if (card.framePath) imagesToLoad.push(card.framePath)
    })

    // We can add other hardcoded assets here if needed, 
    // but the cards are the dynamic ones causing layout issues.

    let loadedCount = 0
    const total = imagesToLoad.length

    if (total === 0) {
      setLoaded(true)
      setProgress(100)
      return
    }

    const onLoad = () => {
      loadedCount++
      const newProgress = Math.round((loadedCount / total) * 100)
      setProgress(newProgress)
      if (loadedCount >= total) {
        setLoaded(true)
      }
    }

    imagesToLoad.forEach(src => {
      const img = new Image()
      img.src = src
      img.onload = onLoad
      img.onerror = onLoad // Count errors as loaded to avoid hanging
    })
  }, [])

  return { loaded, progress }
}
