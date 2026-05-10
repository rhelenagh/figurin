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
  obstacleInterval: 60,
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

function getScaleFactor() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);
  const isPortrait = height > width;
  
  let baseScale = 1;
  if (maxDim >= 1200) {
    baseScale = 1.4;
  } else if (maxDim >= 900) {
    baseScale = 1.3;
  } else if (maxDim >= 600) {
    baseScale = 1.2;
  } else {
    baseScale = 1.15;
  }
  
  if (isPortrait) {
    if (width <= 400) {
      baseScale = 1.05;
    } else if (width <= 480) {
      baseScale = 1.1;
    }
  } else {
    if (baseScale < 1.8) {
      baseScale = 1.8;
    }
  }
  
  return baseScale;
}

const gameScale = { factor: getScaleFactor() };

function getPlayerBaseX() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  
  if (isPortrait) {
    if (width <= 400) return -0.8;
    if (width <= 480) return -1.0;
    return -1.2;
  } else {
    if (width <= 480) return -3.5;
    if (width <= 600) return -3.2;
    return -3;
  }
}

function getObstacleSpawnX() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  
  if (isPortrait) {
    if (width <= 400) return 4;
    if (width <= 480) return 4.5;
    return 5;
  } else {
    if (width <= 600) return 5.5;
    return 7;
  }
}

// Three.js setup
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0f, 8, 18);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);
camera.lookAt(0, 1, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0x00ffcc, 0.3);
scene.add(ambientLight);

const playerLight = new THREE.PointLight(0x00ffcc, 2, 10);
playerLight.position.set(0, 2, 0);
scene.add(playerLight);

// Player (embedded image character)
const player = new THREE.Group();
function getPlayerBaseX() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  
  if (isPortrait) {
    if (width <= 400) return -2.0;
    if (width <= 480) return -2.2;
    return -2.5;
  } else {
    if (width <= 480) return -3.5;
    if (width <= 600) return -3.2;
    return -3;
  }
}
player.position.set(getPlayerBaseX(), 0, 0);

function createPlayerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);

  // Glow shadow
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 35;

  // Head
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(128, 92, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Visor
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath();
  ctx.ellipse(128, 96, 38, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(118, 94, 6, 0, Math.PI * 2);
  ctx.arc(138, 94, 6, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#00ffcc';
  roundRect(ctx, 96, 142, 64, 62, 10);
  ctx.fill();

  // Arms
  ctx.fillStyle = '#00bb99';
  roundRect(ctx, 74, 150, 20, 48, 8);
  ctx.fill();
  roundRect(ctx, 162, 150, 20, 48, 8);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#00bb99';
  roundRect(ctx, 104, 204, 20, 38, 6);
  ctx.fill();
  roundRect(ctx, 132, 204, 20, 38, 6);
  ctx.fill();

  // Antenna
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(128, 40);
  ctx.lineTo(128, 12);
  ctx.stroke();

  ctx.fillStyle = '#ff3366';
  ctx.beginPath();
  ctx.arc(128, 10, 7, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const playerTexture = createPlayerTexture();
const playerSpriteMat = new THREE.SpriteMaterial({
  map: playerTexture,
  transparent: true,
  color: 0xffffff,
});
const playerSprite = new THREE.Sprite(playerSpriteMat);
playerSprite.scale.set(1.8 * gameScale.factor, 1.8 * gameScale.factor, 1.8 * gameScale.factor);
playerSprite.position.y = 0.9 * gameScale.factor;
player.add(playerSprite);

player.userData = { sprite: playerSprite };

scene.add(player);

// Ground
const groundGeometry = new THREE.PlaneGeometry(30, 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ffcc,
  emissive: 0x00ffcc,
  emissiveIntensity: 0.2,
  transparent: true,
  opacity: 0.5,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, -0.5);
scene.add(ground);

// Ground line (neon strip)
const lineGeometry = new THREE.BoxGeometry(30, 0.02, 0.02);
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const groundLine = new THREE.Mesh(lineGeometry, lineMaterial);
groundLine.position.set(0, 0.01, 0);
scene.add(groundLine);

// Obstacles
const obstacles = [];

// Bella image loader
const bellaTextureLoader = new THREE.TextureLoader();
let bellaTexture = null;

function createDog() {
  const group = new THREE.Group();
  group.userData.type = 'dog';
  group.userData.collisionHalfW = 0.45;
  group.userData.collisionHalfH = 0.5;

  // Load texture if not loaded yet
  if (!bellaTexture) {
    bellaTexture = bellaTextureLoader.load('./assets/bella.png');
  }

  const dogSpriteMat = new THREE.SpriteMaterial({
    map: bellaTexture,
    transparent: true,
    opacity: 1,
  });
  const dogSprite = new THREE.Sprite(dogSpriteMat);
  const scale = 2.0 * gameScale.factor;
  dogSprite.scale.set(scale, scale, scale);
  dogSprite.position.y = 0.5;
  group.add(dogSprite);

  group.userData.sprite = dogSprite;

  return group;
}

function createSpaceship() {
  const group = new THREE.Group();
  group.userData.collisionHalfW = 0.35;
  group.userData.collisionHalfH = 0.55;

  // Body
  const bodyGeom = new THREE.ConeGeometry(0.38 * gameScale.factor, 1.1 * gameScale.factor, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    emissive: 0x4488ff,
    emissiveIntensity: 0.5,
    metalness: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Wings
  const wingGeom = new THREE.BoxGeometry(0.95 * gameScale.factor, 0.03 * gameScale.factor, 0.35 * gameScale.factor);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x667788,
    emissive: 0x2244aa,
    emissiveIntensity: 0.4,
    metalness: 0.6,
    roughness: 0.3,
  });
  const wings = new THREE.Mesh(wingGeom, wingMat);
  wings.position.set(0, 0, 0.08);
  group.add(wings);

  // Engine glow
  const engineGeom = new THREE.SphereGeometry(0.15 * gameScale.factor, 8, 8);
  const engineMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0.9,
  });
  const engine = new THREE.Mesh(engineGeom, engineMat);
  engine.position.set(0, 0, 0.45);
  group.add(engine);

  group.userData.type = 'spaceship';
  return group;
}

function createTomato() {
  const group = new THREE.Group();
  group.userData.collisionHalfW = 0.4;
  group.userData.collisionHalfH = 0.5;

  // Body
  const bodyGeom = new THREE.SphereGeometry(0.5 * gameScale.factor, 12, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.scale.y = 0.82;
  group.add(body);

  // Stem
  const stemGeom = new THREE.CylinderGeometry(0.025 * gameScale.factor, 0.04 * gameScale.factor, 0.18 * gameScale.factor, 6);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x228822 });
  const stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.y = 0.38 * gameScale.factor;
  group.add(stem);

  // Leaf
  const leafGeom = new THREE.BoxGeometry(0.13 * gameScale.factor, 0.025 * gameScale.factor, 0.065 * gameScale.factor);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
  const leaf = new THREE.Mesh(leafGeom, leafMat);
  leaf.position.set(0, 0.42 * gameScale.factor, 0);
  group.add(leaf);

  group.userData.type = 'tomato';
  return group;
}

function createWaterPuddle() {
  const group = new THREE.Group();
  group.userData.type = 'water';
  group.userData.collisionHalfW = 0.5;
  group.userData.collisionHalfH = 0.15;

  const puddleGeom = new THREE.CylinderGeometry(0.5 * gameScale.factor, 0.5 * gameScale.factor, 0.08, 16);
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    emissive: 0x2266ff,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.7,
  });
  const puddle = new THREE.Mesh(puddleGeom, puddleMat);
  puddle.position.y = 0.04;
  group.add(puddle);

  const rippleGeom = new THREE.RingGeometry(0.3 * gameScale.factor, 0.45 * gameScale.factor, 16);
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0x88aaff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const ripple = new THREE.Mesh(rippleGeom, rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = 0.08;
  group.add(ripple);
  group.userData.ripple = ripple;

  group.userData.points = 1;
  group.userData.difficulty = 'easy';
  return group;
}

