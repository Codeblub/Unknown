// Import THREE.js and helpers from CDN (browser-safe)
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/OBJLoader.js";

// === BASIC SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// === LIGHTING ===
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 10, 7);
scene.add(directional);

// === WORLD / TERRAIN ===
const groundTexture = new THREE.TextureLoader().load(
  "Resources/world_save/world_file/mortal_realm/textures/terrain.png"
);
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50);
const groundMat = new THREE.MeshStandardMaterial({ map: groundTexture });
const groundGeo = new THREE.PlaneGeometry(500, 500);
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// === LOAD WORLD OBJECT ===
const mtlLoader = new MTLLoader();
mtlLoader.setPath("Resources/world_save/world_file/mortal_realm/");
mtlLoader.load("void.mtl", (materials) => {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.setPath("Resources/world_save/world_file/mortal_realm/");
  objLoader.load(
    "void.obj",
    (object) => {
      object.scale.set(1, 1, 1);
      object.position.set(0, 0, 0);
      scene.add(object);
    },
    (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
    (error) => console.error("Error loading OBJ:", error)
  );
});

// === PAUSE MENU ===
const pauseMenu = document.getElementById("pauseMenu");
const resumeBtn = document.getElementById("resumeBtn");
let paused = false;

function togglePause(show) {
  paused = show;
  pauseMenu.style.display = paused ? "flex" : "none";
  document.body.style.cursor = paused ? "default" : "none";
}

resumeBtn.addEventListener("click", () => togglePause(false));

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") togglePause(true);
});

window.addEventListener("keyup", (e) => {
  // Holding ESC must unhide cursor
  if (e.key === "Escape") {
    togglePause(true);
  }
});

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    controls.update();
    renderer.render(scene, camera);
  }
}
animate();

// === HANDLE RESIZE ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
