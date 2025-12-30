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
  /** Short description shown on the card face */
  description: string
  /** Detailed description shown in the hover tooltip */
  detailedDescription: string
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
    description: '+25 pts per turn',
    detailedDescription: 'This little critter has a nose for gold. Passively gain 25 points every turn.',
    theme: 'theme-common',
    imagePath: nifflerImg,
    framePath: nifflerFrame,
  },
  {
    id: 'soul_burst',
    title: 'Soul Burst',
    description: 'Stores 25% of damage taken',
    detailedDescription: 'Absorbs 25% of all non-question damage taken. Activate to unleash the stored damage on a foe and heal yourself for the same amount.',
    theme: 'theme-fel',
    imagePath: soulBurstImg,
    framePath: soulBurstFrame,
  },
  {
    id: 'thieving_rat',
    title: 'Thieving Rat',
    description: 'Steal a random card',
    detailedDescription: 'The rat scurries into a foe\'s bag and returns with a mystery item. Activate to steal a random card from an opponent. Consumed on use.',
    theme: 'theme-dungeon',
    imagePath: thievingRatImg,
    framePath: thievingRatFrame,
    consumesOnActivate: true,
  },
  {
    id: 'cursed_coin',
    title: 'Cursed Coin',
    description: '-50 pts per turn',
    detailedDescription: 'A coin imbued with dark magic. You received 500 points when acquired, but lose 50 points each turn for 10 turns.',
    theme: 'theme-dark',
    imagePath: cursedCoinImg,
    framePath: cursedCoinFrame,
  },
  {
    id: 'tick',
    title: 'Tick',
    description: 'Drains 1% of score per turn',
    detailedDescription: 'A parasitic creature that latches onto your soul. Each turn it drains 1% of your current points.',
    theme: 'theme-red',
    imagePath: tickImg,
    framePath: tickFrame,
  },
  {
    id: 'spiny_shell',
    title: 'Spiny Shell',
    description: 'Hit leader for 20% of their score',
    detailedDescription: 'Hurl this devastating shell at whoever is in first place. Deals damage equal to 20% of the leader\'s current points. Consumed on use.',
    theme: 'theme-blue',
    imagePath: spinyShellImg,
    framePath: spinyShellFrame,
    consumesOnActivate: true,
  },
  {
    id: 'traveling_merchant',
    title: 'Traveling Merchant',
    description: 'Choose 1 of 4 cards',
    detailedDescription: 'A mysterious trader offers you four wares. Activate to view four random cards and choose one to keep. Consumed on use.',
    theme: 'theme-common',
    imagePath: travelingMerchantImg,
    framePath: travelingMerchantFrame,
    consumesOnActivate: true,
  },
  {
    id: 'sheep',
    title: 'Sheep',
    description: 'Baaahhh',
    detailedDescription: 'Just a fluffy sheep. It does nothing... or does it? Feed it to the spider to unlock action upgrades.',
    theme: 'theme-common',
    imagePath: sheepImg,
    framePath: sheepFrame,
  },
  {
    id: 'puppet_master',
    title: 'Puppet Master',
    description: 'Lock foe to one category',
    detailedDescription: 'Dark strings bind your enemy\'s will. Activate to force an opponent to only answer questions from a category of your choice on their next turn. Consumed on use.',
    theme: 'theme-dark',
    imagePath: puppetMasterImg,
    framePath: puppetMasterFrame,
    consumesOnActivate: true,
  },
  {
    id: 'beggar',
    title: 'Beggar',
    description: 'Steals 10 pts from each foe per turn',
    detailedDescription: 'A persistent panhandler who follows everyone around. Each turn, takes 10 points from every other player and gives them to you.',
    theme: 'theme-dungeon',
    imagePath: beggarImg,
    framePath: beggarFrame,
  },
  {
    id: 'roulette',
    title: 'Roulette',
    description: 'Gamble up to 500 pts',
    detailedDescription: 'Stake up to 500 points on a 50/50 gamble. Win and you double your stake. Lose and it\'s gone. Consumed on use.',
    theme: 'theme-gold',
    imagePath: rouletteImg,
    framePath: rouletteFrame,
    consumesOnActivate: true,
  },
  {
    id: 'shovel',
    title: 'Shovel',
    description: 'Treasure Set (1/3)',
    detailedDescription: 'A sturdy shovel for digging. Part of the Treasure Set. Collect all 3 pieces (Shovel, Compass, Treasure Map) to embark on a treasure hunt!',
    theme: 'theme-gold',
    imagePath: shovelImg,
    framePath: shovelFrame,
  },
  {
    id: 'compass',
    title: 'Compass',
    description: 'Treasure Set (2/3)',
    detailedDescription: 'A compass that points toward fortune. Part of the Treasure Set. Collect all 3 pieces (Shovel, Compass, Treasure Map) to embark on a treasure hunt!',
    theme: 'theme-gold',
    imagePath: compassImg,
    framePath: compassFrame,
  },
  {
    id: 'treasure_map',
    title: 'Treasure Map',
    description: 'Treasure Set (3/3)',
    detailedDescription: 'X marks the spot! Part of the Treasure Set. Collect all 3 pieces (Shovel, Compass, Treasure Map) to embark on a treasure hunt!',
    theme: 'theme-gold',
    imagePath: treasureMapImg,
    framePath: treasureMapFrame,
  },
  {
    id: 'glacial_elemental',
    title: 'Glacial Elemental',
    description: 'Freeze a tile or action',
    detailedDescription: 'Command the power of ice. Activate to freeze a tile or a dungeon action until your next turn. Frozen targets cannot be used by anyone. Consumed on use.',
    theme: 'theme-blue',
    imagePath: glacialElementalImg,
    framePath: glacialElementalFrame,
    consumesOnActivate: true,
  },
  {
    id: 'coalition',
    title: 'Coalition',
    description: 'Form an alliance',
    detailedDescription: 'Forge a temporary alliance with another player. While allied, you cannot target each other with harmful effects. Alliance lasts for several turns. Consumed on use.',
    theme: 'theme-gold',
    imagePath: coalitionImg,
    framePath: coalitionFrame,
    consumesOnActivate: true,
  },
  {
    id: 'loot_goblin',
    title: 'Loot Goblin',
    description: 'Steal 200 pts from a foe',
    detailedDescription: 'A greedy goblin does your dirty work. Activate to steal 200 points from a player of your choice. Consumed on use.',
    theme: 'theme-dungeon',
    imagePath: lootGoblinImg,
    framePath: lootGoblinFrame,
    consumesOnActivate: true,
  },
  {
    id: 'isopod',
    title: 'Isopod',
    description: 'Feed to spider',
    detailedDescription: 'A crunchy little crustacean. Seemingly useless, but the spider loves them! Feed to the spider to increase your Spider Sense level and gain bonus rerolls.',
    theme: 'theme-common',
    imagePath: isopodImg,
    framePath: isopodFrame,
  },
  {
    id: 'martin',
    title: 'Martin',
    description: 'Receive a quest',
    detailedDescription: 'Martin the quest-giver bestows upon you a sacred quest. Complete the objective for great rewards including cards, gold, and action upgrades. Consumed on use.',
    theme: 'theme-gold',
    imagePath: martinImg,
    framePath: martinFrame,
    consumesOnActivate: true,
  },
  {
    id: 'infinite_money_glitch',
    title: 'Infinite Money Glitch',
    description: '+1% of score per turn',
    detailedDescription: 'You\'ve discovered an exploit in reality itself. Passively gain 1% of your current points every turn. The richer you are, the richer you get.',
    theme: 'theme-gold',
    imagePath: infiniteMoneyGlitchImg,
    framePath: infiniteMoneyGlitchFrame,
  },
]
