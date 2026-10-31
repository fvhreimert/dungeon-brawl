import { useEffect } from 'react'
import { playSound } from '@/services/soundService'
import clickSound from '@/assets/sounds/UI/click.mp3'

const CLICK_SOUND = clickSound

export function useGlobalClickSound() {
  useEffect(() => {
    // A fresh Audio per click lets rapid clicks overlap.
    // Slightly lower volume for frequent UI clicks.
    const handleClick = () => playSound(CLICK_SOUND, 0.15)

    // Use capture phase to hear clicks even if stopPropagation is called
    window.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('click', handleClick, true)
    }
  }, [])
}
