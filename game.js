import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/MTLLoader.js";

// Basic setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(100, 200, 100);
sun.castShadow = true;
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// Ground plane for safety
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({ color: 0x228b22 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Player setup
const player = new THREE.Object3D();
player.position.set(0, 5, 0);
scene.add(player);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.enablePan = false;
controls.enableZoom = true;

// Pause menu system
const pauseMenu = document.getElementById("pauseMenu");
const resumeBtn = document.getElementById("resumeBtn");
const quitBtn = document.getElementById("quitBtn");

let paused = false;
let escHeld = false;

resumeBtn.addEventListener("click", () => togglePause(false));
quitBtn.addEventListener("click", () => {
  alert("Thanks for playing!");
  togglePause(false);
});

function togglePause(state) {
  paused = state;
  pauseMenu.classList.toggle("active", state);
  if (state) {
    document.exitPointerLock();
  } else {
    document.body.requestPointerLock();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") escHeld = true;
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Escape") {
    escHeld = false;
    togglePause(!paused);
  }
});

// Load world
const mtlLoader = new MTLLoader();
mtlLoader.setPath("Resources/world_save/mortal_realm/");
mtlLoader.load("a.mtl", (materials) => {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.setPath("Resources/world_save/mortal_realm/");
  objLoader.load(
    "a.obj",
    (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material.map) {
            child.material.map.magFilter = THREE.NearestFilter;
            child.material.map.minFilter = THREE.NearestFilter;
          }
        }
      });
      object.scale.set(1, 1, 1);
      object.position.set(0, 0, 0);
      scene.add(object);
      console.log("✅ World loaded successfully!");

      const box = new THREE.Box3().setFromObject(object);
      player.position.y = box.max.y + 2;
    },
    (xhr) => console.log(`Loading world: ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`),
    (err) => console.error("❌ Failed to load world", err)
  );
});

// Dialogue box
const dialogueBox = document.getElementById("dialogueBox");
const dialogueText = document.getElementById("dialogueText");
const dialogueClose = document.getElementById("dialogueClose");

dialogueClose.addEventListener("click", () => {
  dialogueBox.classList.remove("active");
  document.body.requestPointerLock();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyE") {
    dialogueBox.classList.add("active");
    document.exitPointerLock();
  }
});

// Handle resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render loop
function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    controls.update();
    renderer.render(scene, camera);
  }
}
animate();

