import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/OBJLoader.js";

let scene, camera, renderer, controls;
let clock = new THREE.Clock();

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 10);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(-3, 10, -10);
  scene.add(dirLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = true;

  // === Load world ===
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();

  mtlLoader.setPath("./Resources/world_save/mortal_realm/");
  mtlLoader.setResourcePath("./Resources/world_save/mortal_realm/tex/");

  const loadingScreen = document.getElementById("loadingScreen");
  const progressBar = document.getElementById("progressBar");
  const loadingText = document.getElementById("loadingText");

  mtlLoader.load(
    "a.mtl",
    (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.setPath("./Resources/world_save/mortal_realm/");

      const manager = new THREE.LoadingManager();
      manager.onProgress = (item, loaded, total) => {
        const percent = (loaded / total) * 100;
        progressBar.style.width = `${percent}%`;
        loadingText.textContent = `Loading ${Math.round(percent)}%`;
      };

      objLoader.manager = manager;

      objLoader.load(
        "a.obj",
        (object) => {
          object.scale.set(1, 1, 1);
          scene.add(object);
          console.log("World loaded!");
          loadingScreen.style.display = "none";
        },
        (xhr) => {
          const percent = (xhr.loaded / xhr.total) * 100;
          progressBar.style.width = `${percent}%`;
        },
        (error) => {
          console.error("Error loading OBJ world:", error);
        }
      );
    },
    undefined,
    (error) => {
      console.error("Error loading MTL:", error);
    }
  );

  // Window resize
  window.addEventListener("resize", onWindowResize);

  // Pause overlay logic
  const overlay = document.getElementById("overlay");
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      overlay.style.display = "block";
      document.exitPointerLock();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
      overlay.style.display = "none";
      renderer.domElement.requestPointerLock();
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
