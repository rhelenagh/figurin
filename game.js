// Game state
const state = {
  screen: 'menu',
  score: 0,
  bestScore: parseInt(localStorage.getItem('figurin-best') || '0'),
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
  obstacleInterval: 100,
  difficultyTimer: 0,
  difficultyLevel: 1,
  combo: 0,
  comboTimer: 0,
  scoreMultiplier: 1,
  powerups: [],
  activePowerups: {
    shield: false,
    slowmo: false,
    multiplier: false,
  },
  slowmoTimer: 0,
  multiplierTimer: 0,
  lastTapTime: 0,
  doubleTapBonus: false,
  oilSlowTimer: 0,
  magnetTimer: 0,
  magnetPolarity: null,
};

const { playSound, startBgm, stopBgm, updateBgm, resumeAudioContext } = window.audioExport;


const obstacles = [];

// Delta time clock for FPS-independent physics
const clock = new THREE.Clock();


// Powerup types
const powerupTypes = ['shield', 'slowmo', 'multiplier', 'bonus'];

function createPowerup() {
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  const group = new THREE.Group();
  group.userData.type = 'powerup';
  group.userData.powerupType = type;
  
  let color, emissiveColor, outerGeom, innerGeom;
  switch (type) {
    case 'shield':
      color = 0x00ffff;
      emissiveColor = 0x00ffff;
      outerGeom = new THREE.IcosahedronGeometry(0.25, 0);
      innerGeom = new THREE.IcosahedronGeometry(0.15, 0);
      break;
    case 'slowmo':
      color = 0x9966ff;
      emissiveColor = 0x9966ff;
      outerGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6);
      innerGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6);
      break;
    case 'multiplier':
      color = 0xffaa00;
      emissiveColor = 0xffaa00;
      outerGeom = new THREE.TorusGeometry(0.2, 0.06, 8, 12);
      innerGeom = new THREE.TorusGeometry(0.13, 0.04, 8, 12);
      break;
    case 'bonus':
      color = 0x00ff66;
      emissiveColor = 0x00ff66;
      outerGeom = new THREE.OctahedronGeometry(0.25, 0);
      innerGeom = new THREE.OctahedronGeometry(0.15, 0);
      break;
  }
  
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: emissiveColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = new THREE.Mesh(outerGeom, mat);
  group.add(mesh);
  
  // Inner glow
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
  });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  group.add(innerMesh);
  
  group.position.set(12, 0.6 + Math.random() * 0.8, 0);
  group.userData.rotationSpeed = 0.05 + Math.random() * 0.03;
  scene.add(group);
  state.powerups.push(group);
}

function applyPowerup(type) {
  switch (type) {
    case 'shield':
      state.activePowerups.shield = true;
      playSound('powerup');
      spawnParticles(player.position.clone(), 0x00ffff, 15);
      triggerShake(5);
      break;
    case 'slowmo':
      state.activePowerups.slowmo = true;
      state.slowmoTimer = 180; // 3 seconds at 60fps
      playSound('powerup');
      spawnParticles(player.position.clone(), 0x9966ff, 15);
      break;
    case 'multiplier':
      state.activePowerups.multiplier = true;
      state.multiplierTimer = 180;
      state.scoreMultiplier = 2;
      playSound('powerup');
      spawnParticles(player.position.clone(), 0xffaa00, 15);
      break;
    case 'bonus':
      state.score += 10;
      updateScoreDisplay(true);
      playSound('score');
      spawnParticles(player.position.clone(), 0x00ff66, 20);
      triggerShake(3);
      break;
  }
  
  // Visual feedback on HUD
  const hud = document.getElementById('hud');
  if (hud) {
    const existing = document.getElementById(`powerup-${type}`);
    if (existing) {
      existing.remove();
    }
    const indicator = document.createElement('div');
    indicator.id = `powerup-${type}`;
    indicator.className = 'powerup-indicator';
    indicator.textContent = type === 'multiplier' ? '2X' : type.toUpperCase();
    hud.appendChild(indicator);
  }
}

