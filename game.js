// --- CDN Imports (works perfectly on GitHub Pages) ---
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/MTLLoader.js";

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// --- Camera setup ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.position.set(0, 1.8, 0);
yaw.add(pitch);
pitch.add(camera);
scene.add(yaw);

// --- Lighting ---
const hemi = new THREE.HemisphereLight(0xffffff, 0x88aaff, 0.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(200, 300, 150);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// --- Ground ---
const groundSize = 512;
const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');
for (let y = 0; y < 128; y++) {
  for (let x = 0; x < 128; x++) {
    const base = [29, 130, 56];
    const variation = (Math.random() * 20) - 10;
    const r = Math.max(0, Math.min(255, base[0] + variation));
    const g = Math.max(0, Math.min(255, base[1] + variation));
    const b = Math.max(0, Math.min(255, base[2] + variation));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 1, 1);
  }
}
const tex = new THREE.CanvasTexture(canvas);
tex.magFilter = THREE.NearestFilter;
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(groundSize / 16, groundSize / 16);
const groundMat = new THREE.MeshLambertMaterial({ map: tex });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Player setup ---
const player = new THREE.Group();
player.position.set(0, 0, 0);
scene.add(player);
player.add(yaw);

// --- Controls ---
const keys = new Set();
window.addEventListener("keydown", e => keys.add(e.key.toLowerCase()));
window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

const velocity = new THREE.Vector3();
const accel = 45;
const damping = 10;
const maxSpeed = 8;
const sprintMult = 1.7;

const btnStart = document.getElementById("btnStart");
const debug = document.getElementById("debug");
const menuScreen = document.getElementById("menuScreen");
const btnResume = document.getElementById("btnResume");
const btnQuit = document.getElementById("btnQuit");

const MOUSE_BASE = 0.002;
const mouseSensitivity = MOUSE_BASE * (122 / 100);
let pointerLocked = false;

function requestLock() {
  renderer.domElement.requestPointerLock();
}
document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});
btnStart.addEventListener("click", () => {
  hideMenu();
  requestLock();
});

document.addEventListener("mousemove", e => {
  if (!pointerLocked) return;
  yaw.rotation.y -= e.movementX * mouseSensitivity;
  pitch.rotation.x -= e.movementY * mouseSensitivity;
  pitch.rotation.x = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2 - 0.001, pitch.rotation.x));
});

// --- Movement ---
let onGround = true;
let vy = 0;
const gravity = 30;
const jumpSpeed = 10;
const clock = new THREE.Clock();

function move(dt) {
  const forward = (keys.has('w') || keys.has('i')) ? 1 : (keys.has('s') || keys.has('k')) ? -1 : 0;
  const strafe  = (keys.has('a') || keys.has('j')) ? 1 : (keys.has('d') || keys.has('l')) ? -1 : 0;

  const dir = new THREE.Vector3();
  const yawDir = new THREE.Vector3(-Math.sin(yaw.rotation.y), 0, -Math.cos(yaw.rotation.y));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), yawDir).normalize();
  dir.addScaledVector(yawDir, forward).addScaledVector(right, strafe).normalize();

  let curAccel = accel;
  let curMax = maxSpeed;
  if (keys.has('shift')) {
    curAccel *= sprintMult;
    curMax *= sprintMult;
  }

  if (dir.lengthSq() > 0) velocity.addScaledVector(dir, curAccel * dt);
  else velocity.multiplyScalar(Math.max(0, 1 - damping * dt));

  const v2 = new THREE.Vector2(velocity.x, velocity.z);
  if (v2.length() > curMax) v2.setLength(curMax);
  velocity.x = v2.x; velocity.z = v2.y;

  vy -= gravity * dt;
  if (onGround && (keys.has(' ') || keys.has('space'))) {
    vy = jumpSpeed; onGround = false;
  }

  player.position.x += velocity.x * dt;
  player.position.z += velocity.z * dt;
  player.position.y += vy * dt;
  if (player.position.y < 0) { player.position.y = 0; vy = 0; onGround = true; }
}

// --- Menu logic ---
function showMenu() {
  menuScreen.style.display = "flex";
  document.exitPointerLock?.();
}
function hideMenu() {
  menuScreen.style.display = "none";
}
let menuVisible = false;

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    menuVisible = !menuVisible;
    if (menuVisible) showMenu();
    else { hideMenu(); requestLock(); }
  }
});
btnResume.addEventListener("click", () => { hideMenu(); menuVisible = false; requestLock(); });
btnQuit.addEventListener("click", () => window.location.reload());

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render loop ---
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  if (!menuVisible) move(dt);
  sun.position.set(player.position.x + 200, 300, player.position.z + 150);
  renderer.render(scene, camera);
  debug.textContent = `pos: ${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}\n` +
                      `yaw: ${(THREE.MathUtils.radToDeg(yaw.rotation.y)%360).toFixed(1)}°  pitch: ${(THREE.MathUtils.radToDeg(pitch.rotation.x)).toFixed(1)}°`;
  requestAnimationFrame(tick);
}
tick();

