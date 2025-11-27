import type { Tile } from '@/types/game'

type GameBoardProps = {
  categories: string[]
  tiles: Tile[]
  onTileSelect: (id: string) => void
}

export function GameBoard({ categories, tiles, onTileSelect }: GameBoardProps) {
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
            }`}
            onClick={() => onTileSelect(tile.id)}
            disabled={tile.status === 'done'}
          >
            <span className="value">{tile.value}</span>
            {tile.status === 'done' && <span className="claimed">Taken</span>}
          </button>
        ))}
      </div>
    </section>
  )
}
