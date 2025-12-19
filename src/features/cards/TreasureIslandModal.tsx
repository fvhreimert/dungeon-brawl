import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import treasureIslandImg from '@/assets/images/ui/treasure_island.png'
import treasureCrossImg from '@/assets/images/ui/treasure_cross.png'
import pirateKingsCurseImg from '@/assets/images/ui/pirate_kings_curse.png'
import crownImg from '@/assets/images/ui/treasure/crown.png'
import goldImg from '@/assets/images/ui/treasure/gold.png'
import goldBarsImg from '@/assets/images/ui/treasure/gold_bars.png'
import jewelleryImg from '@/assets/images/ui/treasure/jevellery.png'
import ringImg from '@/assets/images/ui/treasure/ring.png'
import scepterImg from '@/assets/images/ui/treasure/scepter.png'
import scrollImg from '@/assets/images/ui/treasure/scroll.png'
import vesselImg from '@/assets/images/ui/treasure/vessel2.png'
import chest1Img from '@/assets/images/ui/treasure/Chest1_open.png'
import chest3Img from '@/assets/images/ui/treasure/Chest3_open.png'
import chest4Img from '@/assets/images/ui/treasure/Chest4_open.png'
import chest5Img from '@/assets/images/ui/treasure/Chest5_open.png'
import digTickSound from '@/assets/sounds/cards/treasure_set/dig.wav'
import treasureFoundSound from '@/assets/sounds/cards/treasure_set/treasure_found.mp3'
import pirateKingsCurseSound from '@/assets/sounds/cards/treasure_set/pirate_kings_curse.mp3'
import './TreasureIslandModal.css'

type TreasureRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'prismatic'

type TreasureItem = {
  id: string
  img: string
  name: string
  rarity: TreasureRarity
  value: number
}

const TREASURE_ITEMS: TreasureItem[] = [
  // Common (50 gold) - gray
  { id: 'ring', img: ringImg, name: 'Ring', rarity: 'common', value: 50 },
  { id: 'scepter', img: scepterImg, name: 'Scepter', rarity: 'common', value: 50 },
  { id: 'scroll', img: scrollImg, name: 'Scroll', rarity: 'common', value: 50 },
  // Rare (100 gold) - blue
  { id: 'gold', img: goldImg, name: 'Gold Coins', rarity: 'rare', value: 100 },
  { id: 'gold_bars', img: goldBarsImg, name: 'Gold Bars', rarity: 'rare', value: 100 },
  // Epic (150 gold) - purple
  { id: 'vessel', img: vesselImg, name: 'Vessel', rarity: 'epic', value: 150 },
  { id: 'jewellery', img: jewelleryImg, name: 'Jewellery', rarity: 'epic', value: 150 },
  // Legendary (300 gold) - golden orange
  { id: 'chest1', img: chest1Img, name: 'Treasure Chest', rarity: 'legendary', value: 300 },
  { id: 'chest3', img: chest3Img, name: 'Royal Chest', rarity: 'legendary', value: 300 },
  { id: 'chest4', img: chest4Img, name: 'Ancient Chest', rarity: 'legendary', value: 300 },
  { id: 'chest5', img: chest5Img, name: 'Golden Chest', rarity: 'legendary', value: 300 },
  // Prismatic (500 gold) - prismatic
  { id: 'crown', img: crownImg, name: 'Crown', rarity: 'prismatic', value: 500 },
]

const INITIAL_CURSE_CHANCE = 10

type GamePhase = 'ready' | 'digging' | 'treasure' | 'cursed' | 'collecting'

type DugTreasure = TreasureItem

type TreasureIslandModalProps = {
  onComplete: (goldEarned: number) => void
  onCancel: () => void
}

function generateRandomCrossPosition(): { x: number; y: number } {
  const x = 25 + Math.random() * 50
  const y = 25 + Math.random() * 50
  return { x, y }
}

function playSound(src: string, volume = 0.5) {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => {})
}

