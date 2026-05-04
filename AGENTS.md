# AGENTS.md

## Project

- **Figura** — one-button arcade browser game
- Stack: vanilla HTML/CSS + Three.js r128 (CDN) + Web Audio API
- No build step; served as static files

## Commands

```bash
pnpm dev    # starts serve on http://localhost:3000
```

## Architecture

- `index.html` — entry point, loads Three.js from CDN then `game.js`
- `style.css` — all UI styling (dark neon theme, screen animations)
- `game.js` — all game logic: Three.js scene, physics, obstacles, particles, audio, state management
- State is a single `state` object at top of `game.js`
- Game states: `menu` → `playing` → `gameover`
- Best score persisted in `localStorage` key `figurin-best`

## Conventions

- Keep HTML/CSS/JS separate; no bundler
- Three.js loaded via CDN script tag, not npm
- No test suite exists
- Audio uses raw Web Audio API oscillators (no files)
- All juicy effects (particles, screen shake, glow) are in `game.js`