function updatePowerups() {
  var time = Date.now();
  // Powerup rotation and movement
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    p.rotation.y += p.userData.rotationSpeed * timeScale;
    p.rotation.x += Math.sin(time * 0.003 + i) * 0.002 * timeScale;
    p.position.x -= state.speed * timeScale;
    
    // Wave trajectory
    p.position.y = (p.userData.baseY || p.position.y) + Math.sin(time * 0.005 + i * 2) * 0.15;
    if (!p.userData.baseY) p.userData.baseY = p.position.y;
    p.position.z = Math.sin(time * 0.004 + i) * 0.2;
    
    // Pulsating glow
    var pulse = 0.6 + Math.sin(time * 0.006 + i) * 0.4;
    if (p.children[0] && p.children[0].material) {
      p.children[0].material.emissiveIntensity = pulse;
    }
    if (p.children[1] && p.children[1].material) {
      p.children[1].material.opacity = 0.4 + Math.sin(time * 0.008 + i) * 0.3;
    }
    
    // Collision with player
    const dx = Math.abs(p.position.x - player.position.x);
    const dy = Math.abs(p.position.y - player.position.y);
    if (dx < 0.4 && dy < 0.4) {
      applyPowerup(p.userData.powerupType);
      scene.remove(p);
      state.powerups.splice(i, 1);
      continue;
    }
    
    // Remove if off screen
    if (p.position.x < -12) {
      scene.remove(p);
      state.powerups.splice(i, 1);
    }
  }
  
  // Powerup timers
  if (state.slowmoTimer > 0) {
    state.slowmoTimer--;
    if (state.slowmoTimer === 0) {
      state.activePowerups.slowmo = false;
      const indicator = document.getElementById('powerup-slowmo');
      if (indicator) indicator.remove();
    }
  }
  
  if (state.multiplierTimer > 0) {
    state.multiplierTimer--;
    if (state.multiplierTimer === 0) {
      state.activePowerups.multiplier = false;
      state.scoreMultiplier = 1;
      const indicator = document.getElementById('powerup-multiplier');
      if (indicator) indicator.remove();
    }
  }
  
  // Shield visual
  if (player.userData.sprite) {
    if (state.activePowerups.shield) {
      player.userData.sprite.material.opacity = 0.6 + Math.sin(time * 0.01) * 0.2;
      if (player.userData.shieldShell) {
        player.userData.shieldShell.visible = true;
        player.userData.shieldShell.material.opacity = 0.1 + Math.sin(time * 0.008) * 0.05;
        player.userData.shieldShell.rotation.y += 0.02;
        player.userData.shieldShell.rotation.x += 0.01;
      }
    } else {
      player.userData.sprite.material.opacity = 1;
      if (player.userData.shieldShell) player.userData.shieldShell.visible = false;
    }
  }
}

// Particles
const particles = [];

var particleGeoms = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.SphereGeometry(0.5, 4, 4),
  new THREE.TetrahedronGeometry(0.6, 0),
];

function spawnParticles(position, color, count = 10, speedMul = 1) {
  for (let i = 0; i < count; i++) {
    const g = particleGeoms[i % 3].clone();
    const s = (0.04 + Math.random() * 0.08) * gameScale.factor;
    g.scale(s, s, s);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const particle = new THREE.Mesh(g, material);
    particle.position.copy(position);
    particle.position.x += (Math.random() - 0.5) * 0.1;
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.25 * speedMul,
      Math.random() * 0.25 * speedMul,
      (Math.random() - 0.5) * 0.25 * speedMul
    );
    particle.life = 0.8 + Math.random() * 0.4;
    particle.decay = 0.015 + Math.random() * 0.02;
    particle.rotationSpeed = (Math.random() - 0.5) * 0.1;
    scene.add(particle);
    particles.push(particle);
  }
  // Sparkle sub-particles (tiny white dots)
  for (let i = 0; i < count / 2; i++) {
    const g = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const p = new THREE.Mesh(g, m);
    p.position.copy(position);
    p.position.x += (Math.random() - 0.5) * 0.2;
    p.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.35 * speedMul,
      Math.random() * 0.35 * speedMul,
      (Math.random() - 0.5) * 0.2 * speedMul
    );
    p.life = 0.4;
    p.decay = 0.04;
    p.rotationSpeed = 0;
    scene.add(p);
    particles.push(p);
  }
}

