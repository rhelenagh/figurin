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
    if (width <= 412) return -1.4;
    if (width <= 480) return -2.0;
    return -2.5;
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

var gameScale = { factor: getScaleFactor() };

// Three.js setup
var canvas = document.getElementById('game-canvas');
var renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0a0f, 10, 25);

var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);
camera.lookAt(0, 1, 0);

// Lighting
var ambientLight = new THREE.AmbientLight(0x00ffcc, 0.3);
scene.add(ambientLight);

var playerLight = new THREE.PointLight(0x00ffcc, 2, 10);
playerLight.position.set(0, 2, 0);
scene.add(playerLight);

// Player (embedded image character)
var player = new THREE.Group();
player.position.set(getPlayerBaseX(), 0, 0);

function createPlayerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
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

var playerTexture = createPlayerTexture();
var playerSpriteMat = new THREE.SpriteMaterial({
  map: playerTexture,
  transparent: true,
  color: 0xffffff,
});
var playerSprite = new THREE.Sprite(playerSpriteMat);
playerSprite.scale.set(1.8 * gameScale.factor, 1.8 * gameScale.factor, 1.8 * gameScale.factor);
playerSprite.position.y = 0.9 * gameScale.factor;
player.add(playerSprite);

// 3D arms for jump animation
var armMat = new THREE.MeshStandardMaterial({
  color: 0x00bb99,
  emissive: 0x00bb99,
  emissiveIntensity: 0.3,
});
var armGeom = new THREE.BoxGeometry(0.08, 0.28, 0.04);
var leftPivot = new THREE.Group();
leftPivot.position.set(-0.48, 0.75, 0);
var leftArm = new THREE.Mesh(armGeom, armMat);
leftArm.position.set(0, -0.14, 0);
leftPivot.add(leftArm);
player.add(leftPivot);
var rightPivot = new THREE.Group();
rightPivot.position.set(0.48, 0.75, 0);
var rightArm = new THREE.Mesh(armGeom, armMat);
rightArm.position.set(0, -0.14, 0);
rightPivot.add(rightArm);
player.add(rightPivot);

// Aura sprite — radial glow for jump / double jump
function createAuraTexture() {
  var c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  var ctx = c.getContext('2d');
  var gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 255, 204, 0)');
  gradient.addColorStop(0.5, 'rgba(0, 255, 204, 0.15)');
  gradient.addColorStop(0.8, 'rgba(0, 255, 204, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
var auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: createAuraTexture(),
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0,
}));
auraSprite.scale.setScalar(2 * gameScale.factor);
auraSprite.position.y = 0.9 * gameScale.factor;
player.add(auraSprite);

player.userData = { sprite: playerSprite, leftArm: leftPivot, rightArm: rightPivot, aura: auraSprite };

scene.add(player);

// Ground
var groundGeometry = new THREE.PlaneGeometry(30, 2);
var groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ffcc,
  emissive: 0x00ffcc,
  emissiveIntensity: 0.2,
  transparent: true,
  opacity: 0.5,
});
var ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, -0.5);
scene.add(ground);

// Ground line (neon strip)
var lineGeometry = new THREE.BoxGeometry(30, 0.02, 0.02);
var lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 });
var groundLine = new THREE.Mesh(lineGeometry, lineMaterial);
groundLine.position.set(0, 0.01, 0);
scene.add(groundLine);



// Stars
var starsGeometry = new THREE.BufferGeometry();
var starPositions = [];
for (let i = 0; i < 100; i++) {
  starPositions.push((Math.random() - 0.5) * 30);
  starPositions.push(Math.random() * 10 + 2);
  starPositions.push((Math.random() - 0.5) * 20 - 5);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.5 });
var stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);



// City skyline
var city = new THREE.Group();
var buildingColors = [0x111122, 0x0a0a1a, 0x151530, 0x080818];
var buildingHeights = [1.2, 2.0, 1.5, 2.8, 1.0, 2.2, 1.8, 1.3, 2.5, 1.6, 2.1, 0.9];

for (let i = 0; i < buildingHeights.length; i++) {
  var bw = 0.5;
  var bh = buildingHeights[i];
  var bMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    emissive: 0x0a0a1a,
    emissiveIntensity: 0.1,
    roughness: 0.9,
    metalness: 0.1,
  });
  var building = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.3), bMat);
  building.position.set((i - buildingHeights.length / 2) * 0.6 + 0.3, bh / 2, 0);
  city.add(building);

  var windowCount = Math.floor(bh / 0.35);
  for (let w = 0; w < windowCount; w++) {
    if (Math.random() > 0.4) {
      var wMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.3 ? 0xffaa44 : 0x44aaff,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.4,
      });
      var win = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.12), wMat);
      win.position.set(
        (Math.random() - 0.5) * 0.3,
        w * 0.35 + 0.25,
        0.16
      );
      building.add(win);
    }
  }
}

city.position.set(0, 0.2, -6);
scene.add(city);

// Glowing clouds
var clouds = [];
var cloudPositions = [
  { x: -4, y: 3.5, z: -2.5, s: 1.0 },
  { x: 3, y: 4.5, z: -3.5, s: 1.2 },
  { x: -2, y: 5.5, z: -2, s: 0.8 },
  { x: 5, y: 3.0, z: -4, s: 0.9 },
  { x: -5, y: 2.0, z: -3, s: 0.7 },
];

function createCloudTexture(color, size) {
  var c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  var ctx = c.getContext('2d');
  var hex = '#' + color.toString(16).padStart(6, '0');
  for (let i = 0; i < 6; i++) {
    var cx = 20 + Math.random() * 88;
    var cy = 10 + Math.random() * 44;
    var r = 8 + Math.random() * 20;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, hex + 'cc');
    grad.addColorStop(0.5, hex + '44');
    grad.addColorStop(1, hex + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

var cloudColors = [0x00ffcc, 0xff44ff, 0x4488ff, 0x00ffcc, 0xff8844];

for (let i = 0; i < cloudPositions.length; i++) {
  var pos = cloudPositions[i];
  var tex = createCloudTexture(cloudColors[i], pos.s);
  var cloudMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  var cloud = new THREE.Sprite(cloudMat);
  cloud.scale.set(pos.s * 2, pos.s * 1.2, 1);
  cloud.position.set(pos.x, pos.y, pos.z);
  scene.add(cloud);
  cloud.userData = { baseX: pos.x, speed: 0.002 + Math.random() * 0.003, offset: Math.random() * 100 };
  clouds.push(cloud);
}

// Dynamic ambient lights
var ambientLights = [];
var lightConfigs = [
  { color: 0x00ffcc, intensity: 0.5, distance: 8, y: 2 },
  { color: 0xff44ff, intensity: 0.4, distance: 8, y: 4 },
  { color: 0x4488ff, intensity: 0.3, distance: 10, y: 6 },
];

for (let i = 0; i < lightConfigs.length; i++) {
  var cfg = lightConfigs[i];
  var dLight = new THREE.PointLight(cfg.color, cfg.intensity, cfg.distance);
  dLight.position.set((i - 1) * 3, cfg.y, -5);
  scene.add(dLight);
  dLight.userData = { angle: i * 2.1, speed: 0.003 + i * 0.001, radius: 2 + i * 0.5, baseY: cfg.y };
  ambientLights.push(dLight);
}
