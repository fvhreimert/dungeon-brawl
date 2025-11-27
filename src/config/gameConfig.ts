export const gameConfig = {
  meta: {
    title: "Dungeon Brawl",
    description: "A retro pixel-art jeopardy game",
  },
  gameplay: {
    categories: ['Arcana', 'Relics', 'Beasts', 'Lore', 'Traps'],
    pointValues: [100, 200, 300, 400, 500],
    maxScoreForMeter: 2000, // Used to calculate the width of the score bar
  },
  players: [
    { name: 'Rogue', score: 1200 },
    { name: 'Mage', score: 900 },
    { name: 'Paladin', score: 700 },
    { name: 'Necro', score: 300 },
  ],
  ui: {
    labels: {
      revealButton: "Reveal Answer",
      correctButton: "Correct",
      wrongButton: "Wrong",
      passButton: "Nobody",
      answerHeader: "THE ANSWER",
      fallbackQuestion: (category: string, value: number) => 
        `Answer the ${category.toLowerCase()} challenge worth ${value} points.`,
      fallbackAnswer: "TBD"
    }
  }
} as const;

export type GameConfig = typeof gameConfig;