function spawnScoreParticles(position, color, count = 15) {
  // Ring burst
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.15 + Math.random() * 0.1;
    const g = particleGeoms[i % 3].clone();
    const s = (0.03 + Math.random() * 0.06) * gameScale.factor;
    g.scale(s, s, s);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const p = new THREE.Mesh(g, m);
    p.position.copy(position);
    p.velocity = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, (Math.random() - 0.5) * 0.1);
    p.life = 0.6 + Math.random() * 0.3;
    p.decay = 0.02;
    p.rotationSpeed = (Math.random() - 0.5) * 0.15;
    scene.add(p);
    particles.push(p);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.velocity);
    p.velocity.y -= 0.005;
    p.life -= p.decay;
    p.material.opacity = Math.max(0, p.life);
    p.scale.multiplyScalar(0.97);
    if (p.rotationSpeed) p.rotation.x += p.rotationSpeed;

    if (p.life <= 0) {
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      particles.splice(i, 1);
    }
  }
}

// Trail particles (behind player)
let trailTimer = 0;
function spawnTrail() {
  if (trailTimer++ % 2 === 0) {
    const count = state.isJumping ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const color = j === 0 ? 0x00ffcc : (state.isJumping ? 0xff00ff : 0x44ffaa);
      const size = 0.03 + Math.random() * 0.03;
      const geom = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
      });
      const particle = new THREE.Mesh(geom, mat);
      particle.position.set(
        player.position.x - 0.3 - Math.random() * 0.2,
        player.position.y + (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      );
      particle.velocity = new THREE.Vector3(-0.03 - Math.random() * 0.03, (Math.random() - 0.5) * 0.01, 0);
      particle.life = 0.4 + Math.random() * 0.3;
      particle.decay = 0.015 + Math.random() * 0.01;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.08;
      scene.add(particle);
      particles.push(particle);
    }
  }
}

// Floating neon text system
const floatingTexts = [];

function spawnFloatingText(text, position, color = 0xff00ff) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;
  
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Neon glow effect
  ctx.shadowColor = '#' + color.toString(16).padStart(6, '0');
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.fillText(text, 256, 64);
  
  // Brighter core
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 256, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });
  
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2, 0.5, 1);
  sprite.position.copy(position);
  sprite.position.y += 0.8;
  
  sprite.userData.velocity = new THREE.Vector3(0, 0.04, 0);
  sprite.userData.life = 1;
  sprite.userData.decay = 0.015;
  
  scene.add(sprite);
  floatingTexts.push(sprite);
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.position.add(ft.userData.velocity);
    ft.userData.life -= ft.userData.decay;
    ft.material.opacity = ft.userData.life;
    
    if (ft.userData.life <= 0) {
      scene.remove(ft);
      ft.material.map.dispose();
      ft.material.dispose();
      floatingTexts.splice(i, 1);
    }
  }
}

// Screen shake
let shakeIntensity = 0;

function triggerShake(intensity = 8) {
  shakeIntensity = intensity;
}

function updateCameraShake() {
  if (shakeIntensity > 0) {
    camera.position.x = (Math.random() - 0.5) * shakeIntensity * 0.01;
    camera.position.y = 3 + (Math.random() - 0.5) * shakeIntensity * 0.01;
    shakeIntensity *= 0.85;
    if (shakeIntensity < 0.5) {
      shakeIntensity = 0;
      camera.position.set(0, 3, 8);
    }
  }
}



