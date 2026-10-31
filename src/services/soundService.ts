import { getSoundVolume } from '@/services/displaySettingsService'

import answerWrong from '@/assets/sounds/UI/answer_wrong.wav'
import answerFanfare from '@/assets/sounds/UI/answer_correct_fanfare.wav'
import pickup1 from '@/assets/sounds/UI/answer_correct_pickup1.wav'
import pickup2 from '@/assets/sounds/UI/answer_correct_pickup2.wav'
import pickup3 from '@/assets/sounds/UI/answer_correct_pickup3.wav'
import pickup4 from '@/assets/sounds/UI/answer_correct_pickup4.wav'
import pickup5 from '@/assets/sounds/UI/answer_correct_pickup5.wav'
import pickup6 from '@/assets/sounds/UI/answer_correct_pickup6.wav'
import pickup7 from '@/assets/sounds/UI/answer_correct_pickup7.wav'

const CORRECT_SOUNDS = [answerFanfare, pickup1, pickup2, pickup3, pickup4, pickup5, pickup6, pickup7]

/** Applies the player's master volume (Settings → Display) to a sound's own volume. */
export function scaleVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume * (getSoundVolume() / 100)))
}

/** Plays a one-shot sound at the given volume, scaled by the master volume. */
export function playSound(src: string, volume = 0.5): void {
  const scaled = scaleVolume(volume)
  if (scaled <= 0) return
  const audio = new Audio(src)
  audio.volume = scaled
  audio.play().catch(() => {
    // Autoplay blocked or interrupted: sounds are optional.
  })
}

let lastCorrectIndex = -1

export function playAnswerSound(correct: boolean): void {
  if (!correct) {
    playSound(answerWrong, 0.45)
    return
  }
  // Random pick, never the same sound twice in a row.
  let index = Math.floor(Math.random() * CORRECT_SOUNDS.length)
  if (index === lastCorrectIndex) index = (index + 1) % CORRECT_SOUNDS.length
  lastCorrectIndex = index
  playSound(CORRECT_SOUNDS[index], 0.45)
}
