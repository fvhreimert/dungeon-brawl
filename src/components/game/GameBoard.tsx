import type { Tile } from '@/types/game'
import './GameBoard.css'

type GameBoardProps = {
  categories: readonly string[]
  tiles: Tile[]
  onTileSelect: (id: string) => void
  highlightOpenTiles?: boolean
  highlightedTileId?: string | null
  boardLocked?: boolean
  frogHighlightId?: string | null
  frogLandingId?: string | null
  diceLockedTileIds?: string[] | null
  diceSurvivorId?: string | null
  puppetLockCategory?: string | null
}

export function GameBoard({
  categories,
  tiles,
  onTileSelect,
  highlightOpenTiles = false,
  highlightedTileId = null,
  boardLocked = false,
  frogHighlightId = null,
  frogLandingId = null,
  diceLockedTileIds = null,
  diceSurvivorId = null,
  puppetLockCategory = null,
}: GameBoardProps) {
  return (
    <section className="board-shell">
      <div className="category-row">
        {categories.map((category) => (
          <div
            key={category}
            className={`category-chip ${
              puppetLockCategory === category ? 'category-chip-puppet' : ''
            }`}
          >
            {category}
          </div>
        ))}
      </div>

      <div className="question-grid">
        {tiles.map((tile) => {
          // Use persisted state OR animation state
          const isCrumbled = tile.modifiers?.isCrumbled || diceLockedTileIds?.includes(tile.id)
          const isSurvivor = diceSurvivorId && tile.id === diceSurvivorId

          const isPuppetBlocked =
            puppetLockCategory &&
            tile.status === 'open' &&
            tile.category !== puppetLockCategory

          const isEffectivelyDisabled = 
            boardLocked || 
            tile.status === 'done' || 
            !!isCrumbled || 
            (!!diceSurvivorId && !isSurvivor && !highlightOpenTiles) ||
            !!isPuppetBlocked

          return (
            <button
              type="button"
              key={tile.id}
              className={`tile question-tile ${
                tile.status === 'done' ? 'tile-claimed' : ''
              } ${
                // Order of classes is important for CSS cascade and override.
                // Crumbled tiles should generally visually override everything.
                isCrumbled ? 'tile-crumbled' : ''
              } ${
                // Dice survivor should be next, can be overridden by Mad Seer
                // But if it is crumbled (should not happen logic wise for survivor, but safe guard), crumbled wins.
                isSurvivor && !isCrumbled ? 'tile-dice-survivor' : ''
              } ${
                // Frog highlights
                frogHighlightId === tile.id ? 'tile-frog-highlight' : ''
              } ${
                frogLandingId === tile.id ? 'tile-frog-landing' : ''
              } ${
                puppetLockCategory &&
                tile.status === 'open' &&
                tile.category === puppetLockCategory
                  ? 'tile-puppet-target'
                  : ''
              } ${
                puppetLockCategory &&
                tile.status === 'open' &&
                tile.category !== puppetLockCategory
                  ? 'tile-puppet-blocked'
                  : ''
              } ${
                // Multiplier highlights
                // Prevent multiplier classes if crumbled to avoid style conflicts (e.g. animation, box-shadow)
                tile.status === 'open' && (tile.multiplier ?? 1) > 1 && !isCrumbled
                  ? 'tile-mult-active'
                  : ''
              } ${
                tile.status === 'open' && (tile.multiplier ?? 1) > 1 && !isCrumbled
                  ? `tile-mult-x${tile.multiplier}`
                  : ''
              } ${
                // Mad Seer highlights should come last to override others
                highlightOpenTiles && tile.status === 'open' && !isCrumbled
                  ? 'tile-madseer-target'
                  : ''
              } ${
                highlightedTileId === tile.id ? 'tile-madseer-selected' : ''
              }`}
              onClick={() => onTileSelect(tile.id)}
              disabled={isEffectivelyDisabled}
            >
              <span className="value">{tile.value}</span>
              {tile.status === 'open' && (tile.multiplier ?? 1) > 1 && !isCrumbled && (
                <span className="multiplier-badge">x{tile.multiplier}</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
