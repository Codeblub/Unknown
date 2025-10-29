import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { MTLLoader } from './libs/MTLLoader.js';
import { OBJLoader } from './libs/OBJLoader.js';

let scene, camera, renderer, controls;
let loadingText = document.getElementById('loading');

init();
loadWorld();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 100;

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(30, 100, 30);
  scene.add(directional);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function loadWorld() {
  const worldPath = 'Resources/world_save/mortal_realm/';
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath(worldPath);
  mtlLoader.load('a.mtl', materials => {
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath(worldPath);
    objLoader.load(
      'a.obj',
      obj => {
        obj.scale.set(1, 1, 1);
        obj.position.set(0, 0, 0);
        scene.add(obj);
        loadingText.style.display = 'none';
        console.log('World successfully loaded!');
      },
      xhr => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          loadingText.textContent = `Loading world... ${percent.toFixed(1)}%`;
        }
      },
      error => {
        console.error('Failed to load OBJ:', error);
        loadingText.textContent = 'Error loading world.';
      }
    );
  },
  error => {
    console.error('Failed to load MTL:', error);
    loadingText.textContent = 'Error loading materials.';
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

