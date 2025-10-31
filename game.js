// Import local Three.js and loaders
import * as THREE from './Resources/libs/three.module.js';
import { MTLLoader } from './Resources/libs/MTLLoader.js';
import { OBJLoader } from './Resources/libs/OBJLoader.js';
import { OrbitControls } from './Resources/libs/OrbitControls.js';

let scene, camera, renderer, controls;
const loadingText = document.getElementById('loading');

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Ambient + directional lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Load OBJ + MTL
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath('./Resources/world_save/mortal_realm/');
  mtlLoader.load('a.mtl', (materials) => {
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('./Resources/world_save/mortal_realm/');
    objLoader.load(
      'a.obj',
      (object) => {
        scene.add(object);
        loadingText.style.display = 'none';
      },
      (xhr) => {
        loadingText.textContent = `Loading world... ${(
          (xhr.loaded / xhr.total) *
          100
        ).toFixed(1)}%`;
      },
      (error) => {
        loadingText.textContent = 'Error loading world.';
        console.error('Error loading OBJ:', error);
      }
    );
  });

  window.addEventListener('resize', onWindowResize);
  animate();
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