function createOilPuddle() {
  const group = new THREE.Group();
  group.userData.type = 'oil';
  group.userData.collisionHalfW = 0.6;
  group.userData.collisionHalfH = 0.12;
  group.userData.effectTimer = 0;

  const puddleGeom = new THREE.CylinderGeometry(0.6 * gameScale.factor, 0.55 * gameScale.factor, 0.06, 16);
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x442200,
    emissive: 0x331100,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8,
  });
  const puddle = new THREE.Mesh(puddleGeom, puddleMat);
  puddle.position.y = 0.03;
  group.add(puddle);

  const shineGeom = new THREE.RingGeometry(0.2 * gameScale.factor, 0.35 * gameScale.factor, 16);
  const shineMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const shine = new THREE.Mesh(shineGeom, shineMat);
  shine.rotation.x = -Math.PI / 2;
  shine.position.y = 0.06;
  group.add(shine);

  group.userData.points = 1;
  group.userData.difficulty = 'easy';
  return group;
}

function createLiveWire() {
  const group = new THREE.Group();
  group.userData.type = 'wire';
  group.userData.collisionHalfW = 0.2;
  group.userData.collisionHalfH = 0.5;
  group.userData.sparkOn = true;
  group.userData.sparkTimer = 0;

  const wireGeom = new THREE.CylinderGeometry(0.02 * gameScale.factor, 0.02 * gameScale.factor, 0.8, 8);
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wire = new THREE.Mesh(wireGeom, wireMat);
  group.add(wire);

  const sparkGeom = new THREE.SphereGeometry(0.12 * gameScale.factor, 8, 8);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.9,
  });
  const spark = new THREE.Mesh(sparkGeom, sparkMat);
  spark.position.y = 0.4;
  group.add(spark);
  group.userData.spark = spark;

  const light = new THREE.PointLight(0xffff00, 1, 2);
  light.position.y = 0.4;
  group.add(light);
  group.userData.sparkLight = light;

  group.userData.points = 2;
  group.userData.difficulty = 'medium';
  return group;
}

