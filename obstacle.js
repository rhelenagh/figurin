// Bella image loader
var bellaTextureLoader = new THREE.TextureLoader();
var bellaTexture = null;

function createDog() {
  const group = new THREE.Group();
  group.userData.type = 'dog';
  group.userData.collisionHalfW = 0.45;
  group.userData.collisionHalfH = 0.5;
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

var marcosCanvas = document.createElement('canvas');
var marcosTexture = new THREE.CanvasTexture(marcosCanvas);
var marcosImg = new Image();
marcosImg.onload = function() {
  marcosCanvas.width = marcosImg.width;
  marcosCanvas.height = marcosImg.height;
  var ctx = marcosCanvas.getContext('2d');
  ctx.drawImage(marcosImg, 0, 0);
  var imageData = ctx.getImageData(0, 0, marcosCanvas.width, marcosCanvas.height);
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 80) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  marcosTexture.needsUpdate = true;
};
marcosImg.src = './assets/marcosguerra.png';

function createMarcosGuerra() {
  const group = new THREE.Group();
  group.userData.type = 'marcosguerra';
  group.userData.collisionHalfW = 0.4;
  group.userData.collisionHalfH = 0.55;
  var geom = new THREE.PlaneGeometry(1.0 * gameScale.factor, 1.2 * gameScale.factor);
  var mat = new THREE.MeshBasicMaterial({
    map: marcosTexture,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
  });
  var mesh = new THREE.Mesh(geom, mat);
  mesh.position.y = 0.6;
  group.add(mesh);
  group.userData.mesh = mesh;
  return group;
}

function createSpaceship() {
  const group = new THREE.Group();
  group.userData.collisionHalfW = 0.35;
  group.userData.collisionHalfH = 0.55;
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
  const stemGeom = new THREE.CylinderGeometry(0.025 * gameScale.factor, 0.04 * gameScale.factor, 0.18 * gameScale.factor, 6);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x228822 });
  const stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.y = 0.38 * gameScale.factor;
  group.add(stem);
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

var ibm360TextureLoader = new THREE.TextureLoader();
var ibm360Texture = null;

function createDrill() {
  const group = new THREE.Group();
  group.userData.type = 'drill';
  group.userData.collisionHalfW = 0.4;
  group.userData.collisionHalfH = 0.5;
  group.userData.bobOffset = Math.random() * Math.PI * 2;

  if (!ibm360Texture) {
    ibm360Texture = ibm360TextureLoader.load('./assets/ibm-360.png');
  }
  const spriteMat = new THREE.SpriteMaterial({
    map: ibm360Texture,
    transparent: true,
    opacity: 1,
  });
  const sprite = new THREE.Sprite(spriteMat);
  const scale = 1.0 * gameScale.factor;
  sprite.scale.set(scale, scale, scale);
  sprite.position.y = 0.5;
  group.add(sprite);
  group.userData.sprite = sprite;

  group.userData.points = 5;
  group.userData.difficulty = 'hard';
  return group;
}

function createObstacle() {
  const rand = Math.random();
  let obstacle;
  let yPos = 0.35;
  const spaceshipChance = Math.min(0.20 + (state.difficultyLevel * 0.012), 0.28);
  const tomatoChance = Math.min(0.16 + (state.difficultyLevel * 0.01), 0.22);
  const waterChance = 0.07;
  const wireChance = 0.06;
  const droneChance = 0.07;
  const magnetChance = 0.06;
  const toasterChance = 0.06;
  const watermelonChance = 0.06;
  const balloonChance = 0.07;
  const drillChance = 0.06;
  const marcosChance = 0.07;
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
                    cumulative += drillChance;
                    if (rand < cumulative) {
                      obstacle = createDrill();
                      yPos = 0.40;
                      obstacle.userData.points = 5;
                      obstacle.userData.difficulty = 'hard';
                    } else {
                      cumulative += marcosChance;
                      if (rand < cumulative) {
                        obstacle = createMarcosGuerra();
                        yPos = 1.0;
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
    }
  }
  obstacle.position.set(getObstacleSpawnX(), yPos + state.groundY + 0.18, 0);
  scene.add(obstacle);
  obstacles.push(obstacle);
}
