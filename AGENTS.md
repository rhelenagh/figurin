# AGENTS.md

## Project

- **Figura** — one-button arcade browser game
- Stack: vanilla HTML/CSS + Three.js r128 (CDN) + Web Audio API
- No build step; served as static files

## Commands

```bash
python3 -m http.server 3000    # starts local server
```

## Architecture

- `index.html` — entry point, loads Three.js from CDN then module scripts
- `style.css` — all UI styling (dark neon theme, screen animations)
- `three-setup.js` — Three.js initialization: scene, camera, renderer, player, ground, stars, responsive helpers (exports via global `var`/`function`)
- `audio.js` — Web Audio API system: sound effects (jump, score, powerup, death) and background music (chiptune style) (exports via `window.audioExport`)
- `obstacle.js` — all obstacle factory functions: dog, spaceship, tomato, water puddle, oil puddle, live wire, drone, magnet, toaster, watermelon, water balloon, drill/IBM-360 (exports via global `function`)
- `game.js` — game loop, state management, input handling, particles, collision detection, powerups

## File Responsibilities

### three-setup.js
Exports via global `var`/`function`:
- `scene`, `camera`, `renderer` — Three.js core
- `player`, `playerSprite`, `playerLight` — player group and sprite; 3D arms (`leftPivot`/`rightPivot`) on player for jump animation
- `gameScale` — responsive scale object (`{ factor: <number> }`)
- `gridHelper`, `ground`, `groundLine` — ground elements
- `stars` — starfield (100 points)
- `city` — 12-building skyline with emissive windows
- `clouds` — 5 glowing cloud sprites with additive blending, horizontal drift
- `ambientLights` — 3 colored orbiting point lights
- `getScaleFactor()` — responsive scale calculation (portrait/landscape)
- `getPlayerBaseX()` — player X position by viewport
- `getObstacleSpawnX()` — spawn position by viewport
- `createPlayerTexture()` — generates player sprite canvas (glowing neon character)
- `roundRect()` — canvas rounded rectangle helper

### obstacle.js
Exports via global `function`:
- `createDog()` — sprite-based dog (bella.png)
- `createSpaceship()` — metallic cone with wings
- `createTomato()` — red sphere with stem
- `createWaterPuddle()` — blue cylinder with ripple (game over)
- `createOilPuddle()` — dark brown cylinder (slows player 50%)
- `createLiveWire()` — wire with sparking light (toggle hazard)
- `createDrone()` — floating sphere with rotors
- `createMagnet()` — horseshoe magnet (alters gravity: attract/repel)
- `createToaster()` — metallic box with eyes
- `createWatermelon()` — green striped sphere (rolling)
- `createWaterBalloon()` — falling water balloon
- `createDrill()` — sprite-based IBM-360 (ibm-360.png), high obstacle, 5 points, hard difficulty
- `createObstacle()` — factory that randomly selects obstacle type

### audio.js
Exports via `window.audioExport`:
- `playSound(type, soundEnabled)` — plays sound effects
- `startBgm(soundEnabled)` — starts background music
- `stopBgm()` — stops background music
- `updateBgm(soundEnabled, gameScreen)` — updates music each frame
- `resumeAudioContext()` — resumes audio context if suspended

Sound types: `jump`, `score`, `powerup`, `death`

### game.js
- State object with game status, score, difficulty, powerup timers
- Input handling: keyboard (Space), touch, mouse
- Game loop: physics, collision, spawning, scoring
- Particles system, floating text, trail effects
- Collision detection with obstacle-specific effects
- Powerup system (shield, slowmo, multiplier, bonus)
- `obstacles` array — obstacle lifecycle management

## State Object

```javascript
const state = {
  screen: 'menu' | 'playing' | 'gameover',
  score: 0,
  bestScore: 0,           // from localStorage ('figurin-best')
  speed: 0.15,
  baseSpeed: 0.15,
  isJumping: false,
  canDoubleJump: false,
  hasUsedDoubleJump: false,
  jumpVelocity: 0,
  gravity: -0.012,
  jumpForce: 0.25,
  doubleJumpForce: 0.22,
  groundY: 0,
  soundEnabled: true,
  obstacleTimer: 0,
  obstacleInterval: 60,
  difficultyTimer: 0,
  difficultyLevel: 1,
  combo: 0,
  comboTimer: 0,
  scoreMultiplier: 1,
  powerups: [],
  activePowerups: { shield: false, slowmo: false, multiplier: false },
  slowmoTimer: 0,
  multiplierTimer: 0,
  lastTapTime: 0,
  doubleTapBonus: false,
  oilSlowTimer: 0,        // slows player on oil hit
  magnetTimer: 0,          // affects gravity on magnet hit
  magnetPolarity: null,    // 'attract' or 'repel'
};
```

## Game States

1. **menu** — title screen with PLAY and HOW TO PLAY buttons
2. **playing** — active game with HUD (score, sound toggle)
3. **gameover** — final score, new best indicator, TRY AGAIN button

## Conventions

- Keep HTML/CSS/JS separate; no bundler
- Three.js loaded via CDN script tag, not npm
- Module loading order: three-setup.js → audio.js → obstacle.js → game.js
- Audio uses raw Web Audio API oscillators (no files)
- All juicy effects (particles, screen shake, glow) are in game.js
- Responsive scaling via `gameScale.factor` multiplied on all sizes
- Portrait vs landscape positions handled by `getPlayerBaseX()` and `getObstacleSpawnX()`
- three-setup.js and obstacle.js export via global `var`/`function` (no `window.*` wrapper)
- audio.js exports via `window.audioExport` object (method shorthand) to avoid `const` destructuring conflicts in game.js
- `createObstacle()` in obstacle.js accesses `scene`, `obstacles`, `state`, `getObstacleSpawnX` from global scope (resolved at call time)
- Background elements (clouds, ambientLights) animate outside the `state.screen === 'playing'` guard, so they animate continuously on all screens