import bloodSacrificeStart from '@/assets/sounds/actions/blood_sacrifice/blood_sacrifice_start.mp3'
import bloodSacrificeLand from '@/assets/sounds/actions/blood_sacrifice/blood_sacrifice_land.mp3'

const START_SOUNDS = [bloodSacrificeStart]
const LAND_SOUNDS = [bloodSacrificeLand]

function createAudio(src: string) {
  const audio = new Audio(src)
  audio.volume = 0.2
  return audio
}

export function useBloodSacrificeSounds() {
  const startPool = START_SOUNDS.map(createAudio)
  const landPool = LAND_SOUNDS.map(createAudio)

  const playStart = () => {
    const clip = startPool[Math.floor(Math.random() * startPool.length)]
    clip.currentTime = 0
    clip.playbackRate = 1
    clip.volume = 0.25
    clip.play().catch(() => {})
  }

  const playLand = () => {
    const clip = landPool[Math.floor(Math.random() * landPool.length)]
    clip.currentTime = 0
    clip.playbackRate = 1
    clip.volume = 0.25
    clip.play().catch(() => {})
  }

  return { playStart, playLand }
}
