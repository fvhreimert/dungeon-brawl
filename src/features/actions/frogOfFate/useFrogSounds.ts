const START_SOUNDS = ['/src/assets/sounds/actions/frog_of_fate/frog_start.mp3']
const HOP_SOUNDS = ['/src/assets/sounds/actions/frog_of_fate/frog_tick.wav']
const LAND_SOUNDS = ['/src/assets/sounds/actions/frog_of_fate/frog_land.mp3']

function createHowl(src: string) {
  const audio = new Audio(src)
  audio.volume = 0.2
  return audio
}

export function useFrogSounds() {
  const startPool = START_SOUNDS.map(createHowl)
  const hopPool = HOP_SOUNDS.map(createHowl)
  const landPool = LAND_SOUNDS.map(createHowl)

  const playStart = () => {
    const clip = startPool[Math.floor(Math.random() * startPool.length)]
    clip.currentTime = 0
    clip.playbackRate = 1
    clip.volume = 0.22
    clip.play().catch(() => {})
  }

  const playHop = () => {
    const clip = hopPool[Math.floor(Math.random() * hopPool.length)]
    clip.currentTime = 0
    clip.playbackRate = 0.95 + Math.random() * 0.1
    clip.volume = 0.05
    clip.play().catch(() => {})
  }

  const playLand = () => {
    const clip = landPool[Math.floor(Math.random() * landPool.length)]
    clip.currentTime = 0
    clip.playbackRate = 1
    clip.volume = 0.2
    clip.play().catch(() => {})
  }

  return { playStart, playHop, playLand }
}
