import './App.css'

const categories = ['Arcana', 'Relics', 'Beasts', 'Lore', 'Traps']
const pointValues = [100, 200, 300, 400, 500]
const players = [
  { name: 'Rogue', score: 1200 },
  { name: 'Mage', score: 900 },
  { name: 'Paladin', score: 700 },
  { name: 'Necro', score: 300 },
]

function App() {
  return (
    <div className="app">
      <div className="dungeon-frame">
        <header className="title-wrap">
          <h1 className="title">Dungeon Brawl</h1>
        </header>

        <section className="board-shell">
          <div className="category-row">
            {categories.map((category) => (
              <div key={category} className="category-chip">
                {category}
              </div>
            ))}
          </div>

          <div className="question-grid">
            {pointValues.map((value) =>
              categories.map((category) => (
                <div
                  key={`${category}-${value}`}
                  className="tile question-tile"
                >
                  <span className="value">{value}</span>
                  <span className="hint">Awaiting question</span>
                </div>
              )),
            )}
          </div>
        </section>

        <section className="scoreboard">
          {players.map((player) => (
            <div key={player.name} className="score-card">
              <div className="player-name">
                <span aria-hidden>☠</span>
                {player.name}
              </div>
              <div className="player-score">{player.score}</div>
              <div className="score-meter">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.min((player.score / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

export default App