function createDrone() {
  const group = new THREE.Group();
  group.userData.type = 'drone';
  const height = 0.2 + Math.random() * 0.5;
  group.userData.collisionHalfW = 0.25;
  group.userData.collisionHalfH = 0.2;
  group.userData.height = height;
  group.userData.floatOffset = Math.random() * Math.PI * 2;

  const bodyGeom = new THREE.SphereGeometry(0.15 * gameScale.factor, 8, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    emissive: 0xff3333,
    emissiveIntensity: 0.5,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  group.add(body);

  const rotorGeom = new THREE.TorusGeometry(0.12 * gameScale.factor, 0.02, 4, 8);
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const rotor1 = new THREE.Mesh(rotorGeom, rotorMat);
  rotor1.rotation.x = Math.PI / 2;
  rotor1.position.y = 0.08;
  group.add(rotor1);

  const rotor2 = new THREE.Mesh(rotorGeom, rotorMat);
  rotor2.rotation.x = Math.PI / 2;
  rotor2.position.y = -0.08;
  group.add(rotor2);

  const eyeGeom = new THREE.SphereGeometry(0.05 * gameScale.factor, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eye = new THREE.Mesh(eyeGeom, eyeMat);
  eye.position.z = 0.12;
  group.add(eye);

  group.position.y = height;
  group.userData.points = 1;
  group.userData.difficulty = 'easy';
  return group;
}

function createMagnet() {
  const group = new THREE.Group();
  group.userData.type = 'magnet';
  group.userData.collisionHalfW = 0.4;
  group.userData.collisionHalfH = 0.6;
  group.userData.magnetActive = true;
  group.userData.polarity = Math.random() > 0.5 ? 'attract' : 'repel';

  const magnetType = group.userData.polarity === 'attract' ? 0xff4444 : 0x4444ff;
  const emissiveType = group.userData.polarity === 'attract' ? 0xff0000 : 0x0000ff;

  const horseshoeGeom = new THREE.TorusGeometry(0.3 * gameScale.factor, 0.08 * gameScale.factor, 8, 16, Math.PI);
  const magnetMat = new THREE.MeshStandardMaterial({
    color: magnetType,
    emissive: emissiveType,
    emissiveIntensity: 0.6,
  });
  const horseshoe = new THREE.Mesh(horseshoeGeom, magnetMat);
  horseshoe.rotation.z = Math.PI;
  horseshoe.position.y = 0.3 * gameScale.factor;
  group.add(horseshoe);

  const baseGeom = new THREE.BoxGeometry(0.7 * gameScale.factor, 0.15 * gameScale.factor, 0.15 * gameScale.factor);
  const base = new THREE.Mesh(baseGeom, magnetMat);
  base.position.y = -0.02;
  group.add(base);

  const fieldGeom = new THREE.SphereGeometry(0.5 * gameScale.factor, 8, 8);
  const fieldMat = new THREE.MeshBasicMaterial({
    color: magnetType,
    transparent: true,
    opacity: 0.15,
  });
  const field = new THREE.Mesh(fieldGeom, fieldMat);
  field.position.y = 0.2 * gameScale.factor;
  group.add(field);
  group.userData.field = field;

  const light = new THREE.PointLight(magnetType, 1, 3);
  light.position.y = 0.3 * gameScale.factor;
  group.add(light);

  group.userData.points = 2;
  group.userData.difficulty = 'medium';
  return group;
}

function createToaster() {
  const group = new THREE.Group();
  group.userData.type = 'toaster';
  group.userData.collisionHalfW = 0.35;
  group.userData.collisionHalfH = 0.4;
  group.userData.shootTimer = 0;
  group.userData.projectiles = [];
  group.userData.triggered = false;

  const bodyGeom = new THREE.BoxGeometry(0.5 * gameScale.factor, 0.35 * gameScale.factor, 0.4 * gameScale.factor);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    emissive: 0xff2200,
    emissiveIntensity: 0.3,
    metalness: 0.8,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 0.175 * gameScale.factor;
  group.add(body);

  const slotGeom = new THREE.BoxGeometry(0.3 * gameScale.factor, 0.05, 0.25 * gameScale.factor);
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const slot = new THREE.Mesh(slotGeom, slotMat);
  slot.position.y = 0.38 * gameScale.factor;
  group.add(slot);

  for (let i = 0; i < 2; i++) {
    const leverGeom = new THREE.BoxGeometry(0.06, 0.1, 0.06);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const lever = new THREE.Mesh(leverGeom, leverMat);
    lever.position.set(-0.15 + i * 0.3, 0.32 * gameScale.factor, 0.25 * gameScale.factor);
    group.add(lever);
  }

  const eyeGeom = new THREE.SphereGeometry(0.06 * gameScale.factor, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
  for (let i = 0; i < 2; i++) {
    const eye = new THREE.Mesh(eyeGeom, eyeMat);
    eye.position.set(-0.1 + i * 0.2, 0.25 * gameScale.factor, 0.22 * gameScale.factor);
    group.add(eye);
  }

  group.userData.points = 2;
  group.userData.difficulty = 'medium';
  return group;
}

function createWatermelon() {
  const group = new THREE.Group();
  group.userData.type = 'watermelon';
  group.userData.collisionHalfW = 0.5;
  group.userData.collisionHalfH = 0.45;

  const melonGeom = new THREE.SphereGeometry(0.5 * gameScale.factor, 16, 16);
  const melonMat = new THREE.MeshStandardMaterial({
    color: 0x228833,
    emissive: 0x114422,
    emissiveIntensity: 0.3,
    roughness: 0.6,
  });
  const melon = new THREE.Mesh(melonGeom, melonMat);
  melon.scale.y = 0.7;
  melon.position.y = 0.35 * gameScale.factor;
  group.add(melon);

  const stripeGeom = new THREE.TorusGeometry(0.45 * gameScale.factor, 0.04 * gameScale.factor, 4, 16);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x116622 });
  const stripe = new THREE.Mesh(stripeGeom, stripeMat);
  stripe.position.y = 0.35 * gameScale.factor;
  stripe.rotation.x = Math.PI / 2;
  group.add(stripe);

  const stripe2 = new THREE.Mesh(stripeGeom, stripeMat);
  stripe2.position.y = 0.35 * gameScale.factor;
  stripe2.rotation.x = Math.PI / 2;
  stripe2.rotation.y = Math.PI / 2;
  group.add(stripe2);

  group.userData.rollSpeed = 0.05;
  group.userData.points = 2;
  group.userData.difficulty = 'medium';
  return group;
}

function createWaterBalloon() {
  const group = new THREE.Group();
  group.userData.type = 'waterballoon';
  group.userData.collisionHalfW = 0.25;
  group.userData.collisionHalfH = 0.25;
  group.userData.falling = true;
  group.userData.startX = 6 + Math.random() * 3;

  const balloonGeom = new THREE.SphereGeometry(0.25 * gameScale.factor, 12, 12);
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    emissive: 0x2266ff,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.7,
  });
  const balloon = new THREE.Mesh(balloonGeom, balloonMat);
  balloon.scale.y = 1.2;
  balloon.position.y = 0.3 * gameScale.factor;
  group.add(balloon);

  const knotGeom = new THREE.ConeGeometry(0.05 * gameScale.factor, 0.1 * gameScale.factor, 4);
  const knotMat = new THREE.MeshStandardMaterial({ color: 0x3366dd });
  const knot = new THREE.Mesh(knotGeom, knotMat);
  knot.position.y = 0.55 * gameScale.factor;
  group.add(knot);

  const stringGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.2 * gameScale.factor, 4);
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const string = new THREE.Mesh(stringGeom, stringMat);
  string.position.y = 0.7 * gameScale.factor;
  group.add(string);

  group.position.x = group.userData.startX;
  group.position.y = 3;
  group.userData.fallSpeed = 0.02 + Math.random() * 0.01;

  group.userData.points = 1;
  group.userData.difficulty = 'easy';
  return group;
}

