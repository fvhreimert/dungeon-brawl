import { useEffect } from 'react'
import clickSound from '@/assets/sounds/UI/click.mp3'

const CLICK_SOUND = clickSound

export function useGlobalClickSound() {
  useEffect(() => {
    // Preload the sound
    const audio = new Audio(CLICK_SOUND)
    audio.volume = 0.15 // Slightly lower volume for frequent UI clicks

    const handleClick = () => {
      // Create a clone to allow overlapping sounds (rapid clicks)
      const sound = audio.cloneNode() as HTMLAudioElement
      sound.volume = 0.15
      sound.play().catch(() => {
        // Ignore auto-play errors or interaction restrictions
      })
    }

    // Use capture phase to hear clicks even if stopPropagation is called
    window.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('click', handleClick, true)
    }
  }, [])
}