export function TreasureIslandModal({ onComplete, onCancel }: TreasureIslandModalProps) {
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [dugTreasures, setDugTreasures] = useState<DugTreasure[]>([])
  const [crossPosition, setCrossPosition] = useState(() => generateRandomCrossPosition())
  const [curseChance, setCurseChance] = useState(INITIAL_CURSE_CHANCE)
  const [lastFoundValue, setLastFoundValue] = useState(0)
  const [throbCount, setThrobCount] = useState(0)

  const goldValue = useMemo(() => dugTreasures.reduce((sum, t) => sum + t.value, 0), [dugTreasures])

  // Get available treasures (not yet found)
  const availableTreasures = useMemo(() => {
    const foundIds = new Set(dugTreasures.map((t) => t.id))
    return TREASURE_ITEMS.filter((t) => !foundIds.has(t.id))
  }, [dugTreasures])

  // Check if all treasures found
  const allTreasuresFound = availableTreasures.length === 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'ready' && dugTreasures.length === 0) {
        onCancel()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel, phase, dugTreasures.length])

  const performDig = useCallback(() => {
    const isCursed = Math.random() * 100 < curseChance

    if (isCursed) {
      playSound(pirateKingsCurseSound, 0.6)
      setPhase('cursed')
    } else {
      // Pick from available treasures only
      const randomTreasure = availableTreasures[Math.floor(Math.random() * availableTreasures.length)]

      playSound(treasureFoundSound, 0.5)
      setDugTreasures((prev) => [...prev, randomTreasure])
      setLastFoundValue(randomTreasure.value)
      // Curse increases by (100 - currentCurse) * 0.1
      setCurseChance((prev) => Math.min(95, prev + (100 - prev) * 0.1))

      setPhase('treasure')

      // Move cross to new position after a delay, then show ready state
      setTimeout(() => {
        setCrossPosition(generateRandomCrossPosition())
        setPhase('ready')
      }, 800)
    }
  }, [curseChance, availableTreasures])

  const handleDig = () => {
    if (phase !== 'ready' || allTreasuresFound) return

    setPhase('digging')
    setThrobCount(0)

    // Play 3 throbs with tick sound - 1 second between each
    const throbInterval = 1000
    let count = 0

    const doThrob = () => {
      playSound(digTickSound, 0.4)
      setThrobCount((prev) => prev + 1)
      count++

      if (count < 3) {
        setTimeout(doThrob, throbInterval)
      } else {
        // After 3 throbs, reveal result
        setTimeout(() => {
          setThrobCount(0)
          performDig()
        }, 300)
      }
    }

    doThrob()
  }

  const handleCollect = () => {
    setPhase('collecting')
    setTimeout(() => {
      onComplete(goldValue)
    }, 400)
  }

  const handleAcceptCurse = () => {
    onComplete(0)
  }

  // Show dig cross only if not cursed, not collecting, and treasures remain
  const showDigCross = phase !== 'cursed' && phase !== 'collecting' && !allTreasuresFound

  return (
    <div className="treasure-island-backdrop">
      <div className="treasure-island-modal">
        {/* Decorative corner anchors */}
        <div className="corner-decor top-left" />
        <div className="corner-decor top-right" />
        <div className="corner-decor bottom-left" />
        <div className="corner-decor bottom-right" />

        <div className="treasure-island-header">
          <div className="treasure-island-title">Treasure Island</div>
          <div className="treasure-island-subtitle">Dig for riches... but beware the curse!</div>
        </div>

        {/* Main island area */}
        <div className="island-section">
          <div className="island-with-meter">
            <div className={`island-container ${phase === 'cursed' ? 'cursed' : ''}`}>
              <img src={treasureIslandImg} alt="Treasure Island" className="island-image" />

              {/* Dig cross */}
              {showDigCross && (
                <button
                  className={`dig-cross ${phase === 'digging' ? 'digging' : ''} ${phase === 'treasure' ? 'found' : ''}`}
                  style={{
                    left: `${crossPosition.x}%`,
                    top: `${crossPosition.y}%`,
                  }}
                  onClick={handleDig}
                  disabled={phase !== 'ready'}
                >
                  <img 
                    src={treasureCrossImg} 
                    alt="Dig here" 
                    key={throbCount}
                    className={throbCount > 0 ? 'throbbing' : ''}
                  />
                </button>
              )}

              {/* Curse overlay - positioned above island so it keeps its colors */}
              {phase === 'cursed' && (
                <div className="curse-overlay">
                  <div className="curse-vignette" />
                </div>
              )}
            </div>

            {/* Pirate King's Curse image - outside the filtered container */}
            {phase === 'cursed' && (
              <div className="curse-image-container">
                <img src={pirateKingsCurseImg} alt="Pirate King's Curse" className="curse-image" />
              </div>
            )}

            {/* Curse meter directly attached to island */}
            <div className="curse-progress-8bit">
              <div className="curse-progress-track">
                <div 
                  className="curse-progress-fill" 
                  style={{ width: `${curseChance}%` }}
                />
              </div>
              <div className="curse-progress-border" />
            </div>
            <div className="curse-meter-label">
              Curse Risk: <span className="curse-percent">{Math.round(curseChance)}%</span>
            </div>
          </div>

          {/* Status text */}
          <div className="treasure-status">
            {phase === 'ready' && allTreasuresFound && (
              <span className="status-treasure">All treasures found! Collect your riches!</span>
            )}
            {phase === 'digging' && <span className="status-digging">Digging...</span>}
            {phase === 'treasure' && <span className="status-treasure">Treasure found! +{lastFoundValue} Gold</span>}
            {phase === 'cursed' && (
              <span className="status-cursed">The Pirate King's Curse! All treasure lost!</span>
            )}
          </div>
        </div>

        {/* Bottom: Treasure chest area */}
        <div className={`treasure-chest-area ${phase === 'cursed' ? 'cursed' : ''}`}>
          <div className="chest-header">
            <span className="chest-label">Treasure Hoard</span>
            <span className="chest-gold-value">{phase === 'cursed' ? 0 : goldValue} Gold</span>
          </div>
          <div className="chest-contents">
            {dugTreasures.length === 0 ? (
              <div className="chest-empty">Dig to find treasure...</div>
            ) : (
              dugTreasures.map((treasure) => (
                <div key={treasure.id} className={`chest-item rarity-${treasure.rarity}`}>
                  <img src={treasure.img} alt={treasure.name} />
                  <span className="item-value">+{treasure.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="treasure-island-actions">
          {phase === 'cursed' ? (
            <RetroButton
              font="retro"
              variant="destructive"
              className="dialog-button-8bit curse-accept-btn"
              onClick={handleAcceptCurse}
            >
              Accept Fate
            </RetroButton>
          ) : (
            dugTreasures.length > 0 &&
            (phase === 'ready' || allTreasuresFound) && (
              <RetroButton
                font="retro"
                variant="default"
                className="dialog-button-8bit collect-btn"
                onClick={handleCollect}
              >
                Collect {goldValue} Gold
              </RetroButton>
            )
          )}
        </div>
      </div>
    </div>
  )
}
