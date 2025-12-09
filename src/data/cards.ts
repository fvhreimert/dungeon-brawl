export type CardTheme = 
  | 'theme-common'
  | 'theme-dungeon'
  | 'theme-nature'
  | 'theme-gold'
  | 'theme-red'
  | 'theme-gray'
  | 'theme-fel'
  | 'theme-dark'
  | 'theme-blue'

export interface CardDefinition {
  id: string
  title: string
  description: string
  inventoryDescription?: string
  theme: CardTheme
  imagePath: string
  framePath: string
  consumesOnActivate?: boolean
}

import nifflerImg from '@/assets/images/cards/images/niffler.png'
import nifflerFrame from '@/assets/images/cards/frames/niffler.png'
import soulBurstImg from '@/assets/images/cards/images/soul_burst.png'
import soulBurstFrame from '@/assets/images/cards/frames/soul_burst.png'
import thievingRatImg from '@/assets/images/cards/images/thieving_rat.png'
import thievingRatFrame from '@/assets/images/cards/frames/thieving_rat.png'
import cursedCoinImg from '@/assets/images/cards/images/cursed_coin.png'
import cursedCoinFrame from '@/assets/images/cards/frames/cursed_coin.png'
import tickImg from '@/assets/images/cards/images/tick.png'
import tickFrame from '@/assets/images/cards/frames/tick.png'
import spinyShellImg from '@/assets/images/cards/images/spiny_shell.png'
import spinyShellFrame from '@/assets/images/cards/frames/spiny_shell.png'
import sheepImg from '@/assets/images/cards/images/sheep.png'
import sheepFrame from '@/assets/images/cards/frames/sheep.png'

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
  },
  {
    id: 'thieving_rat',
    title: 'Thieving Rat',
    description: 'The rat scurries into a foe\'s bag and returns with a mystery item.',
    inventoryDescription: 'Activate to steal a random card from a foe.',
    theme: 'theme-dungeon',
    imagePath: thievingRatImg,
    framePath: thievingRatFrame,
    consumesOnActivate: true,
  },
  {
    id: 'cursed_coin',
    title: 'Cursed Coin',
    description: 'Gain 500 pts now, but lose 50 pts each turn for 10 turns.',
    inventoryDescription: 'Loses 50 pts per turn. Turns left shown below.',
    theme: 'theme-dark',
    imagePath: cursedCoinImg,
    framePath: cursedCoinFrame,
  },
  {
    id: 'tick',
    title: 'Tick',
    description: 'Each turn the tick drains 1% of your current points.',
    inventoryDescription: 'Drains 1% of current score each turn.',
    theme: 'theme-red',
    imagePath: tickImg,
    framePath: tickFrame,
  },
  {
    id: 'spiny_shell',
    title: 'Spiny Shell',
    description: 'Hurl the shell at the leader and deal 20% of their points as damage.',
    inventoryDescription: 'Activate to hit the highest player for 20% of their score.',
    theme: 'theme-blue',
    imagePath: spinyShellImg,
    framePath: spinyShellFrame,
    consumesOnActivate: true,
  },
  {
    id: 'sheep',
    title: 'Sheep',
    description: 'Baaahhh',
    theme: 'theme-common',
    imagePath: sheepImg,
    framePath: sheepFrame,
  },
]
