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
import travelingMerchantImg from '@/assets/images/cards/images/traveling_merchant.png'
import travelingMerchantFrame from '@/assets/images/cards/frames/traveling_merchant.png'
import sheepImg from '@/assets/images/cards/images/sheep.png'
import sheepFrame from '@/assets/images/cards/frames/sheep.png'
import puppetMasterImg from '@/assets/images/cards/images/puppet_master.png'
import puppetMasterFrame from '@/assets/images/cards/frames/puppet_master.png'
import beggarImg from '@/assets/images/cards/images/beggar.png'
import beggarFrame from '@/assets/images/cards/frames/beggar.png'
import rouletteImg from '@/assets/images/cards/images/roulette.png'
import rouletteFrame from '@/assets/images/cards/frames/roulette.png'
import shovelImg from '@/assets/images/cards/images/shovel.png'
import shovelFrame from '@/assets/images/cards/frames/shovel.png'
import compassImg from '@/assets/images/cards/images/compass.png'
import compassFrame from '@/assets/images/cards/frames/compass.png'
import treasureMapImg from '@/assets/images/cards/images/treasure_map.png'
import treasureMapFrame from '@/assets/images/cards/frames/treasure_map.png'
import glacialElementalImg from '@/assets/images/cards/images/glacial_elemental.png'
import glacialElementalFrame from '@/assets/images/cards/frames/glacial_elemental.png'
import coalitionImg from '@/assets/images/cards/images/coalition.png'
import coalitionFrame from '@/assets/images/cards/frames/coalition.png'
import lootGoblinImg from '@/assets/images/cards/images/loot_goblin.png'
import lootGoblinFrame from '@/assets/images/cards/frames/loot_goblin.png'
import isopodImg from '@/assets/images/cards/images/isopod.png'
import isopodFrame from '@/assets/images/cards/frames/isopod.png'
import martinImg from '@/assets/images/cards/images/martin.png'
import martinFrame from '@/assets/images/cards/frames/martin.png'
import infiniteMoneyGlitchImg from '@/assets/images/cards/images/infinite_money_glitch.png'
import infiniteMoneyGlitchFrame from '@/assets/images/cards/frames/infinite_money_glitch.png'

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
    id: 'traveling_merchant',
    title: 'Traveling Merchant',
    description: 'Peruse four wares before choosing one to keep.',
    inventoryDescription: 'Choose one of four cards offered by the merchant.',
    theme: 'theme-common',
    imagePath: travelingMerchantImg,
    framePath: travelingMerchantFrame,
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
  {
    id: 'puppet_master',
    title: 'Puppet Master',
    description: 'Bind a foe to a single category for their next turn.',
    inventoryDescription: 'Activate to curse a foe with a category lock.',
    theme: 'theme-dark',
    imagePath: puppetMasterImg,
    framePath: puppetMasterFrame,
    consumesOnActivate: true,
  },
  {
    id: 'beggar',
    title: 'Beggar',
    description: 'The beggar takes 10 points from all other players every turn.',
    inventoryDescription: 'Steals 10 pts from each foe per turn.',
    theme: 'theme-dungeon',
    imagePath: beggarImg,
    framePath: beggarFrame,
  },
  {
    id: 'roulette',
    title: 'Roulette',
    description: 'Stake up to 500 points on a 50/50 gamble. Double or nothing!',
    inventoryDescription: 'Activate to gamble points.',
    theme: 'theme-gold',
    imagePath: rouletteImg,
    framePath: rouletteFrame,
    consumesOnActivate: true,
  },
  {
    id: 'shovel',
    title: 'Shovel',
    description: 'A sturdy shovel. Part of the Treasure Set.',
    inventoryDescription: 'Collect all 3 treasure items to find riches.',
    theme: 'theme-gold',
    imagePath: shovelImg,
    framePath: shovelFrame,
  },
  {
    id: 'compass',
    title: 'Compass',
    description: 'Points toward fortune. Part of the Treasure Set.',
    inventoryDescription: 'Collect all 3 treasure items to find riches.',
    theme: 'theme-gold',
    imagePath: compassImg,
    framePath: compassFrame,
  },
  {
    id: 'treasure_map',
    title: 'Treasure Map',
    description: 'X marks the spot. Part of the Treasure Set.',
    inventoryDescription: 'Collect all 3 treasure items to find riches.',
    theme: 'theme-gold',
    imagePath: treasureMapImg,
    framePath: treasureMapFrame,
  },
  {
    id: 'glacial_elemental',
    title: 'Glacial Elemental',
    description: 'Freeze a tile or an action until your next turn. Others cannot select it.',
    inventoryDescription: 'Activate to freeze a tile or an action.',
    theme: 'theme-blue',
    imagePath: glacialElementalImg,
    framePath: glacialElementalFrame,
    consumesOnActivate: true,
  },
  {
    id: 'coalition',
    title: 'Coalition',
    description: 'Form an alliance with another player. Allies cannot target each other.',
    inventoryDescription: 'Activate to form an alliance.',
    theme: 'theme-gold',
    imagePath: coalitionImg,
    framePath: coalitionFrame,
    consumesOnActivate: true,
  },
  {
    id: 'loot_goblin',
    title: 'Loot Goblin',
    description: 'Steal 200 points from a player of your choice.',
    inventoryDescription: 'Steal 200 points from a player of your choice.',
    theme: 'theme-dungeon',
    imagePath: lootGoblinImg,
    framePath: lootGoblinFrame,
    consumesOnActivate: true,
  },
  {
    id: 'isopod',
    title: 'Isopod',
    description: '...',
    theme: 'theme-common',
    imagePath: isopodImg,
    framePath: isopodFrame,
  },
  {
    id: 'martin',
    title: 'Martin',
    description: 'Martin bestows upon you a sacred quest. Complete it for great rewards.',
    inventoryDescription: 'Activate to receive a quest.',
    theme: 'theme-gold',
    imagePath: martinImg,
    framePath: martinFrame,
    consumesOnActivate: true,
  },
  {
    id: 'infinite_money_glitch',
    title: 'Infinite Money Glitch',
    description: 'Gain 1% of your points passively every turn.',
    inventoryDescription: '+1% of score per turn',
    theme: 'theme-gold',
    imagePath: infiniteMoneyGlitchImg,
    framePath: infiniteMoneyGlitchFrame,
  },
]
