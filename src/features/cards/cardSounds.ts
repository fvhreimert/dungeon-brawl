import { playSound } from '@/services/soundService'

import freezeSound from '@/assets/sounds/cards/glacial_elemental/freeze.wav'
import hypnotizeSound from '@/assets/sounds/cards/puppet_master/hypnotize.wav'
import allianceSound from '@/assets/sounds/cards/coalition/alliance.wav'
import questSound from '@/assets/sounds/cards/martin/quest.wav'
import horseSound from '@/assets/sounds/cards/traveling_merchant/horse.wav'

// Sounds played when a card is activated, keyed by card id.
// Cards with their own sounds elsewhere (Loot Goblin, Roulette, Treasure)
// are not listed here.
const CARD_ACTIVATION_SOUNDS: Record<string, { src: string; volume: number }> = {
  glacial_elemental: { src: freezeSound, volume: 0.45 },
  puppet_master: { src: hypnotizeSound, volume: 0.45 },
  coalition: { src: allianceSound, volume: 0.45 },
  martin: { src: questSound, volume: 0.4 },
  traveling_merchant: { src: horseSound, volume: 0.5 },
}

export function playCardActivationSound(cardId: string): void {
  const sound = CARD_ACTIVATION_SOUNDS[cardId]
  if (sound) playSound(sound.src, sound.volume)
}
