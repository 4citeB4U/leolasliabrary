import * as THREE from 'three';
import { QRCodeGenerator } from './qr-generator.js';
import { stateManager } from './state-manager.js';

/**
 * Card3DInspector: Renders a true 3D claymation library card with interactive
 * 360 rotation, physics tilt, master clay artwork, and a scannable QR code for instant login.
 */
export class Card3DInspector {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0.002, y: 0.005 };
    this.cardMesh = null;
    this.isFlipped = false;

    this.initScene();
    this.build3DCard();
    this.initInteraction();
    this.animate();

    // Check for QR login parameters in URL
    this.checkQRAutoLogin();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0, 4.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x8a6240, 1.6);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    keyLight.position.set(3, 4, 5);
    this.scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xe8caa0, 1.2, 10);
    fillLight.position.set(-3, -2, 2);
    this.scene.add(fillLight);
  }

  async build3DCard() {
    await stateManager.ready;
    const state = stateManager.snapshot();
    const guest = state?.guest || { name: 'Jasmine Lee', cardId: 'LL-7AE0743DE58C', email: 'jasmine@leolaslibrary.org' };

    // Card dimensions (aspect ratio ~1.42 matching master clay artwork)
    const cardWidth = 2.4;
    const cardHeight = 1.69;
    const cardThickness = 0.07;
    const radius = 0.12;

    // Generate rounded card geometry
    const shape = new THREE.Shape();
    const x = -cardWidth / 2;
    const y = -cardHeight / 2;
    const w = cardWidth;
    const h = cardHeight;
    const r = radius;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
      depth: cardThickness,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Create Front Texture with Master Art + Overlays + QR Code
    const frontTexture = await this.createFrontCardTexture(guest);
    const backTexture = this.createBackCardTexture(guest);

    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.72,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const backMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x5a341a, // Rich terracotta clay edge
      roughness: 0.85,
      metalness: 0.08
    });

    // Clay card base body
    this.cardMesh = new THREE.Mesh(geometry, edgeMat);

    // Front face plane with perfect 1:1 UV mapping (positioned outside bevel peak)
    const frontPlaneGeo = new THREE.PlaneGeometry(cardWidth * 0.96, cardHeight * 0.96);
    const frontPlane = new THREE.Mesh(frontPlaneGeo, frontMat);
    frontPlane.position.z = 0.06;
    this.cardMesh.add(frontPlane);

    // Add back face mesh attached directly
    const backPlaneGeo = new THREE.PlaneGeometry(cardWidth * 0.96, cardHeight * 0.96);
    const backPlane = new THREE.Mesh(backPlaneGeo, backMat);
    backPlane.rotation.y = Math.PI;
    backPlane.position.z = -0.06;
    this.cardMesh.add(backPlane);

    // Initial slight welcoming tilt
    this.cardMesh.rotation.x = 0.08;
    this.cardMesh.rotation.y = -0.15;

    this.scene.add(this.cardMesh);
  }

  async createFrontCardTexture(guest) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // 1. Draw base master artwork
    const img = new Image();
    img.src = 'assets/images/magical-library-card-clean.png';
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, 1024, 720);
    } else {
      ctx.fillStyle = '#ecdcb9';
      ctx.fillRect(0, 0, 1024, 720);
    }

    // 2. Dynamic Member Name, Number, and Date stamped in cream pill slots
    const name = guest.name || 'Jasmine Lee';
    const number = guest.cardId || 'LL-7AE0743DE58C';
    const date = guest.issuedAt
      ? new Date(guest.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Sep 17, 2026';

    ctx.fillStyle = '#f4ece0';
    // Name pill cover
    ctx.roundRect(455, 348, 335, 44, 8);
    ctx.fill();
    // Number pill cover
    ctx.roundRect(455, 398, 335, 44, 8);
    ctx.fill();
    // Date pill cover
    ctx.roundRect(455, 448, 335, 44, 8);
    ctx.fill();

    // Text Stamping
    ctx.fillStyle = '#3a200e';
    ctx.font = 'bold 25px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, 470, 380);

    ctx.font = 'bold 21px "Courier New", monospace';
    ctx.fillStyle = '#442310';
    ctx.fillText(number, 470, 429);

    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillStyle = '#553018';
    ctx.fillText(date, 470, 479);

    // 3. GENERATE DYNAMIC LOGIN QR CODE
    const loginUrl = `${window.location.origin}${window.location.pathname}?login=${encodeURIComponent(number)}&user=${encodeURIComponent(name)}`;
    this.currentLoginUrl = loginUrl;

    const qrCanvas = QRCodeGenerator.generateCanvas(loginUrl, 130, '#2d180b', '#fffaf2');

    // Stamp QR code in dedicated lower right badge
    const qrX = 810;
    const qrY = 485;
    const qrSize = 135;

    // Clay badge frame for QR Code
    ctx.fillStyle = '#fffaf2';
    ctx.strokeStyle = '#6b3e21';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 14);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Mini QR caption
    ctx.fillStyle = '#6b3e21';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("SCAN TO LOGIN", qrX + qrSize / 2, qrY + qrSize + 22);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.frontCanvas = canvas;
    return texture;
  }

  createBackCardTexture(guest) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Warm clay card background
    ctx.fillStyle = '#54321c';
    ctx.fillRect(0, 0, 1024, 720);

    // Clay border inlay
    ctx.strokeStyle = '#8a532d';
    ctx.lineWidth = 12;
    ctx.strokeRect(24, 24, 976, 672);

    // Magnetic strip
    ctx.fillStyle = '#1c0f08';
    ctx.fillRect(0, 80, 1024, 110);

    // Embossed Gold Header
    ctx.fillStyle = '#f0c775';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("LEOLA'S LEARNING LIBRARY", 512, 260);

    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = '#e8caa0';
    ctx.fillText("Official Handcrafted Membership Card", 512, 295);

    // Signature strip
    ctx.fillStyle = '#fff9f0';
    ctx.fillRect(120, 340, 784, 80);
    ctx.fillStyle = '#2d180b';
    ctx.font = 'italic 28px "Brush Script MT", cursive, serif';
    ctx.textAlign = 'left';
    ctx.fillText(guest.name || 'Jasmine Lee', 160, 390);

    ctx.fillStyle = '#eedcbd';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText("AUTHORIZED MEMBER SIGNATURE", 640, 408);

    // Description
    ctx.fillStyle = '#eedcbd';
    ctx.font = '19px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("Present this card at the front desk to borrow books, unlock 3D lessons,", 512, 475);
    ctx.fillText("and access the 3D Arcade. Your progress is saved automatically.", 512, 510);

    // Barcode at bottom
    ctx.fillStyle = '#fff9f0';
    ctx.fillRect(280, 560, 464, 90);

    // Draw barcode bars
    ctx.fillStyle = '#1a0d06';
    let bx = 300;
    for (let i = 0; i < 60; i++) {
      const barW = (i % 3 === 0 || i % 7 === 0) ? 5 : 2;
      ctx.fillRect(bx, 570, barW, 55);
      bx += barW + ((i % 2 === 0) ? 3 : 2);
      if (bx > 720) break;
    }

    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(guest.cardId || 'LL-7AE0743DE58C', 512, 642);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  initInteraction() {
    let startX = 0;
    let startY = 0;

    const onPointerDown = (e) => {
      this.isDragging = true;
      startX = e.clientX || e.touches?.[0]?.clientX;
      startY = e.clientY || e.touches?.[0]?.clientY;
      this.previousMousePosition = { x: startX, y: startY };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || !this.cardMesh) return;
      const x = e.clientX || e.touches?.[0]?.clientX;
      const y = e.clientY || e.touches?.[0]?.clientY;
      const deltaX = x - this.previousMousePosition.x;
      const deltaY = y - this.previousMousePosition.y;

      this.cardMesh.rotation.y += deltaX * 0.008;
      this.cardMesh.rotation.x += deltaY * 0.008;

      this.rotationVelocity = { x: deltaY * 0.004, y: deltaX * 0.004 };
      this.previousMousePosition = { x, y };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  flipCard() {
    if (!this.cardMesh) return;
    this.isFlipped = !this.isFlipped;
    const targetY = this.isFlipped ? Math.PI : 0;

    // Smooth flip
    const startY = this.cardMesh.rotation.y;
    let progress = 0;
    const step = () => {
      progress += 0.06;
      this.cardMesh.rotation.y = THREE.MathUtils.lerp(startY, targetY, Math.min(1, progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    step();
  }

  downloadCardImage() {
    if (!this.frontCanvas) return;
    const link = document.createElement('a');
    link.download = `Leolas-Library-Card-${Date.now()}.png`;
    link.href = this.frontCanvas.toDataURL('image/png');
    link.click();
  }

  copyLoginLink() {
    if (this.currentLoginUrl) {
      navigator.clipboard.writeText(this.currentLoginUrl).then(() => {
        alert("✦ Magical Login Link copied! Scan the QR code or use this link on any device to log straight into your saved library world.");
      });
    }
  }

  async checkQRAutoLogin() {
    const params = new URLSearchParams(window.location.search);
    const loginCard = params.get('login');
    const user = params.get('user');

    if (loginCard && user) {
      await stateManager.ready;
      await stateManager.patch({
        guest: {
          name: decodeURIComponent(user),
          cardId: decodeURIComponent(loginCard),
          issuedAt: new Date().toISOString()
        }
      });
      console.log(`[QR-Login] Authenticated member: ${user} (${loginCard})`);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!this.isDragging && this.cardMesh) {
      // Gentle auto-sway physics
      this.cardMesh.rotation.y += this.rotationVelocity.y;
      this.cardMesh.rotation.x += this.rotationVelocity.x;
      this.rotationVelocity.x *= 0.95;
      this.rotationVelocity.y *= 0.95;

      // Soft ambient bob
      const time = performance.now() * 0.0015;
      this.cardMesh.position.y = Math.sin(time) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.canvas) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
