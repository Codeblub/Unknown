
import * as THREE from './libs/three.module.js';
import { OBJLoader } from './libs/OBJLoader.js';
import { MTLLoader } from './libs/MTLLoader.js';

let scene, camera, renderer;
let world;
let clock = new THREE.Clock();
let isPaused = false;
let loadingScreen = document.getElementById('loadingScreen');
let pauseMenu = document.getElementById('pauseMenu');
let resumeBtn = document.getElementById('resumeBtn');

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 15);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
  hemi.position.set(0, 200, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(50, 200, 100);
  scene.add(dir);

  // Ground reflection
  const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
  const waterMaterial = new THREE.MeshPhongMaterial({
    color: 0x3fa9f5,
    shininess: 80,
    reflectivity: 0.7,
    transparent: true,
    opacity: 0.7,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  scene.add(water);

  // Controls placeholder
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') togglePause();
  });

  resumeBtn.addEventListener('click', () => {
    togglePause(false);
  });

  // Load world
  loadWorld();
}

function loadWorld() {
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath('Resources/world_save/mortal_realm/');
  mtlLoader.load('a.mtl', (mtl) => {
    mtl.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(mtl);
    objLoader.setPath('Resources/world_save/mortal_realm/');
    objLoader.load(
      'a.obj',
      (obj) => {
        obj.traverse((child) => {
          if (child.isMesh) {
            child.material.map.magFilter = THREE.NearestFilter;
            child.material.map.minFilter = THREE.NearestFilter;
          }
        });
        obj.scale.set(0.1, 0.1, 0.1);
        obj.position.set(0, 0, 0);
        scene.add(obj);
        world = obj;
        loadingScreen.style.display = 'none';
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('Error loading world:', error);
      }
    );
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    const delta = clock.getDelta();
    renderer.render(scene, camera);
  }
}

function togglePause(force) {
  if (force === false) {
    isPaused = false;
    pauseMenu.style.display = 'none';
    document.exitPointerLock();
  } else {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'flex' : 'none';
    if (!isPaused) document.exitPointerLock();
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
