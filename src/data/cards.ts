export type CardTheme = 
  | 'theme-common'
  | 'theme-dungeon'
  | 'theme-nature'
  | 'theme-gold'
  | 'theme-red'
  | 'theme-gray'
  | 'theme-fel'

export interface CardDefinition {
  id: string
  title: string
  description: string
  inventoryDescription?: string
  theme: CardTheme
  imagePath: string
  framePath: string
}

import nifflerImg from '@/assets/images/cards/images/niffler.png'
import nifflerFrame from '@/assets/images/cards/frames/niffler.png'
import soulBurstImg from '@/assets/images/cards/images/soul_burst.png'
import soulBurstFrame from '@/assets/images/cards/frames/soul_burst.png'

export const CARDS: CardDefinition[] = [
  {
    id: 'niffler',
    title: 'Niffler',
    description: 'Gain 25 points passively every turn.',
    inventoryDescription: '*25* pts per turn',
    theme: 'theme-common',
    imagePath: nifflerImg,
    framePath: nifflerFrame,
  },
  {
    id: 'soul_burst',
    title: 'Soul Burst',
    description: 'Absorb 25% of all damage taken (non-question) and unleash it on a foe.',
    inventoryDescription: 'Activate to steal *stored damage* pts.',
    theme: 'theme-fel',
    imagePath: soulBurstImg,
    framePath: soulBurstFrame,
  }
]