// Game functions
function jump() {
  if (state.screen !== 'playing') return;
  
  // Double tap detection
  const now = Date.now();
  if (now - state.lastTapTime < 300) {
    state.doubleTapBonus = true;
  }
  state.lastTapTime = now;

  state.jumpHeld = true;
  
  if (!state.isJumping) {
    // First jump
    state.isJumping = true;
    state.canDoubleJump = true;
    state.hasUsedDoubleJump = false;
    state.jumpVelocity = state.jumpForce;
    playSound('jump');
    spawnParticles(player.position.clone(), 0x00ffcc, 5);
  } else if (state.canDoubleJump && !state.hasUsedDoubleJump) {
    // Double jump
    state.hasUsedDoubleJump = true;
    state.jumpVelocity = state.doubleJumpForce;
    playSound('jump');
    spawnParticles(player.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xff00ff, 12, 1.5);
    spawnScoreParticles(player.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xff00ff, 10);
    triggerShake(4);
    
    // Visual spin effect
    if (player.userData.sprite) {
      const spinScale = 1.2 * gameScale.factor;
      player.userData.sprite.scale.set(spinScale, spinScale, spinScale);
    }
  } else {
    // In air, can't jump — buffer it
    state.jumpBufferTimer = 8;
  }
}

function resetGame() {
  state.score = 0;
  state.speed = state.baseSpeed;
  state.isJumping = false;
  state.canDoubleJump = false;
  state.hasUsedDoubleJump = false;
  state.jumpVelocity = 0;
  state.obstacleTimer = 0;
  state.difficultyTimer = 0;
  state.difficultyLevel = 1;
  state.combo = 0;
  state.comboTimer = 0;
  state.scoreMultiplier = 1;
  state.activePowerups = { shield: false, slowmo: false, multiplier: false };
  state.slowmoTimer = 0;
  state.multiplierTimer = 0;
  player.position.y = state.groundY;

  // Remove obstacles
  obstacles.forEach(o => scene.remove(o));
  obstacles.length = 0;
  
  // Remove powerups
  state.powerups.forEach(p => scene.remove(p));
  state.powerups = [];

  // Remove particles
  particles.forEach(p => {
    scene.remove(p);
    p.geometry.dispose();
    p.material.dispose();
  });
  particles.length = 0;

  camera.position.set(0, 3, 8);
  shakeIntensity = 0;
  
  // Remove powerup indicators
  document.querySelectorAll('.powerup-indicator').forEach(el => el.remove());

  // Reset effect timers
  state.oilSlowTimer = 0;
  state.magnetTimer = 0;
  state.magnetPolarity = null;
  state.gravity = -0.012;
  state.jumpForce = 0.25;

  // Reset aura visual
  if (player.userData.aura) player.userData.aura.material.opacity = 0;
  if (player.userData.sprite) player.userData.sprite.material.opacity = 1;

  updateScoreDisplay();
}

function startGame() {
  resetGame();
  state.screen = 'playing';
  showScreen('hud');
  resumeAudioContext();
  startBgm();
}

function gameOver() {
  state.screen = 'gameover';
  playSound('death');
  triggerShake(12);
  spawnParticles(player.position.clone(), 0xff4444, 20);
  stopBgm();

  const isNewBest = state.score > state.bestScore;
  if (isNewBest) {
    state.bestScore = state.score;
    localStorage.setItem('figurin-best', state.bestScore.toString());
  }

  setTimeout(() => {
    showScreen('gameover');
    document.getElementById('final-score').textContent = `Score: ${state.score}`;
    document.getElementById('new-best').classList.toggle('hidden', !isNewBest);
    document.getElementById('best-score-display').textContent = `Best: ${state.bestScore}`;
  }, 500);
}

function updateScoreDisplay(isBonus = false) {
  const display = document.getElementById('score-display');
  display.textContent = state.score;
  
  if (isBonus || state.combo > 2) {
    display.style.transform = 'scale(1.3)';
    display.style.color = state.combo > 5 ? '#ff00ff' : '#ffaa00';
    setTimeout(() => {
      display.style.transform = 'scale(1)';
      display.style.color = '';
    }, 150);
  }
}

