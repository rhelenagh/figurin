# AGENTS.md

## Project

- **Figura** — one-button arcade browser game
- Stack: vanilla HTML/CSS + Three.js r128 (CDN) + Web Audio API
- No build step; served as static files

## Commands

```bash
npx serve .    # starts local server
```

## Architecture

- `index.html` — entry point, loads Three.js from CDN then module scripts
- `style.css` — all UI styling (dark neon theme, screen animations)
- `three-setup.js` — Three.js initialization: scene, camera, renderer, player, ground, stars, responsive helpers
- `obstacles.js` — all obstacle factory functions: dog, spaceship, tomato, water puddle, oil puddle, live wire, drone, magnet, toaster, watermelon, water balloon
- `audio.js` — Web Audio API system: sound effects (jump, score, powerup, death) and background music (chiptune style)
- `game.js` — game loop, state management, input handling, particles, collision detection

## File Responsibilities

### three-setup.js
Exports via `window.gameExport`:
- `scene`, `camera`, `renderer` — Three.js core
- `player`, `playerSprite`, `playerLight` — player group and sprite
- `gameScale` — responsive scale object
- `obstacles` — obstacle array
- `gridHelper`, `stars` — background elements
- `getScaleFactor()` — responsive scale calculation
- `getPlayerBaseX()` — player X position by viewport
- `getObstacleSpawnX()` — spawn position by viewport

### obstacles.js
Exports via `window.obstaclesExport`:
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
- `createObstacle(state)` — factory that randomly selects obstacle type

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

## State Object

```javascript
const state = {
  screen: 'menu' | 'playing' | 'gameover',
  score: 0,
  bestScore: 0,           // from localStorage
  speed: 0.15,
  isJumping: false,
  jumpVelocity: 0,
  gravity: -0.012,
  jumpForce: 0.25,
  difficultyLevel: 1,
  oilSlowTimer: 0,        // slows player on oil hit
  magnetTimer: 0,          // affects gravity on magnet hit
  magnetPolarity: null,    // 'attract' or 'repel'
  // ... powerups, combo, etc.
};
```

## Game States

1. **menu** — title screen with PLAY and HOW TO PLAY buttons
2. **playing** — active game with HUD (score, sound toggle)
3. **gameover** — final score, new best indicator, TRY AGAIN button

## Conventions

- Keep HTML/CSS/JS separate; no bundler
- Three.js loaded via CDN script tag, not npm
- Module loading order: three-setup.js → obstacles.js → audio.js → game.js
- Audio uses raw Web Audio API oscillators (no files)
- All juicy effects (particles, screen shake, glow) are in game.js
- Responsive scaling via `gameScale.factor` multiplied on all sizes
- Portrait vs landscape positions handled by `getPlayerBaseX()` and `getObstacleSpawnX()`