import * as THREE from 'three';
import { stateManager } from './state-manager.js';

export class ClayWorldScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.setupLighting();
    this.createClayLibraryScene();
    this.updateCameraForState(stateManager.snapshot()?.location?.view || 'outside');

    stateManager.addEventListener('change', (e) => {
      const targetView = e.detail?.state?.location?.view;
      if (targetView && targetView !== this.currentView) {
        this.animateTransition(targetView);
      }
    });

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffecd2, 0.85);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    sunLight.position.set(6, 12, 8);
    this.scene.add(sunLight);

    const fillLight = new THREE.PointLight(0xc4a47c, 0.8, 20);
    fillLight.position.set(-4, 3, 2);
    this.scene.add(fillLight);
  }

  createClayLibraryScene() {
    this.clayGroup = new THREE.Group();

    // Clay materials with soft matte finish
    const clayFloorMat = new THREE.MeshStandardMaterial({
      color: 0xdec7a4,
      roughness: 0.85,
      metalness: 0.05
    });

    const clayWoodMat = new THREE.MeshStandardMaterial({
      color: 0x7c4e2a,
      roughness: 0.75,
      metalness: 0.1
    });

    const clayYarnMat = new THREE.MeshStandardMaterial({
      color: 0xd95c50,
      roughness: 0.9,
      metalness: 0.0
    });

    const clayBookMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
      metalness: 0.05
    });

    // Floor slab
    const floorGeo = new THREE.CylinderGeometry(8, 8.5, 0.6, 32);
    const floor = new THREE.Mesh(floorGeo, clayFloorMat);
    floor.position.y = -1.8;
    this.clayGroup.add(floor);

    // Cozy Clay Desk
    const deskTopGeo = new THREE.BoxGeometry(4.5, 0.3, 2.2);
    const deskTop = new THREE.Mesh(deskTopGeo, clayWoodMat);
    deskTop.position.set(0, -0.6, 0);
    this.clayGroup.add(deskTop);

    // Desk Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.2, 16);
    const legPositions = [
      [-1.9, -1.2, -0.8],
      [1.9, -1.2, -0.8],
      [-1.9, -1.2, 0.8],
      [1.9, -1.2, 0.8]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, clayWoodMat);
      leg.position.set(x, y, z);
      this.clayGroup.add(leg);
    });

    // Clay Books on the Desk
    const bookGeo = new THREE.BoxGeometry(0.7, 0.9, 0.25);
    const book1 = new THREE.Mesh(bookGeo, clayBookMat);
    book1.position.set(-1.2, -0.2, 0.2);
    book1.rotation.y = 0.35;
    this.clayGroup.add(book1);

    const bookMat2 = new THREE.MeshStandardMaterial({ color: 0x3d688f, roughness: 0.8 });
    const book2 = new THREE.Mesh(bookGeo, bookMat2);
    book2.position.set(-1.0, -0.2, 0.05);
    book2.rotation.y = 0.2;
    this.clayGroup.add(book2);

    // Clay Yarn Ball
    const yarnGeo = new THREE.SphereGeometry(0.4, 24, 24);
    this.yarnBall = new THREE.Mesh(yarnGeo, clayYarnMat);
    this.yarnBall.position.set(1.2, -0.15, 0.1);
    this.clayGroup.add(this.yarnBall);

    // Small floating clay orbs (whimsical cozy dust particles)
    this.floatingOrbs = [];
    const orbMat = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), orbMat);
      orb.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 3 - 0.5,
        (Math.random() - 0.5) * 6
      );
      this.clayGroup.add(orb);
      this.floatingOrbs.push({ mesh: orb, baseY: orb.position.y, speed: 0.8 + Math.random() * 1.2 });
    }

    this.scene.add(this.clayGroup);
  }

  updateCameraForState(view) {
    this.currentView = view;
    if (view === 'outside') {
      this.targetCamPos = new THREE.Vector3(0, 1.5, 9);
      this.targetCamLook = new THREE.Vector3(0, -0.4, 0);
    } else if (view === 'entering') {
      this.targetCamPos = new THREE.Vector3(0, 0.5, 5);
      this.targetCamLook = new THREE.Vector3(0, -0.3, 0);
    } else if (view === 'inside') {
      this.targetCamPos = new THREE.Vector3(0, 0.2, 3.5);
      this.targetCamLook = new THREE.Vector3(0, -0.4, 0);
    } else {
      this.targetCamPos = new THREE.Vector3(0, 1.5, 9);
      this.targetCamLook = new THREE.Vector3(0, -0.4, 0);
    }

    if (!this.camera.position.x && !this.camera.position.y && !this.camera.position.z) {
      this.camera.position.copy(this.targetCamPos);
      this.camera.lookAt(this.targetCamLook);
    }
  }

  animateTransition(targetView) {
    this.updateCameraForState(targetView);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // Smooth camera lerp towards target
    if (this.targetCamPos) {
      this.camera.position.lerp(this.targetCamPos, 0.05);
      this.camera.lookAt(this.targetCamLook);
    }

    // Gentle rotation of yarn ball
    if (this.yarnBall) {
      this.yarnBall.rotation.y = time * 0.4;
      this.yarnBall.rotation.x = Math.sin(time * 0.5) * 0.2;
    }

    // Gentle float of clay group
    if (this.clayGroup) {
      this.clayGroup.position.y = Math.sin(time * 0.8) * 0.08;
    }

    // Bobbing orbs
    if (this.floatingOrbs) {
      this.floatingOrbs.forEach((item) => {
        item.mesh.position.y = item.baseY + Math.sin(time * item.speed) * 0.2;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-init if canvas exists
const canvas = document.getElementById('clay-world-canvas');
if (canvas) new ClayWorldScene(canvas);
