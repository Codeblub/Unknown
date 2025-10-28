// game.js
// Main game script for Unknown (three.js)
// Drop this file next to index.html and include with:
// <script type="module" src="game.js"></script>
//
// Features:
// - Loads world OBJ: Resources/world_save/world_file/mortal_realm/a.obj
// - Loads textures from Resources/world_save/world_file/mortal_realm/tex/
// - NearestFilter (pixel/Minecraft look)
// - Reflective blue ocean plane
// - Player spawn point (default or setSpawn)
// - ESC hold to reveal cursor / pause menu
// - Clean structure and helpful console logging for debugging
//
// Notes:
// - Make sure three import map is present in your HTML:
//   "three": "https://unpkg.com/three@0.164.1/build/three.module.js",
//   "three/addons/": "https://unpkg.com/three@0.164.1/examples/jsm/"
//
// - Ensure the OBJ exists at Resources/world_save/world_file/mortal_realm/a.obj
// - Ensure textures exist in Resources/world_save/world_file/mortal_realm/tex/
//

import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

console.log("game.js initializing...");

// -----------------------------
// Configuration
// -----------------------------
const CONFIG = {
  worldObjPath: "Resources/world_save/world_file/mortal_realm/a.obj",
  worldTexDir: "Resources/world_save/world_file/mortal_realm/tex/",
  defaultSpawn: { x: 0, y: 64, z: 0 }, // fallback spawn
  ocean: {
    enabled: true,
    level: 60, // Y coordinate of the water surface
    size: 4096,
    reflectIntensity: 0.25
  },
  player: {
    eyeHeight: 1.8
  },
  textureNamesToTry: [
    // list of common texture names (try-match filenames in your exported tex folder)
    "grass_block_top.png",
    "grass_block_side.png",
    "dirt.png",
    "stone.png",
    "water.png",
    "water_still.png",
    "oak_log.png",
    "oak_leaves.png",
    "sand.png",
    "gravel.png",
    "bedrock.png"
  ],
  nearestFiltering: true, // Minecraft pixel look
};

// -----------------------------
// Renderer / Scene / Camera
// -----------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky-blue

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

// yaw / pitch container for FPS-style look
const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.position.set(0, CONFIG.player.eyeHeight, 0);
yaw.add(pitch);
pitch.add(camera);
scene.add(yaw);

// -----------------------------
// Lighting
// -----------------------------
const hemi = new THREE.HemisphereLight(0xffffff, 0x88aaff, 0.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(200, 300, 150);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// -----------------------------
// Helpers + debug layer
// -----------------------------
const debugEl = document.getElementById("debug") || (() => {
  const d = document.createElement("div");
  d.id = "debug";
  d.style.position = "fixed";
  d.style.left = "10px";
  d.style.bottom = "10px";
  d.style.background = "rgba(0,0,0,0.35)";
  d.style.padding = "8px 10px";
  d.style.borderRadius = "10px";
  d.style.fontSize = "12px";
  d.style.color = "#fff";
  d.style.whiteSpace = "pre";
  d.style.zIndex = 999;
  document.body.appendChild(d);
  return d;
})();
function setDebug(txt) { debugEl.textContent = txt; }

// -----------------------------
// Ground (placeholder plane)
// -----------------------------
const groundSize = 1024;
const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x4b8b3b });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// -----------------------------
// Ocean (reflective-ish plane)
// -----------------------------
let ocean = null;
if (CONFIG.ocean.enabled) {
  const waterGeo = new THREE.PlaneGeometry(CONFIG.ocean.size, CONFIG.ocean.size);
  // we'll do a simple reflective approximation using environment-like specular
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2a6fb0,
    roughness: 0.08,
    metalness: 0.15,
    envMapIntensity: CONFIG.ocean.reflectIntensity,
    transparent: true,
    opacity: 0.95,
  });
  ocean = new THREE.Mesh(waterGeo, waterMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = CONFIG.ocean.level;
  ocean.receiveShadow = true;
  scene.add(ocean);
}

// -----------------------------
// Tree scattering (tweakable)
// -----------------------------
const treeParent = new THREE.Group();
scene.add(treeParent);
function createTree() {
  const grp = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 2.5, 8),
    new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
  );
  trunk.position.y = 1.25;
  trunk.castShadow = true;

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 12, 10),
    new THREE.MeshLambertMaterial({ color: 0x2e7d32 })
  );
  leaves.position.y = 3.0;
  leaves.castShadow = true;
  grp.add(trunk, leaves);
  return grp;
}
function scatterTreesEvenly(proto, radius = 180, density = 0.05) {
  // density is trees per square unit roughly - tweak to taste
  const count = Math.floor(Math.PI * radius * radius * density);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const t = proto.clone();
    t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.8;
    t.scale.setScalar(scale);
    treeParent.add(t);
  }
}
scatterTreesEvenly(createTree(), 220, 0.01); // fewer trees, less clumpy

// -----------------------------
// Player container + movement
// -----------------------------
const player = new THREE.Group();
player.position.set(0, 0, 0);
scene.add(player);
player.add(yaw);

const keys = new Set();
window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

