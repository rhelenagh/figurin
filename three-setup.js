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

const gameScale = { factor: getScaleFactor() };

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0f, 8, 18);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);
camera.lookAt(0, 1, 0);

const ambientLight = new THREE.AmbientLight(0x00ffcc, 0.3);
scene.add(ambientLight);

const playerLight = new THREE.PointLight(0x00ffcc, 2, 10);
playerLight.position.set(0, 2, 0);
scene.add(playerLight);

const player = new THREE.Group();
player.position.set(getPlayerBaseX(), 0, 0);

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

function createPlayerTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 35;

  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(128, 92, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath();
  ctx.ellipse(128, 96, 38, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(118, 94, 6, 0, Math.PI * 2);
  ctx.arc(138, 94, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00ffcc';
  roundRect(ctx, 96, 142, 64, 62, 10);
  ctx.fill();

  ctx.fillStyle = '#00bb99';
  roundRect(ctx, 74, 150, 20, 48, 8);
  ctx.fill();
  roundRect(ctx, 162, 150, 20, 48, 8);
  ctx.fill();

  ctx.fillStyle = '#00bb99';
  roundRect(ctx, 104, 204, 20, 38, 6);
  ctx.fill();
  roundRect(ctx, 132, 204, 20, 38, 6);
  ctx.fill();

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

  return new THREE.CanvasTexture(c);
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

const lineGeometry = new THREE.BoxGeometry(30, 0.02, 0.02);
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const groundLine = new THREE.Mesh(lineGeometry, lineMaterial);
groundLine.position.set(0, 0.01, 0);
scene.add(groundLine);

const gridHelper = new THREE.GridHelper(20, 40, 0x00ffcc, 0x00ffcc);
gridHelper.position.y = -0.01;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.1;
scene.add(gridHelper);

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

const obstacles = [];

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

window.gameExport = {
  scene,
  camera,
  renderer,
  player,
  playerLight,
  playerSprite,
  gameScale,
  obstacles,
  gridHelper,
  stars,
  getScaleFactor,
  getPlayerBaseX,
  getObstacleSpawnX,
};
