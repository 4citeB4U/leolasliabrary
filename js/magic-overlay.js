import * as THREE from 'three';
import { stateManager } from './state-manager.js';
import { SistaDialogueManager } from './sista-dialogue.js';

export class MagicWorldController {
  constructor() {
    this.canvas = document.getElementById('magic-canvas-overlay');
    this.dialogue = new SistaDialogueManager();
    this.phase = 'exterior'; // 'exterior' | 'desk' | 'interior'
    this.soundEnabled = true;

    this.initThreeOverlay();
    this.initTransitions();
    this.initCardModal();
    this.initAudioContext();
    this.hydrateInitialState();
  }

  initThreeOverlay() {
    if (!this.canvas) return;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 10;

    // Ambient floating golden dust motes (Disney/Pixar magic)
    const particleCount = 45;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Golden glowing clay speckles
    const material = new THREE.PointsMaterial({
      color: 0xffd97d,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.speeds = speeds;
    this.scene.add(this.particles);

    // Magical Rotating Star Ring (anchored near Leola's handoff card)
    const ringGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffe285,
      transparent: true,
      opacity: 0.8
    });
    this.magicRing = new THREE.Mesh(ringGeo, ringMat);
    this.magicRing.position.set(-0.2, 0.2, 2);
    this.magicRing.visible = false;
    this.scene.add(this.magicRing);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const time = performance.now() * 0.001;

    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < this.speeds.length; i++) {
        pos[i * 3 + 1] += Math.sin(time + i) * 0.005 + 0.008 * this.speeds[i];
        if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
        pos[i * 3] += Math.cos(time * 0.5 + i) * 0.004;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.magicRing && this.magicRing.visible) {
      this.magicRing.rotation.z = time * 0.8;
      this.magicRing.rotation.x = Math.sin(time * 1.2) * 0.2 + 0.2;
      this.magicRing.scale.setScalar(1.0 + Math.sin(time * 3) * 0.05);
    }

    this.renderer.render(this.scene, this.camera);
  }

  initAudioContext() {
    this.audioCtx = null;
  }

  ensureAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playDoorSlideSound() {
    this.ensureAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.8);
  }

  playChimeSound() {
    this.ensureAudio();
    if (!this.audioCtx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
      }, i * 90);
    });
  }

  setPhase(targetPhase) {
    this.phase = targetPhase;
    document.body.dataset.worldPhase = targetPhase;

    // Update switcher buttons
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.viewTarget === targetPhase);
    });

    if (targetPhase === 'desk') {
      if (this.magicRing) this.magicRing.visible = true;
      const state = stateManager.snapshot();
      if (state.guest?.name) {
        this.dialogue.say('returning-visitor', `Welcome back, ${state.guest.name}! Here's your library card. A little wonder, a place to belong.`);
      } else {
        this.dialogue.say('welcome-greeting');
      }
    } else if (targetPhase === 'exterior') {
      if (this.magicRing) this.magicRing.visible = false;
      this.dialogue.say('first-arrival');
    } else if (targetPhase === 'interior') {
      if (this.magicRing) this.magicRing.visible = false;
      this.dialogue.say('reading-table-seated', 'Enjoy the quiet reading table and our collection of books.');
    }
  }

  initTransitions() {
    // Open Doors Button on exterior path
    document.getElementById('btn-open-doors')?.addEventListener('click', () => {
      this.playDoorSlideSound();
      this.playChimeSound();
      this.setPhase('desk');
    });

    // View Switcher buttons
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setPhase(btn.dataset.viewTarget);
      });
    });

    // Navigation links in header
    document.querySelectorAll('[data-route-phase]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setPhase(link.dataset.routePhase);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  async hydrateInitialState() {
    await stateManager.ready;
    const state = stateManager.snapshot();
    this.updateCardDisplay(state);
    // Start at exterior entrance
    this.setPhase('exterior');
  }

  initCardModal() {
    const modal = document.getElementById('card-modal-backdrop');
    const openBtn = document.getElementById('btn-open-my-card');
    const closeBtn = document.getElementById('btn-close-card-modal');
    const exploreBtn = document.getElementById('btn-card-explore');
    const editBtn = document.getElementById('btn-card-edit');

    openBtn?.addEventListener('click', () => {
      this.openCardModal();
    });

    closeBtn?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    exploreBtn?.addEventListener('click', () => {
      modal?.classList.remove('active');
      this.setPhase('desk');
    });

    editBtn?.addEventListener('click', async () => {
      const current = stateManager.snapshot()?.guest?.name || 'Jasmine Lee';
      const next = prompt('Enter member name for your library card:', current);
      if (next && next.trim()) {
        const cardId = 'LL-' + Math.random().toString(36).substring(2, 12).toUpperCase();
        await stateManager.patch({
          guest: {
            name: next.trim(),
            cardId: cardId,
            issuedAt: new Date().toISOString()
          }
        });
        this.updateCardDisplay(stateManager.snapshot());
        this.playChimeSound();
      }
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  openCardModal() {
    const state = stateManager.snapshot();
    this.updateCardDisplay(state);
    this.playChimeSound();
    document.getElementById('card-modal-backdrop')?.classList.add('active');
  }

  updateCardDisplay(state) {
    const nameEl = document.getElementById('card-display-name');
    const numberEl = document.getElementById('card-display-number');
    const dateEl = document.getElementById('card-display-date');

    const name = state?.guest?.name || 'Jasmine Lee';
    const number = state?.guest?.cardId || 'LL-7AE0743DE58C';
    const date = state?.guest?.issuedAt
      ? new Date(state.guest.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Sep 17, 2026';

    if (nameEl) nameEl.textContent = name;
    if (numberEl) numberEl.textContent = number;
    if (dateEl) dateEl.textContent = date;
  }
}

// Auto-instantiate
window.__magicWorld = new MagicWorldController();
