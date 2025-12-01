const START_SOUNDS = ['/src/assets/sounds/actions/mad_seer/mad_seer_start.mp3']

function createAudio(src: string) {
  const audio = new Audio(src)
  audio.volume = 0.2
  return audio
}

export function useMadSeerSounds() {
  const startPool = START_SOUNDS.map(createAudio)

  const playStart = () => {
    const clip = startPool[Math.floor(Math.random() * startPool.length)]
    clip.currentTime = 0
    clip.playbackRate = 1
    clip.volume = 0.22
    clip.play().catch(() => {})
  }

  return { playStart }
}
