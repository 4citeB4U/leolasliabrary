import * as THREE from 'three';
import { stateManager } from './state-manager.js';

export class GameInputController {
  constructor(canvas, roomId) {
    this.canvas = canvas;
    this.roomId = roomId;
    this.keys = { w: false, a: false, s: false, d: false, e: false, arrowdown: false };
    this.touch = { pull: false, yarnover: false };
    this.stitches = 0;
    this.score = 0;
    this.targetStitches = 10;
    this.isHookTurned = false;

    this.initWebGL();
    this.initKeyboard();
    this.initTouch();
    this.initUI();
    this.loadProgress();
  }

  initWebGL() {
    const width = this.canvas.clientWidth || 700;
    const height = this.canvas.clientHeight || 380;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.8, 6.5);
    this.camera.lookAt(0, 0, 0);

    // Warm Clay Lighting
    const ambient = new THREE.AmbientLight(0xfff3e6, 0.9);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(4, 8, 5);
    this.scene.add(dirLight);

    // Workbench Table Surface
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb38656, roughness: 0.8 });
    const tableGeo = new THREE.BoxGeometry(9, 0.4, 6);
    const table = new THREE.Mesh(tableGeo, woodMat);
    table.position.y = -1.2;
    this.scene.add(table);

    // Clay Crochet Hook
    const hookMat = new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.5, metalness: 0.2 });
    this.hookGroup = new THREE.Group();

    // Hook handle
    const handleGeo = new THREE.CylinderGeometry(0.14, 0.18, 3.2, 20);
    const handle = new THREE.Mesh(handleGeo, hookMat);
    handle.rotation.z = Math.PI / 2;
    this.hookGroup.add(handle);

    // Hook tip
    const tipGeo = new THREE.TorusGeometry(0.25, 0.1, 16, 24, Math.PI * 0.8);
    const tip = new THREE.Mesh(tipGeo, hookMat);
    tip.position.set(1.6, 0.12, 0);
    tip.rotation.z = -Math.PI / 3;
    this.hookGroup.add(tip);

    this.hookGroup.position.set(-0.5, 0, 0);
    this.scene.add(this.hookGroup);

    // Yarn Ball
    const yarnMat = new THREE.MeshStandardMaterial({ color: 0xdf6d5c, roughness: 0.9 });
    const yarnGeo = new THREE.SphereGeometry(0.7, 24, 24);
    this.yarnMesh = new THREE.Mesh(yarnGeo, yarnMat);
    this.yarnMesh.position.set(-2.8, -0.4, 0.5);
    this.scene.add(this.yarnMesh);

    // Stitch Loops Container
    this.loopsGroup = new THREE.Group();
    this.scene.add(this.loopsGroup);

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initUI() {
    let stats = document.getElementById('workbench-stats');
    if (!stats) {
      stats = document.createElement('div');
      stats.id = 'workbench-stats';
      stats.style.cssText = 'width: 100%; display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: bold; color: var(--clay-wood-dark); font-size: 1.1rem;';
      stats.innerHTML = `
        <span>Room: ${this.roomId.toUpperCase()}</span>
        <span id="stat-stitches">Loops: 0 / ${this.targetStitches}</span>
        <span id="stat-score">Score: 0</span>
      `;
      this.canvas.parentElement.insertBefore(stats, this.canvas);
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = true;
      if (k === 'e') this.handleYarnOver();
      if (k === 's' || k === 'arrowdown') this.handlePull();
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k in this.keys) this.keys[k] = false;
    });
  }

  initTouch() {
    const btnYarn = document.getElementById('btn-yarnover');
    const btnPull = document.getElementById('btn-pull');

    if (btnYarn) {
      btnYarn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleYarnOver();
      });
    }

    if (btnPull) {
      btnPull.addEventListener('click', (e) => {
        e.preventDefault();
        this.handlePull();
      });
    }
  }

  handleYarnOver() {
    this.isHookTurned = !this.isHookTurned;
    this.hookGroup.rotation.x = this.isHookTurned ? 0.8 : 0;
    this.hookGroup.position.x = this.isHookTurned ? -0.2 : -0.5;
  }

  handlePull() {
    this.stitches += 1;
    this.score += 15;

    // Visual feedback: add a loop mesh
    const loopGeo = new THREE.TorusGeometry(0.2, 0.08, 12, 20);
    const loopMat = new THREE.MeshStandardMaterial({ color: 0xdf6d5c, roughness: 0.85 });
    const loop = new THREE.Mesh(loopGeo, loopMat);
    loop.position.set(0.6 + (this.stitches * 0.25), -0.1, 0);
    loop.rotation.y = Math.PI / 4;
    this.loopsGroup.add(loop);

    // Bounce hook
    this.hookGroup.position.y = 0.3;
    setTimeout(() => {
      this.hookGroup.position.y = 0;
      this.hookGroup.rotation.x = 0;
      this.isHookTurned = false;
    }, 150);

    this.updateStats();

    const isComplete = this.stitches >= this.targetStitches;
    this.saveProgress(this.score, isComplete);
  }

  updateStats() {
    const stitchEl = document.getElementById('stat-stitches');
    const scoreEl = document.getElementById('stat-score');
    if (stitchEl) stitchEl.textContent = `Loops: ${this.stitches} / ${this.targetStitches}`;
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
  }

  async loadProgress() {
    await stateManager.ready;
    const state = stateManager.snapshot();
    const gameData = state.games[this.roomId] || { complete: false, bestScore: 0, progress: 0 };
    this.score = gameData.bestScore || 0;
    this.updateStats();
  }

  async saveProgress(score, isComplete) {
    const currentBest = stateManager.snapshot()?.games[this.roomId]?.bestScore || 0;
    await stateManager.setGame(this.roomId, {
      bestScore: Math.max(score, currentBest),
      complete: isComplete,
      progress: Math.min(100, Math.round((this.stitches / this.targetStitches) * 100))
    });

    if (isComplete) {
      const stats = document.getElementById('workbench-stats');
      if (stats && !document.getElementById('complete-banner')) {
        const banner = document.createElement('div');
        banner.id = 'complete-banner';
        banner.style.cssText = 'color: #3b5a15; background: #eef5e2; border: 1px solid #6b8e23; padding: 8px 16px; border-radius: 8px; margin-top: 8px; text-align: center; font-weight: bold;';
        banner.textContent = `✓ Room Completed! Mastery recorded in Library Archives.`;
        this.canvas.parentElement.insertBefore(banner, this.canvas.nextSibling);
      }
    }
  }

  onResize() {
    const width = this.canvas.clientWidth || 700;
    const height = this.canvas.clientHeight || 380;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const time = performance.now() * 0.001;

    if (this.yarnMesh) {
      this.yarnMesh.rotation.y = time * 0.2;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-init
const room = new URLSearchParams(window.location.search).get('room') || 'loop';
const canvas = document.getElementById('webgl-workbench');
if (canvas) new GameInputController(canvas, room);