function showScreen(screenName) {
  const screens = ['menu-screen', 'instructions-screen', 'gameover-screen'];
  screens.forEach(s => {
    document.getElementById(s).classList.toggle('hidden', true);
  });

  if (screenName === 'hud') {
    document.getElementById('hud').classList.remove('hidden');
  } else if (screenName === 'gameover') {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
  } else {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById(screenName).classList.remove('hidden');
  }
}

// Collision detection
function getPlayerScale() {
  return 1.8 * gameScale.factor;
}

function checkCollision(player, obstacle) {
  const px = player.position.x;
  const py = player.position.y;
  const ox = obstacle.position.x;
  const oy = obstacle.position.y;
  
  const playerScale = getPlayerScale();
  const playerHalfW = 0.25 * playerScale;
  const playerHalfH = 0.25 * playerScale;
  const obsHalfW = obstacle.userData.collisionHalfW || 0.15;
  const obsHalfH = obstacle.userData.collisionHalfH || 0.35;

  return Math.abs(px - ox) < (playerHalfW + obsHalfW) &&
         Math.abs(py - oy) < (playerHalfH + obsHalfH);
}

// Input handling
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (state.screen === 'playing') jump();
  }
});

document.addEventListener('touchstart', (e) => {
  if (state.screen === 'playing') {
    e.preventDefault();
    jump();
  }
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
  if (state.screen === 'playing') jump();
});

// Button handlers
document.getElementById('start-btn').addEventListener('click', startGame);

document.getElementById('restart-btn').addEventListener('click', () => {
  showScreen('hud');
  startGame();
});

document.getElementById('instructions-btn').addEventListener('click', () => {
  showScreen('instructions-screen');
});

document.getElementById('back-btn').addEventListener('click', () => {
  showScreen('menu-screen');
});

document.getElementById('sound-toggle').addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  document.getElementById('sound-toggle').textContent = state.soundEnabled ? '🔊' : '🔇';
});

