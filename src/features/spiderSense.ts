// Spider Sense: each level adds a percentage bonus to points from correct answers.
// Shared by scoring, the question dialog and the scoreboard so they always agree.

/** Bonus as a whole percentage, e.g. level 3 at 0.05/level → 15. */
export function getSpiderSensePercent(level: number, bonusPerLevel: number): number {
  return Math.round(level * bonusPerLevel * 100)
}

/** Extra points Spider Sense adds to a correct answer worth `value`. */
export function getSpiderSenseBonus(value: number, level: number, bonusPerLevel: number): number {
  return Math.round(value * (1 + level * bonusPerLevel)) - value
}
