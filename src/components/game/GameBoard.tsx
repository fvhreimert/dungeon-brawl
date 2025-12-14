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
  idolLockedTileIds?: string[] | null
  idolSurvivorId?: string | null
  puppetLockCategory?: string | null
  freezeSelectMode?: boolean
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
  idolLockedTileIds = null,
  idolSurvivorId = null,
  puppetLockCategory = null,
  freezeSelectMode = false,
}: GameBoardProps) {
  const categoryCount = categories.length

  return (
    <section 
      className="board-shell"
      style={{ '--category-count': categoryCount } as React.CSSProperties}
    >
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
          const isCrumbled = tile.modifiers?.isCrumbled || idolLockedTileIds?.includes(tile.id)
          const isSurvivor = idolSurvivorId && tile.id === idolSurvivorId
          const frozenInfo = tile.modifiers?.frozen
          const isFrozen = !!frozenInfo

          const isPuppetBlocked =
            puppetLockCategory &&
            tile.status === 'open' &&
            tile.category !== puppetLockCategory

          const isEffectivelyDisabled = 
            boardLocked || 
            tile.status === 'done' || 
            !!isCrumbled || 
            (!!idolSurvivorId && !isSurvivor && !highlightOpenTiles) ||
            !!isPuppetBlocked ||
            isFrozen

          const showFreezeTarget = freezeSelectMode && tile.status === 'open' && !isCrumbled && !isFrozen

          return (
            <button
              type="button"
              key={tile.id}
              className={`tile question-tile ${
                tile.status === 'done' ? 'tile-claimed' : ''
              } ${
                // Frozen tiles have their own strong visual
                isFrozen && !isCrumbled ? 'tile-frozen' : ''
              } ${
                // Order of classes is important for CSS cascade and override.
                // Crumbled tiles should generally visually override everything.
                isCrumbled ? 'tile-crumbled' : ''
              } ${
                // Idol survivor should be next, can be overridden by Mad Seer
                // But if it is crumbled (should not happen logic wise for survivor, but safe guard), crumbled wins.
                isSurvivor && !isCrumbled ? 'tile-idol-survivor' : ''
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
                tile.status === 'open' && (tile.multiplier ?? 1) > 1 && !isCrumbled && !isFrozen
                  ? 'tile-mult-active'
                  : ''
              } ${
                tile.status === 'open' && (tile.multiplier ?? 1) > 1 && !isCrumbled && !isFrozen
                  ? `tile-mult-x${tile.multiplier}`
                  : ''
              } ${
                // Freeze target highlights
                showFreezeTarget
                  ? 'tile-freeze-target'
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
              {tile.status === 'open' && (tile.multiplier ?? 1) > 1 && !isCrumbled && !isFrozen && (
                <>
                  <span className="multiplier-badge">x{tile.multiplier}</span>
                  <div className={`frog-particle-overlay frog-particles-x${tile.multiplier}`}>
                    <div className="frog-particle" />
                    <div className="frog-particle" />
                    <div className="frog-particle" />
                    <div className="frog-particle" />
                    <div className="frog-particle" />
                    <div className="frog-particle" />
                  </div>
                </>
              )}
              {isSurvivor && !isCrumbled && (
                <div className="idol-particle-overlay">
                  <div className="idol-particle" />
                  <div className="idol-particle" />
                  <div className="idol-particle" />
                  <div className="idol-particle" />
                  <div className="idol-particle" />
                  <div className="idol-particle" />
                </div>
              )}
              {isFrozen && !isCrumbled && (
                <div className="tile-frozen-overlay">
                  <div className="ice-particle" />
                  <div className="ice-particle" />
                  <div className="ice-particle" />
                  <div className="ice-particle" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}