// Resize handler
function updateScale() {
  gameScale.factor = getScaleFactor();
  player.position.x = getPlayerBaseX();
  if (playerSprite) {
    var s = 1.8 * gameScale.factor;
    playerSprite.scale.set(s, s, s);
    playerSprite.position.y = 0.9 * gameScale.factor;
  }
  if (auraSprite) {
    auraSprite.scale.setScalar(2 * gameScale.factor);
    auraSprite.position.y = 0.9 * gameScale.factor;
  }
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', () => setTimeout(updateScale, 100));

// Update best score display on load
document.getElementById('best-score-display').textContent = `Best: ${state.bestScore}`;

// Game loop
let lastScored = 0;

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  const timeScale = deltaTime * 60; // Normalize to 60 FPS

  if (state.screen === 'playing') {
    let scored = false; // bandera para saber si se puntuó este frame

    // Jump buffer timer
    if (state.jumpBufferTimer > 0) state.jumpBufferTimer--;

    // Player physics
    if (state.isJumping) {
      state.jumpVelocity += state.gravity * timeScale;
      player.position.y += state.jumpVelocity * timeScale;

      if (player.position.y <= state.groundY) {
        if (state.jumpBufferTimer > 0) {
          state.jumpBufferTimer = 0;
          state.isJumping = true;
          state.jumpVelocity = state.jumpForce * timeScale;
          state.canDoubleJump = true;
          state.hasUsedDoubleJump = false;
          playSound('jump');
          spawnParticles(player.position.clone(), 0x00ffcc, 5);
        } else {
          player.position.y = state.groundY;
          state.isJumping = false;
          state.jumpVelocity = 0;
          spawnParticles(player.position.clone(), 0x00ffcc, 3);
        }
      }
    }

    // Oil slow effect
    let speedMod = 1;
    if (state.oilSlowTimer > 0) {
      state.oilSlowTimer--;
      speedMod = 0.5;
    }

    // Magnet effect
    if (state.magnetTimer > 0) {
      state.magnetTimer--;
      if (state.magnetPolarity === 'attract') {
        state.gravity = -0.006;
        state.jumpForce = 0.18;
      } else {
        state.gravity = -0.018;
        state.jumpForce = 0.35;
      }
    } else {
      state.gravity = -0.012;
      state.jumpForce = 0.25;
      state.magnetPolarity = null;
    }

    // Player sprite gentle bob
    if (player.userData.sprite && !state.isJumping) {
      player.userData.sprite.position.y = (0.9 * gameScale.factor) + Math.sin(Date.now() * 0.008) * 0.02;
    }

    // Jump aura glow
    if (player.userData.aura) {
      var targetAura = state.isJumping ? (state.hasUsedDoubleJump ? 0.6 : 0.3) : 0;
      player.userData.aura.material.opacity += (targetAura - player.userData.aura.material.opacity) * 0.08;
      var auraScale = (2 + (state.isJumping ? Math.sin(Date.now() * 0.01) * 0.3 : 0)) * gameScale.factor;
      player.userData.aura.scale.setScalar(auraScale);
    }

    // Double jump indicator
    var djIndicator = document.getElementById('doublejump-indicator');
    if (state.canDoubleJump && !state.hasUsedDoubleJump) {
      if (!djIndicator) {
        djIndicator = document.createElement('div');
        djIndicator.id = 'doublejump-indicator';
        djIndicator.textContent = '▲▲ JUMP';
        document.getElementById('hud').appendChild(djIndicator);
      }
    } else {
      if (djIndicator) djIndicator.remove();
    }

    // Arm animation — raise on jump
    if (player.userData.leftArm) {
      var targetArmAngle = state.isJumping ? -1.2 : 0.1;
      player.userData.leftArm.rotation.z += (targetArmAngle - player.userData.leftArm.rotation.z) * 0.12;
      player.userData.rightArm.rotation.z += (targetArmAngle - player.userData.rightArm.rotation.z) * 0.12;
    }

    // Trail
    spawnTrail();

    // Obstacle timer and difficulty
state.obstacleTimer++;
state.difficultyTimer++;

// Ensure lastObstacleSpawnTime exists
if (state.lastObstacleSpawnTime === undefined) state.lastObstacleSpawnTime = 0;

// Difficulty increases every 10 seconds (600 frames)
if (state.difficultyTimer % 600 === 0) {
  state.difficultyLevel++;
  // velocidad aumenta suavemente con la dificultad
  const speedIncrease = 0.004 + (state.difficultyLevel * 0.0008);
  state.speed = Math.min(state.baseSpeed + (state.difficultyLevel * speedIncrease), 0.35);

  // intervalo mínimo que puede alcanzar (más conservador)
  const minInterval = Math.max(45, 90 - (state.difficultyLevel * 2));
  // reducimos el intervalo de forma más gradual
  state.obstacleInterval = Math.max(minInterval, state.obstacleInterval - 1);
}

// Spawn obstacles with a minimum cooldown to avoid bursts
const now = Date.now();
const minCooldownMs = 300; // mínimo 300 ms entre spawns
let effectiveInterval = state.obstacleInterval;

// Si la pantalla es vertical, aumentar aún más el intervalo
if (window.innerHeight > window.innerWidth) {
  effectiveInterval += 20;
}

// Convertimos frames a ms aproximados para la comprobación de cooldown
// (asumiendo ~60fps, 1 frame ≈ 16.67 ms)
const effectiveIntervalMs = effectiveInterval * (1000 / 60);

if (state.obstacleTimer >= state.obstacleInterval && (now - state.lastObstacleSpawnTime) > Math.max(minCooldownMs, effectiveIntervalMs * 0.5)) {
  createObstacle();
  state.obstacleTimer = 0;
  state.lastObstacleSpawnTime = now;

  // Variación controlada: pequeña aleatoriedad pero sin bajar demasiado el intervalo
  const variation = Math.floor(Math.random() * 8) - 4; // -4..+3
  state.obstacleInterval = Math.max(45, state.obstacleInterval + variation);

  // Si la pantalla es vertical, penalizamos un poco más el spawn
  if (window.innerHeight > window.innerWidth) {
    state.obstacleInterval += 10;
  }
}


    // Obstacles movement and logic
    let obstacleSpeed = state.activePowerups.slowmo ? state.speed * 0.4 : state.speed;
    obstacleSpeed *= speedMod;
    obstacleSpeed *= timeScale;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.x -= obstacleSpeed;
      obs.rotation.y += 0.03;

      // Entry animation — scale from 0 on spawn
      if (obs.userData.entryTimer === undefined) {
        obs.userData.entryTimer = 0;
        obs.scale.set(0.01, 0.01, 0.01);
      }
      if (obs.userData.entryTimer < 15) {
        obs.userData.entryTimer++;
        var t = obs.userData.entryTimer / 15;
        t = t * t * (3 - 2 * t);
        obs.scale.set(t, t, t);
      }

      // Animaciones específicas por tipo (mantener las existentes)
      if (obs.userData.type === 'dog') {
        const t = Date.now() * 0.01 + i;
        if (obs.userData.sprite) {
          obs.userData.sprite.position.y = 0.1 + Math.sin(t * 2) * 0.08;
        }
      } else if (obs.userData.legFL) {
        const t = Date.now() * 0.015 + i;
        obs.userData.legFL.rotation.x = Math.sin(t) * 0.35;
        obs.userData.legFR.rotation.x = Math.sin(t + Math.PI) * 0.35;
        obs.userData.legBL.rotation.x = Math.sin(t + Math.PI) * 0.35;
        obs.userData.legBR.rotation.x = Math.sin(t) * 0.35;
        obs.userData.tail.rotation.y = Math.sin(t * 0.7) * 0.5;
      }

      if (obs.userData.type === 'wire') {
        obs.userData.sparkTimer = (obs.userData.sparkTimer || 0) + 1;
        if (obs.userData.sparkTimer > 30) {
          obs.userData.sparkTimer = 0;
          obs.userData.sparkOn = !obs.userData.sparkOn;
          if (obs.userData.spark) obs.userData.spark.material.opacity = obs.userData.sparkOn ? 0.9 : 0;
          if (obs.userData.sparkLight) obs.userData.sparkLight.intensity = obs.userData.sparkOn ? 1 : 0;
        }
      }

      if (obs.userData.type === 'drone') {
        if (obs.userData.floatBase === undefined) obs.userData.floatBase = obs.position.y;
        const t = Date.now() * 0.005 + (obs.userData.floatOffset || 0);
        obs.position.y = obs.userData.floatBase + Math.sin(t) * 0.08;
      }

      if (obs.userData.type === 'watermelon') {
        obs.rotation.z += obs.userData.rollSpeed || 0;
      }

      if (obs.userData.type === 'waterballoon') {
        if (obs.position.y > 0.3 * gameScale.factor) {
          obs.position.y -= obs.userData.fallSpeed || 0.01;
        } else {
          obs.position.y = 0.3 * gameScale.factor;
        }
      }

      if (obs.userData.type === 'drill' && obs.userData.sprite) {
        const t = Date.now() * 0.003 + (obs.userData.bobOffset || 0);
        obs.userData.sprite.position.y = 0.5 + Math.sin(t) * 0.08;
      }

      if (obs.userData.type === 'marcosguerra') {
        obs.rotation.y += 0.025;
      }

      if (obs.userData.type === 'toaster' && !obs.userData.triggered) {
        const dx = player.position.x - obs.position.x;
        if (dx < 3 && dx > 0) {
          obs.userData.shootTimer = (obs.userData.shootTimer || 0) + 1;
          if (obs.userData.shootTimer > 45) {
            obs.userData.shootTimer = 0;
            spawnParticles(obs.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xffaa33, 5);
          }
        }
      }

      // Check collision
      if (checkCollision(player, obs)) {
        if (state.activePowerups.shield) {
          state.activePowerups.shield = false;
          spawnParticles(obs.position.clone(), 0x00ffff, 20);
          triggerShake(8);
          scene.remove(obs);
          obstacles.splice(i, 1);
          const shieldIndicator = document.getElementById('powerup-shield');
          if (shieldIndicator) shieldIndicator.remove();
          continue;
        } else if (obs.userData.type === 'water') {
          gameOver();
          break;
        } else if (obs.userData.type === 'oil') {
          state.oilSlowTimer = 120;
          playSound('score');
          spawnParticles(obs.position.clone(), 0xff6600, 10);
          obs.collisionHandled = true;
        } else if (obs.userData.type === 'drone') {
          if (!obs.collisionHandled) {
            obs.collisionHandled = true;
            playSound('score');
            spawnParticles(obs.position.clone(), 0xff0000, 8);
          }
        } else if (obs.userData.type === 'magnet') {
          if (!obs.collisionHandled) {
            obs.collisionHandled = true;
            state.magnetTimer = 120;
            state.magnetPolarity = obs.userData.polarity;
            playSound('powerup');
            spawnParticles(obs.position.clone(), obs.userData.polarity === 'attract' ? 0xff4444 : 0x4444ff, 10);
          }
        } else if (obs.userData.type === 'dog') {
          spawnFloatingText("I've got you!", player.position.clone(), 0xff00ff);
          spawnParticles(player.position.clone(), 0xff00ff, 25);
          triggerShake(10);
          gameOver();
          break;
        } else if (obs.userData.type === 'marcosguerra') {
          spawnFloatingText("Peralta", player.position.clone(), 0xff00ff);
          spawnParticles(player.position.clone(), 0xff00ff, 25);
          triggerShake(10);
          gameOver();
          break;
        } else {
          gameOver();
          break;
        }
      }

      // Score when obstacle passes player
      if (!obs.passed && obs.position.x < player.position.x) {
        obs.passed = true;

        // Base points from obstacle difficulty
        let points = obs.userData.points || 1;

        // Apply multiplier powerup
        points *= state.scoreMultiplier;

        // Double tap bonus
        if (state.doubleTapBonus) {
          points *= 2;
          state.doubleTapBonus = false;
        }

        // Combo system
        state.combo++;
        state.comboTimer = 60;
        const comboBonus = Math.min(Math.floor(state.combo / 3), 5); // Max 5x combo bonus
        points += comboBonus;

        state.score += points;
        scored = true;

        // Different sound for different difficulties
        if (obs.userData.difficulty === 'hard') {
          playSound('score');
        } else if (obs.userData.difficulty === 'medium') {
          playSound('score');
        }

        // Visual feedback based on difficulty
        const feedbackColor = obs.userData.difficulty === 'hard' ? 0xff00ff :
                              obs.userData.difficulty === 'medium' ? 0xffaa00 : 0x00ffcc;
        spawnScoreParticles(obs.position.clone(), feedbackColor, 6 + (obs.userData.points * 3));

        if (player.userData.sprite) {
          const scale = (1.2 + (obs.userData.points * 0.1)) * gameScale.factor;
          player.userData.sprite.scale.set(scale, scale, scale);
        }
      }

      // Remove off-screen
      if (obs.position.x < -5) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    } // end for obstacles

    // Combo milestone particles
    if (scored && state.combo > 0 && state.combo % 5 === 0) {
      spawnParticles(player.position.clone(), 0xffdd66, 30);
      spawnFloatingText(`COMBO x${state.combo}`, player.position.clone(), 0xffaa00);
    }

    // Combo timer decrement
    if (state.comboTimer > 0) {
      state.comboTimer--;
      if (state.comboTimer === 0) {
        state.combo = 0;
      }
    }

    // Update powerups (si tu función usa timeScale, pásalo; aquí la llamo sin params)
    updatePowerups();

    // Update particles and floating texts
    updateParticles();
    updateFloatingTexts();

    // Camera shake
    updateCameraShake();

    // Update background music (si aplica)
    if (typeof updateBgm === 'function') updateBgm();

  } // end if state.screen === 'playing'

  // Render siempre fuera del if para que la escena se dibuje en pantallas de menú también
  renderer.render(scene, camera);
} // end function animate


animate();