const velocity = new THREE.Vector3();
const accel = 45;
const damping = 10;
const maxSpeed = 8;
const sprintMult = 1.7;

const clock = new THREE.Clock();

function move(dt) {
  const forward = keys.has("w") || keys.has("i") ? 1 : keys.has("s") || keys.has("k") ? -1 : 0;
  const strafe = keys.has("a") || keys.has("j") ? 1 : keys.has("d") || keys.has("l") ? -1 : 0;

  const dir = new THREE.Vector3();
  const yawDir = new THREE.Vector3(-Math.sin(yaw.rotation.y), 0, -Math.cos(yaw.rotation.y));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), yawDir).normalize();
  dir.addScaledVector(yawDir, forward).addScaledVector(right, strafe).normalize();

  let curAccel = accel;
  let curMax = maxSpeed;
  if (keys.has("shift")) { curAccel *= sprintMult; curMax *= sprintMult; }

  if (dir.lengthSq() > 0) {
    velocity.addScaledVector(dir, curAccel * dt);
  } else {
    const decel = Math.max(0, 1 - damping * dt);
    velocity.multiplyScalar(decel);
  }

  const v2 = new THREE.Vector2(velocity.x, velocity.z);
  if (v2.length() > curMax) {
    v2.setLength(curMax);
    velocity.x = v2.x; velocity.z = v2.y;
  }

  player.position.x += velocity.x * dt;
  player.position.z += velocity.z * dt;
  // simple gravity / jump disabled for now (keeps spawn stable)
}

// -----------------------------
// Pointer lock and mouse look
// -----------------------------
let pointerLocked = false;
function requestLock() { renderer.domElement.requestPointerLock(); }
document.addEventListener("pointerlockchange", () => { pointerLocked = document.pointerLockElement === renderer.domElement; });

const MOUSE_BASE = 0.002;
const minecraftSensitivity122 = MOUSE_BASE * (122 / 100);

document.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  yaw.rotation.y -= e.movementX * minecraftSensitivity122;
  pitch.rotation.x -= e.movementY * minecraftSensitivity122;
  pitch.rotation.x = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, pitch.rotation.x));
});

// -----------------------------
// Pause menu: ESC hold to reveal cursor
// -----------------------------
let menuScreen = document.getElementById("menuScreen");
if (!menuScreen) {
  menuScreen = document.createElement("div");
  menuScreen.id = "menuScreen";
  menuScreen.style.display = "none";
  menuScreen.style.position = "fixed";
  menuScreen.style.inset = "0";
  menuScreen.style.background = "rgba(0,0,0,0.6)";
  menuScreen.style.zIndex = 1000;
  menuScreen.style.justifyContent = "center";
  menuScreen.style.alignItems = "center";
  menuScreen.style.display = "flex";
  const b = document.createElement("button");
  b.textContent = "Continue";
  b.onclick = () => {
    hideMenu();
    requestLock();
  };
  menuScreen.appendChild(b);
  document.body.appendChild(menuScreen);
}

let escDownTime = null;
const ESC_HOLD_MS = 300; // hold duration to reveal pause menu

function showMenu() {
  menuScreen.style.display = "flex";
}
function hideMenu() {
  menuScreen.style.display = "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (escDownTime === null) escDownTime = performance.now();
    // do not toggle immediately
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Escape") {
    if (escDownTime) {
      const held = performance.now() - escDownTime;
      escDownTime = null;
      if (held >= ESC_HOLD_MS) {
        // show menu and release pointer lock
        showMenu();
        document.exitPointerLock?.();
      } else {
        // short press: ignore (no toggle) — this prevents accidental opens
      }
    }
  }
});

// clicking the start button requests pointer lock
const btnStart = document.getElementById("btnStart");
if (btnStart) {
  btnStart.addEventListener("click", () => {
    hideMenu();
    requestLock();
    btnStart.blur();
  });
}

// -----------------------------
// Load textures helper
// -----------------------------
const textureLoader = new THREE.TextureLoader();
function loadTexture(fileName) {
  return new Promise((resolve, reject) => {
    const path = CONFIG.worldTexDir + fileName;
    textureLoader.load(
      path,
      (tex) => {
        if (CONFIG.nearestFiltering) {
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
        }
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        resolve(tex);
      },
      undefined,
      (err) => {
        // not fatal; resolve null so caller can try other names
        resolve(null);
      }
    );
  });
}

// try to load the named textures; returns map name->Texture
async function loadWorldTextures() {
  const map = {};
  for (const tName of CONFIG.textureNamesToTry) {
    const tex = await loadTexture(tName);
    if (tex) {
      map[tName] = tex;
      console.log("Loaded texture:", tName);
    }
  }
  return map;
}

// -----------------------------
// World OBJ loader
// -----------------------------
const objLoader = new OBJLoader();
let worldObject = null;

