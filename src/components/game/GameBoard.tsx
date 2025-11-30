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
}: GameBoardProps) {
  return (
    <section className="board-shell">
      <div className="category-row">
        {categories.map((category) => (
          <div key={category} className="category-chip">
            {category}
          </div>
        ))}
      </div>

      <div className="question-grid">
        {tiles.map((tile) => (
          <button
            type="button"
            key={tile.id}
            className={`tile question-tile ${
              tile.status === 'done' ? 'tile-claimed' : ''
            } ${
              highlightOpenTiles && tile.status === 'open'
                ? 'tile-madseer-target'
                : ''
            } ${
              highlightedTileId === tile.id ? 'tile-madseer-selected' : ''
            } ${
              frogHighlightId === tile.id ? 'tile-frog-highlight' : ''
            } ${
              frogLandingId === tile.id ? 'tile-frog-landing' : ''
            } ${
              tile.status === 'open' && (tile.multiplier ?? 1) > 1
                ? 'tile-mult-active'
                : ''
            } ${
              tile.status === 'open' && (tile.multiplier ?? 1) > 1
                ? `tile-mult-x${tile.multiplier}`
                : ''
            }`}
            onClick={() => onTileSelect(tile.id)}
            disabled={tile.status === 'done' || boardLocked}
          >
            <span className="value">{tile.value}</span>
            {tile.status === 'open' && (tile.multiplier ?? 1) > 1 && (
              <span className="multiplier-badge">x{tile.multiplier}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