function createObstacle() {
  const rand = Math.random();
  let obstacle;
  let yPos = 0.35;
  
  // Difficulty-based spawning - harder obstacles appear more as difficulty increases
  const spaceshipChance = Math.min(0.2 + (state.difficultyLevel * 0.012), 0.28);
  const tomatoChance = Math.min(0.18 + (state.difficultyLevel * 0.01), 0.25);
  const waterChance = 0.08;
  const wireChance = 0.06;
  const droneChance = 0.08;
  const magnetChance = 0.06;
  const toasterChance = 0.07;
  const watermelonChance = 0.06;
  const balloonChance = 0.08;
  
  let cumulative = 0;
  cumulative += spaceshipChance;
  if (rand < cumulative) {
    obstacle = createSpaceship();
    yPos = 0.45 + Math.random() * 0.4;
    obstacle.userData.points = 3;
    obstacle.userData.difficulty = 'hard';
  } else {
    cumulative += tomatoChance;
    if (rand < cumulative) {
      obstacle = createTomato();
      yPos = 0.55;
      obstacle.userData.points = 2;
      obstacle.userData.difficulty = 'medium';
    } else {
      cumulative += waterChance;
      if (rand < cumulative) {
        obstacle = createWaterPuddle();
        yPos = 0.1;
        obstacle.userData.points = 1;
        obstacle.userData.difficulty = 'easy';
      } else {
        cumulative += wireChance;
        if (rand < cumulative) {
          obstacle = createLiveWire();
          yPos = 0.5;
          obstacle.userData.points = 2;
          obstacle.userData.difficulty = 'medium';
        } else {
          cumulative += droneChance;
          if (rand < cumulative) {
            obstacle = createDrone();
            yPos = 0.5 + Math.random() * 0.3;
            obstacle.userData.points = 1;
            obstacle.userData.difficulty = 'easy';
          } else {
            cumulative += magnetChance;
            if (rand < cumulative) {
              obstacle = createMagnet();
              yPos = 0.35;
              obstacle.userData.points = 2;
              obstacle.userData.difficulty = 'medium';
            } else {
              cumulative += toasterChance;
              if (rand < cumulative) {
                obstacle = createToaster();
                yPos = 0.25;
                obstacle.userData.points = 2;
                obstacle.userData.difficulty = 'medium';
              } else {
                cumulative += watermelonChance;
                if (rand < cumulative) {
                  obstacle = createWatermelon();
                  yPos = 0.35;
                  obstacle.userData.points = 2;
                  obstacle.userData.difficulty = 'medium';
                } else {
                  cumulative += balloonChance;
                  if (rand < cumulative) {
                    obstacle = createWaterBalloon();
                    yPos = 3;
                    obstacle.userData.points = 1;
                    obstacle.userData.difficulty = 'easy';
                  } else {
obstacle = createDog();
                    yPos = 0.9;
                    obstacle.userData.points = 1;
                    obstacle.userData.difficulty = 'easy';
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  obstacle.position.set(getObstacleSpawnX(), yPos, 0);
  scene.add(obstacle);
  obstacles.push(obstacle);
}

// Powerup types
const powerupTypes = ['shield', 'slowmo', 'multiplier', 'bonus'];

function createPowerup() {
  const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  const group = new THREE.Group();
  group.userData.type = 'powerup';
  group.userData.powerupType = type;
  
  let color, emissiveColor;
  switch (type) {
    case 'shield':
      color = 0x00ffff;
      emissiveColor = 0x00ffff;
      break;
    case 'slowmo':
      color = 0x9966ff;
      emissiveColor = 0x9966ff;
      break;
    case 'multiplier':
      color = 0xffaa00;
      emissiveColor = 0xffaa00;
      break;
    case 'bonus':
      color = 0x00ff66;
      emissiveColor = 0x00ff66;
      break;
  }
  
  const geom = new THREE.OctahedronGeometry(0.25, 0);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: emissiveColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = new THREE.Mesh(geom, mat);
  group.add(mesh);
  
  // Inner glow
  const innerGeom = new THREE.OctahedronGeometry(0.15, 0);
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
  // Powerup rotation and movement
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    p.rotation.y += p.userData.rotationSpeed;
    p.position.x -= state.speed;
    
    // Bob effect
    p.position.y += Math.sin(Date.now() * 0.005 + i) * 0.003;
    
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
  if (state.activePowerups.shield) {
    player.userData.sprite.material.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
  } else {
    player.userData.sprite.material.opacity = 1;
  }
}

// Particles
const particles = [];

function spawnParticles(position, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const size = 0.05 + Math.random() * 0.1;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      Math.random() * 0.2,
      (Math.random() - 0.5) * 0.2
    );
    particle.life = 1;
    particle.decay = 0.02 + Math.random() * 0.02;
    scene.add(particle);
    particles.push(particle);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.velocity);
    p.velocity.y -= 0.005;
    p.life -= p.decay;
    p.material.opacity = p.life;
    p.scale.multiplyScalar(0.98);

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
  if (trailTimer++ % 3 === 0) {
    const size = 0.04;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.6,
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.set(
      player.position.x - 0.3,
      player.position.y + (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    );
    particle.velocity = new THREE.Vector3(-0.05, 0, 0);
    particle.life = 0.5;
    particle.decay = 0.02;
    scene.add(particle);
    particles.push(particle);
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

// Background grid
const gridHelper = new THREE.GridHelper(20, 40, 0x00ffcc, 0x00ffcc);
gridHelper.position.y = -0.01;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.1;
scene.add(gridHelper);

// Stars
const starsGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 100; i++) {
  starPositions.push((Math.random() - 0.5) * 30);
  starPositions.push(Math.random() * 10 + 2);
  starPositions.push((Math.random() - 0.5) * 20 - 5);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.5 });
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Game functions
function jump(isDoubleTap = false) {
  if (state.screen !== 'playing') return;
  
  // Double tap detection
  const now = Date.now();
  if (now - state.lastTapTime < 300) {
    state.doubleTapBonus = true;
  }
  state.lastTapTime = now;
  
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
    spawnParticles(player.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xff00ff, 12);
    triggerShake(4);
    
    // Visual spin effect
    if (player.userData.sprite) {
      const spinScale = 1.2 * gameScale.factor;
      player.userData.sprite.scale.set(spinScale, spinScale, spinScale);
    }
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
  player.position.y = 0;

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

  updateScoreDisplay();
}

function startGame() {
  resetGame();
  state.screen = 'playing';
  showScreen('hud');
  if (audioCtx.state === 'suspended') audioCtx.resume();
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
window.addEventListener('resize', () => {
  gameScale.factor = getScaleFactor();
  player.position.x = getPlayerBaseX();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    gameScale.factor = getScaleFactor();
    player.position.x = getPlayerBaseX();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);
});

// Update best score display on load
document.getElementById('best-score-display').textContent = `Best: ${state.bestScore}`;

// Game loop
let lastScored = 0;

function animate() {
  requestAnimationFrame(animate);

  if (state.screen === 'playing') {
    // Player physics
    if (state.isJumping) {
      state.jumpVelocity += state.gravity;
      player.position.y += state.jumpVelocity;

      if (player.position.y <= 0) {
        player.position.y = 0;
        state.isJumping = false;
        state.jumpVelocity = 0;
        spawnParticles(player.position.clone(), 0x00ffcc, 3);
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

    // Trail
    spawnTrail();

    // Obstacles
    state.obstacleTimer++;
    state.difficultyTimer++;

    // Progressive difficulty curve
    
    // Difficulty increases every 10 seconds (600 frames)
    if (state.difficultyTimer % 600 === 0) {
      state.difficultyLevel++;
      
      // Speed increases - slower progression
      const speedIncrease = 0.005 + (state.difficultyLevel * 0.001);
      state.speed = Math.min(state.baseSpeed + (state.difficultyLevel * speedIncrease), 0.35);
      
      // Obstacle interval decreases - but not below threshold
      const minInterval = Math.max(35, 70 - (state.difficultyLevel * 3));
      state.obstacleInterval = Math.max(minInterval, state.obstacleInterval - 2);
    }

    // Spawn obstacles and powerups
    if (state.obstacleTimer >= state.obstacleInterval) {
      createObstacle();
      state.obstacleTimer = 0;
      
      // Randomize next interval slightly
      const variation = Math.floor(Math.random() * 10);
      state.obstacleInterval = Math.max(35, state.obstacleInterval + variation);
      
      // Powerup spawn chance increases with difficulty
      const powerupChance = 0.05 + (state.difficultyLevel * 0.02);
      if (Math.random() < powerupChance) {
        createPowerup();
      }
    }
    
    // Update powerups
    updatePowerups();

    // Update obstacles
    let scored = false;
    let obstacleSpeed = state.activePowerups.slowmo ? state.speed * 0.4 : state.speed;
    obstacleSpeed *= speedMod;
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.x -= obstacleSpeed;
      obs.rotation.y += 0.03;

      // Animate dog obstacles
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

      // Animate watermelon rolling
      if (obs.userData.type === 'watermelon') {
        obs.rotation.z += obs.userData.rollSpeed;
      }

      // Animate water balloon falling
      if (obs.userData.type === 'waterballoon') {
        if (obs.position.y > 0.3 * gameScale.factor) {
          obs.position.y -= obs.userData.fallSpeed;
        } else {
          obs.position.y = 0.3 * gameScale.factor;
        }
      }

      // Animate toaster shooting toast
      if (obs.userData.type === 'toaster' && !obs.userData.triggered) {
        const dx = player.position.x - obs.position.x;
        if (dx < 3 && dx > 0) {
          obs.userData.shootTimer++;
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
        } else if (obs.userData.type === 'dog') {
          spawnFloatingText("I've got you!", player.position.clone(), 0xff00ff);
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
        spawnParticles(obs.position.clone(), feedbackColor, 8 + (obs.userData.points * 3));
        
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
    }

    // Update combo timer
    if (state.comboTimer > 0) {
      state.comboTimer--;
      if (state.comboTimer === 0) {
        state.combo = 0;
      }
    }

    if (scored) {
      updateScoreDisplay();
    }

    // Player sprite pulse recovery
    if (player.userData.sprite) {
      const targetScale = 1.8 * gameScale.factor;
      player.userData.sprite.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // Grid movement effect
    gridHelper.position.x = (gridHelper.position.x - state.speed) % 0.5;

    // Update particles
    updateParticles();
    
    // Update background music
    updateBgm();

    // Camera shake
    updateCameraShake();
  }

  // Update floating texts (always, even after game over)
  updateFloatingTexts();

  // Animate stars
  stars.rotation.y += 0.0001;

  renderer.render(scene, camera);
}

animate();