async function loadWorld() {
  // load whatever textures are present so we can apply a default style to meshes
  const textures = await loadWorldTextures();

  return new Promise((resolve, reject) => {
    objLoader.load(
      CONFIG.worldObjPath,
      (obj) => {
        worldObject = obj;
        worldObject.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Simple heuristic: apply a texture if child.name contains keywords
            const name = (child.name || "").toLowerCase();
            let chosen = null;
            if (name.includes("grass") && textures["grass_block_top.png"]) chosen = textures["grass_block_top.png"];
            else if ((name.includes("dirt") || name.includes("soil")) && textures["dirt.png"]) chosen = textures["dirt.png"];
            else if (name.includes("water") && (textures["water.png"] || textures["water_still.png"])) {
              chosen = textures["water_still.png"] || textures["water.png"];
            } else if (name.includes("sand") && textures["sand.png"]) chosen = textures["sand.png"];
            // fallback: if we have grass texture at all, use it as a generic ground
            if (!chosen) {
              chosen = textures["grass_block_top.png"] || textures["stone.png"] || null;
            }

            if (chosen) {
              child.material = new THREE.MeshStandardMaterial({
                map: chosen,
                roughness: 1.0,
                metalness: 0.0,
              });
            } else {
              // if no texture found, give a default material with moderate roughness
              child.material = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1 });
            }

            // Scale texture tiling to approximate block size if UVs are present
            if (child.material.map) {
              child.material.map.repeat.set(4, 4); // adjust to taste
            }
          }
        });

        worldObject.scale.set(1, 1, 1);
        worldObject.position.set(0, 0, 0);
        scene.add(worldObject);
        console.log("World OBJ loaded and added to scene.");
        resolve(worldObject);
      },
      (xhr) => {
        // progress
        if (xhr.total) {
          console.log(`World OBJ loading: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`);
        }
      },
      (err) => {
        console.warn("Error loading world OBJ:", err);
        reject(err);
      }
    );
  });
}

// -----------------------------
// Spawn logic
// -----------------------------
let spawnPoint = { ...CONFIG.defaultSpawn };

export function setSpawn(x, y, z) {
  spawnPoint = { x, y, z };
  console.log("Spawn set:", spawnPoint);
}

function spawnPlayerAtSpawn() {
  // put player and yaw holder at spawn coords (player bottom at y, camera at eye height)
  player.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
  yaw.position.set(spawnPoint.x, spawnPoint.y + CONFIG.player.eyeHeight, spawnPoint.z);
  pitch.position.set(0, 0, 0); // local
  // centre camera
  camera.position.set(0, 0, 0);
  console.log("Player spawned at:", spawnPoint);
}

// -----------------------------
// Simple environment fixers (water, ocean plane, scale)
// -----------------------------
function fixGroundTiling() {
  // If world is present, try to scale texture repeats to be more blocklike.
  if (!worldObject) return;
  worldObject.traverse((child) => {
    if (child.isMesh && child.material && child.material.map) {
      // compute bounding box as a guide
      child.geometry.computeBoundingBox();
      const box = child.geometry.boundingBox;
      const size = new THREE.Vector3();
      box.getSize(size);
      // set repeat proportional to size so texture appears larger on large faces
      const repeat = Math.max(1, Math.round(Math.max(size.x, size.z) / 4));
      child.material.map.repeat.set(repeat, repeat);
      child.material.map.needsUpdate = true;
    }
  });
}

// -----------------------------
// Main loop
// -----------------------------
let lastTime = performance.now();
async function start() {
  try {
    await loadWorld().catch((e) => {
      console.warn("World failed to load; continuing without it.", e);
    });
    fixGroundTiling();
  } catch (err) {
    console.warn("Load world error:", err);
  }

  // If you want to programmatically set spawn from a saved value, call setSpawn(x,y,z) before spawnPlayerAtSpawn
  spawnPlayerAtSpawn();

  // request pointer lock automatically for convenience if menu is hidden
  // don't force it; user must click to engage due to browser policies

  requestAnimationFrame(tick);
}

function tick() {
  const now = performance.now();
  const dt = Math.min(0.05, clock.getDelta());

  // movement only when menu not displayed (user pressed ESC hold to show menu)
  if (!isMenuVisible()) {
    move(dt);
  }

  // have camera follow yaw/pitch holder
  camera.updateMatrixWorld();

  // keep sun above player
  sun.position.set(player.position.x + 200, 300, player.position.z + 150);
  sun.target?.position.copy(player.position);

  renderer.render(scene, camera);

  setDebug(`
pos: ${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}
yaw: ${(THREE.MathUtils.radToDeg(yaw.rotation.y) % 360).toFixed(1)}°  pitch: ${(THREE.MathUtils.radToDeg(pitch.rotation.x)).toFixed(1)}°
World loaded: ${worldObject ? "YES" : "NO"}   Ocean: ${ocean ? "YES" : "NO"}
`);

  requestAnimationFrame(tick);
}
function isMenuVisible() {
  return menuScreen && menuScreen.style.display !== "none";
}

// -----------------------------
// init
// -----------------------------
start();

// -----------------------------
// Expose some helpers in window to make debugging easier
// -----------------------------
window.__GAME = {
  renderer,
  scene,
  camera,
  player,
  setSpawn,
  loadWorld,
  fixGroundTiling,
  CONFIG,
  setDebug,
  requestLock
};

console.log("game.js loaded. Use window.__GAME for debug helpers.");
