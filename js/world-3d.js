/*
LEEWAY HEADER â€” DO NOT REMOVE
REGION: UI.APP.3D.WORLD
TAG: UI.WORLD.LLCLAY01.FINAL_RECONSTRUCTION
5WH:
WHAT = Leola's Learning Library interactive 3D world
WHY = Govern exterior, characters, circulation, interactions, and visual acceptance
WHO = LeeWay / Agent Lee
WHERE = js/world-3d.js
WHEN = 2026-09-20
HOW = Three.js governed scene graph with receipt-based verification
AGENTS: AGENT_LEE, COPILOT, QWEN, GEMINI
LICENSE: Project authority
*/

import * as THREE from 'three';
import { ClayCharacter } from './clay-character.js';

/**
 * Leola's Learning Library - Full 3D Interactive World
 * Pure WebGL claymation experience featuring exterior park courtyard,
 * arched glass facade, vaulted glass skylights, grand wall-to-wall 5-tier bookshelves,
 * rolling library ladder, cozy reading nook with plush bunny & mushroom stools,
 * study tables with reading patrons, interactive reception desk with readable 3D books
 * and Stripe donation box, and Leola with her 2-tier rolling book cart.
 */
export class ClayWorld3D extends EventTarget {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.phase = 'outside'; // 'outside' | 'approaching' | 'doors-opening' | 'inside' | 'seated' | 'talking_leola'
    this.keys = new Set();
    this.interactiveObjects = [];
    this.isWalking = false;
    this.walkTarget = null;
    this.walkSpeed = 4.8;
    this.cameraMode = 'first_person'; // 'first_person' | 'third_person'

    this.yaw = 0;
    this.pitch = 0;
    this.isDragging = false;
    this.prevPointerX = 0;
    this.prevPointerY = 0;
    this.isDraggingGlobe = false;
    this.prevGlobePointerX = 0;
    this.globeSpinVelocity = 0.002;
    this.grandGlobeSphere = null;
    this.grandGlobeGroup = null;

    this.flyingBirds = [];
    this.skyClouds = [];
    this.skyBirds = [];
    this.promenadeNPCs = [];
    this.walkableSurfaces = [];
    this.solidObstacles = [];
    this.playerRadius = 0.42;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.clock = new THREE.Clock();

    this.initScene();
    this.initLighting();
    this.initEnvironment();
    this.initAudio();
    this.initEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7eb0d5); // Bright blue sky
    this.scene.fog = new THREE.FogExp2(0xcde1f0, 0.008);

    this.camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, 1.8, 22); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(0, 0, 22);

    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.isMobileDevice = isMobile;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    const maxPR = isMobile ? 1.25 : 1.75;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPR));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    if (this.canvas) {
      this.canvas.style.touchAction = 'none';
    }
  }

  initLighting() {
    // Soft sky and ground bounce ambient light
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x5a7d36, 1.9);
    this.scene.add(hemiLight);

    // Warm brilliant golden sunlight
    this.sun = new THREE.DirectionalLight(0xfff2d0, 2.6);
    this.sun.position.set(16, 28, 18);
    this.sun.castShadow = true;
    const shadowMapSize = this.isMobileDevice ? 1024 : 2048;
    this.sun.shadow.mapSize.width = shadowMapSize;
    this.sun.shadow.mapSize.height = shadowMapSize;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 100;
    this.sun.shadow.camera.left = -30;
    this.sun.shadow.camera.right = 30;
    this.sun.shadow.camera.top = 30;
    this.sun.shadow.camera.bottom = -30;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);

    // Indoor central warm light
    this.indoorLight = new THREE.PointLight(0xffca70, 4.0, 45, 1.2);
    this.indoorLight.position.set(0, 8, -12);
    this.scene.add(this.indoorLight);

    // Desk accent lamp
    this.deskLamp = new THREE.SpotLight(0xffe6b0, 4.5, 18, Math.PI / 3.5, 0.4);
    this.deskLamp.position.set(0, 5.5, -8);
    this.deskLamp.target.position.set(0, 1, -10.5);
    this.scene.add(this.deskLamp);
    this.scene.add(this.deskLamp.target);
  }

  clayMaterial(color, roughness = 0.85, metalness = 0.05) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: roughness,
      metalness: metalness
    });
  }

  createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#689e3a';
    ctx.fillRect(0, 0, 512, 512);

    // Grass blades noise
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 3 + Math.random() * 5;
      ctx.strokeStyle = Math.random() > 0.5 ? '#7db748' : '#55832d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - len);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b77b3e';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankCount = 8;
    const plankHeight = 1024 / plankCount;
    const plankShades = ['#b87c40', '#be8346', '#a96f33', '#c78f4f', '#a0662d', '#b17639'];

    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;
      ctx.fillStyle = plankShades[i % plankShades.length];
      ctx.fillRect(0, y + 2, 1024, plankHeight - 4);

      ctx.strokeStyle = 'rgba(74, 38, 14, 0.12)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 14; g++) {
        const gy = y + Math.random() * plankHeight;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(340, gy + (Math.random() - 0.5) * 8, 680, gy + (Math.random() - 0.5) * 8, 1024, gy);
        ctx.stroke();
      }

      const offsets = [240, 580, 860];
      ctx.fillStyle = '#44220e';
      offsets.forEach(off => {
        const sx = (off + (i % 2) * 380) % 1024;
        ctx.fillRect(sx, y, 3, plankHeight);
      });

      ctx.fillStyle = '#44220e';
      ctx.fillRect(0, y, 1024, 3);
      ctx.fillStyle = 'rgba(255, 235, 190, 0.25)';
      ctx.fillRect(0, y + 3, 1024, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 9);
    return texture;
  }

  createBraidedRugTexture(primaryColor = '#cca378', accentColor = '#94663e') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256, cy = 256;

    for (let r = 240; r > 10; r -= 12) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = (Math.floor(r / 12) % 2 === 0) ? primaryColor : accentColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(60, 30, 10, 0.2)';
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  createCurvedStonePathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d5c4aa';
    ctx.fillRect(0, 0, 512, 512);

    // Flagstone cracks and textures
    ctx.strokeStyle = '#998670';
    ctx.lineWidth = 4;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.strokeRect(x, y, 60 + Math.random() * 40, 40 + Math.random() * 30);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 8);
    return texture;
  }

  createCarvedPlaque(text, x, y, z, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ecdac4';
    ctx.roundRect(16, 16, 480, 736, 32);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#6e4324';
    ctx.stroke();

    ctx.fillStyle = '#4a2b15';
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px Georgia, serif';

    const lines = text.split('\\n');
    const startY = 384 - (lines.length * 30);
    lines.forEach((line, idx) => {
      ctx.fillText(line, 256, startY + idx * 60);
    });

    ctx.fillStyle = '#4a7c59';
    ctx.beginPath();
    ctx.arc(230, startY + lines.length * 60 + 30, 24, 0, Math.PI);
    ctx.arc(282, startY + lines.length * 60 + 30, 24, 0, Math.PI);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const plaqueMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(w, h), plaqueMat);
    plaque.position.set(x, y, z);
    if (x > 0) plaque.rotation.y = -Math.PI / 2;
    else plaque.rotation.y = Math.PI / 2;
    this.scene.add(plaque);
  }

  createSignboard(text, x, y, z, w, h, fontSize = 48) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a2d18';
    ctx.roundRect(8, 8, 1008, 240, 24);
    ctx.fill();
    ctx.strokeStyle = '#e6bd69';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = '#fff4d8';
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signMat);
    signMesh.position.set(x, y, z);
    this.scene.add(signMesh);
    return signMesh;
  }

  initEnvironment() {
    this.buildSkyAndSun();
    this.buildGroundAndCourtyard();
    this.buildBuildingPerimeterWalkway();
    this.buildMilwaukeeBoatHouse();
    this.buildLibraryArchitecture();
    this.buildGlassRoof();
    this.buildGlassDoors();
    this.buildReceptionDesk();
    this.buildInteractiveDeskProps();
    this.buildReadingArea();
    this.buildStudyTablesAndPatrons();
    this.buildBookshelves();
    this.buildArcadeNook();
    this.buildMovieBoothBackWall();
    this.buildTrueSeatedLeolaAvatar();
    this.buildSeatedPatrons();
    this.initCollisionSystem();
    this.initPathDotsSystem();
    this.initThirdPersonAvatar();
  }

  initCollisionSystem() {
    // Solid physical collision boundaries for all furniture and architectural elements
    this.solidObstacles = [
      // 1. Reception Desk (3/4 circular wood desk at center x=0, z=-9.0)
      { type: 'cylinder', x: 0, z: -9.0, r: 4.15, name: 'Reception Desk' },

      // 2. Study Tables with Chairs (East Library Hall - spaced generously 7m from reception desk)
      { type: 'box', minX: 3.8, maxX: 8.6, minZ: -13.2, maxZ: -9.8, name: 'Study Table 1' },
      { type: 'box', minX: 3.8, maxX: 8.6, minZ: -21.2, maxZ: -17.8, name: 'Study Table 2' },

      // 3. Quiet Reading Nook (West Library Hall)
      { type: 'box', minX: -10.8, maxX: -6.2, minZ: -17.5, maxZ: -13.5, name: 'Reading Table & Stools' },
      { type: 'box', minX: -12.6, maxX: -10.4, minZ: -17.0, maxZ: -15.0, name: 'Sage Armchair' },
      { type: 'box', minX: -6.5, maxX: -3.5, minZ: -13.0, maxZ: -10.8, name: 'Stepped Book Stand' },

      // 4. 3D Arcade Cabinet (East Alcove)
      { type: 'box', minX: 11.4, maxX: 14.2, minZ: -21.6, maxZ: -18.4, name: '3D Arcade Cabinet' },

      // 5. Grand Globe Station & Window Bench (Left Back Wall)
      { type: 'cylinder', x: -9.2, z: -33.6, r: 1.15, name: 'Grand Globe Stand' },
      { type: 'box', minX: -13.2, maxX: -10.4, minZ: -35.8, maxZ: -33.6, name: 'Globe Window Bench' },

      // 6. Movie Booth Benches & Back Counter Shelf
      { type: 'box', minX: -2.1, maxX: -0.72, minZ: -36.5, maxZ: -33.8, name: 'Movie Booth Left Bench' },
      { type: 'box', minX: 0.72, maxX: 2.1, minZ: -36.5, maxZ: -33.8, name: 'Movie Booth Right Bench' },
      { type: 'box', minX: -2.1, maxX: 2.1, minZ: -36.7, maxZ: -35.8, name: 'Movie Booth Counter' },

      // 7. Courtyard Solid Props
      { type: 'cylinder', x: -7.5, z: 17.0, r: 1.4, name: 'Courtyard Shade Tree' },
      { type: 'box', minX: -5.4, maxX: -3.0, minZ: 15.3, maxZ: 17.7, name: 'Courtyard Left Bench' },
      { type: 'box', minX: 8.0, maxX: 10.4, minZ: 14.8, maxZ: 17.2, name: 'Courtyard Right Bench' },
      { type: 'box', minX: 6.6, maxX: 9.0, minZ: 19.8, maxZ: 22.2, name: 'Courtyard Lawn Bench South' },
      { type: 'cylinder', x: 6.5, z: 13.0, r: 0.7, name: 'Street Lamp' },
      { type: 'cylinder', x: 4.2, z: 6.5, r: 0.7, name: 'Chalkboard Easel' },
      { type: 'box', minX: -18.0, maxX: -14.0, minZ: 9.5, maxZ: 14.5, name: 'Lake Bridge' },

      // 8. Outdoor Lakefront Solid Props & Border Rocks
      { type: 'box', minX: -6.0, maxX: -3.0, minZ: 24.2, maxZ: 25.4, name: 'Milwaukee Monument Sign' },
      { type: 'box', minX: -24.0, maxX: -2.8, minZ: 23.4, maxZ: 24.1, name: 'West Grass Border Rocks' },
      { type: 'box', minX: 2.8, maxX: 24.0, minZ: 23.4, maxZ: 24.1, name: 'East Grass Border Rocks' },
      { type: 'box', minX: 21.0, maxX: 47.0, minZ: 5.0, maxZ: 17.5, name: 'Milwaukee Lakefront Boathouse Pavilion' }
    ];
  }

  resolveCollisions(pos) {
    const r = this.playerRadius;

    // 1. Room Boundary Clamping & Bookshelf Standoff (Never walk into or against shelves/walls)
    if (pos.z < 4.2) {
      // INSIDE LIBRARY
      // Aisle width constraint: bookshelves extend to x = +-14.1. Standoff buffer clamps x to [-13.0, 13.0]
      pos.x = THREE.MathUtils.clamp(pos.x, -13.0, 13.0);

      // Back wall standoff:
      const inMovieBoothAisle = Math.abs(pos.x) <= 0.70 && pos.z <= -33.0;
      const minZ = inMovieBoothAisle ? -35.5 : -33.0;
      pos.z = THREE.MathUtils.clamp(pos.z, minZ, 4.2);
    } else if (pos.z >= 4.2 && pos.z <= 5.6) {
      // PASSING THROUGH SLIDING DOORWAY CORRIDOR
      pos.x = THREE.MathUtils.clamp(pos.x, -2.8, 2.8);
    } else {
      // OUTSIDE COURTYARD
      pos.x = THREE.MathUtils.clamp(pos.x, -14.5, 14.5);
      pos.z = THREE.MathUtils.clamp(pos.z, 5.6, 24.2);
    }

    // 2. Dynamic Obstacle: Librarian Helper (Maya) & Rolling Book Cart
    if (this.librarianHelper?.group) {
      const lx = this.librarianHelper.group.position.x;
      const lz = this.librarianHelper.group.position.z;
      const dist = Math.hypot(pos.x - lx, pos.z - lz);
      const minD = 1.35 + r;
      if (dist < minD && dist > 0.001) {
        const push = minD - dist;
        pos.x += ((pos.x - lx) / dist) * push;
        pos.z += ((pos.z - lz) / dist) * push;
      }
    }

    // Dynamic Obstacle: Seated Leola Behind Reception Desk
    if (this.leola?.group) {
      const lx = this.leola.group.position.x;
      const lz = this.leola.group.position.z;
      const dist = Math.hypot(pos.x - lx, pos.z - lz);
      const minD = 1.25 + r;
      if (dist < minD && dist > 0.001) {
        const push = minD - dist;
        pos.x += ((pos.x - lx) / dist) * push;
        pos.z += ((pos.z - lz) / dist) * push;
      }
    }

    // 3. Dynamic Obstacles: Walking NPCs on Lake Promenade
    if (this.promenadeNPCs) {
      this.promenadeNPCs.forEach(npc => {
        if (!npc.group) return;
        const nx = npc.group.position.x;
        const nz = npc.group.position.z;
        const dist = Math.hypot(pos.x - nx, pos.z - nz);
        const minD = 0.85 + r;
        if (dist < minD && dist > 0.001) {
          const push = minD - dist;
          pos.x += ((pos.x - nx) / dist) * push;
          pos.z += ((pos.z - nz) / dist) * push;
        }
      });
    }

    // 4. Static Solid Obstacles (desks, tables, chairs, arcade, globe, benches)
    for (const obs of this.solidObstacles) {
      if (obs.type === 'cylinder') {
        const d = Math.hypot(pos.x - obs.x, pos.z - obs.z);
        const minD = obs.r + r;
        if (d < minD) {
          if (d > 0.001) {
            pos.x = obs.x + ((pos.x - obs.x) / d) * minD;
            pos.z = obs.z + ((pos.z - obs.z) / d) * minD;
          } else {
            pos.z += minD;
          }
        }
      } else if (obs.type === 'box') {
        const minX = obs.minX - r;
        const maxX = obs.maxX + r;
        const minZ = obs.minZ - r;
        const maxZ = obs.maxZ + r;

        if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
          // Inside solid obstacle: calculate shallowest escape direction and slide smoothly
          const dLeft = pos.x - minX;
          const dRight = maxX - pos.x;
          const dBack = pos.z - minZ;
          const dFront = maxZ - pos.z;
          const minPen = Math.min(dLeft, dRight, dBack, dFront);

          if (minPen === dLeft) pos.x = minX;
          else if (minPen === dRight) pos.x = maxX;
          else if (minPen === dBack) pos.z = minZ;
          else pos.z = maxZ;
        }
      }
    }

    return pos;
  }

  buildSkyAndSun() {
    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(140, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x5ea4e8,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Build 3D Smiling Clay Sun, 7 Multi-Lobed 3D Clay Clouds, and Soaring 3D Birds
    this.build3DSunAndSky();

    // Volumetric Sunbeams coming down into the library
    const beamGeo = new THREE.ConeGeometry(3.5, 14, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff3c4,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sunbeam1 = new THREE.Mesh(beamGeo, beamMat);
    sunbeam1.position.set(-4, 6, -10);
    sunbeam1.rotation.z = -0.3;
    sunbeam1.rotation.x = 0.2;
    this.scene.add(sunbeam1);

    const sunbeam2 = new THREE.Mesh(beamGeo, beamMat);
    sunbeam2.position.set(4, 6, -18);
    sunbeam2.rotation.z = -0.25;
    sunbeam2.rotation.x = 0.15;
    this.scene.add(sunbeam2);
  }

  buildGroundAndCourtyard() {
    // 1. Lush Green Grass Lawn (instead of dirt)
    const grassTex = this.createGrassTexture();
    const grassGeo = new THREE.PlaneGeometry(100, 100, 16, 16);
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.9
    });
    this.ground = new THREE.Mesh(grassGeo, grassMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, 0, 14);
    this.ground.receiveShadow = true;
    this.ground.userData.walkable = true;
    this.scene.add(this.ground);
    this.walkableSurfaces.push(this.ground);

    // 2. S-Curved Flagstone Walkway (Image 1)
    const pathTex = this.createCurvedStonePathTexture();
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 26),
      new THREE.Vector3(2.5, 0.04, 20),
      new THREE.Vector3(1.5, 0.04, 14),
      new THREE.Vector3(-0.8, 0.04, 9),
      new THREE.Vector3(0, 0.04, 4.8)
    ]);
    const pathPoints = pathCurve.getPoints(40);
    const pathShape = new THREE.Shape();
    pathShape.moveTo(-2.2, 0);
    pathShape.lineTo(2.2, 0);
    const pathRibbonGeo = new THREE.PlaneGeometry(4.4, 1.2, 4, 1);
    const stoneMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.75 });

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      const slab = new THREE.Mesh(pathRibbonGeo, stoneMat);
      slab.rotation.x = -Math.PI / 2;
      slab.rotation.z = -angle;
      slab.position.set(mid.x, 0.04, mid.z);
      slab.receiveShadow = true;
      slab.userData.walkable = true;
      this.scene.add(slab);
    }

    // 3. Lush Clay Hedges & Flowers hugging the Curving Concrete Path Edges (Image 2)
    this.buildCurvingPathHedges(pathCurve);

    // 4. Large Planter Urns right at the entrance doors (Image 1)
    this.createEntrancePlanter(-4.5, 5.2);
    this.createEntrancePlanter(4.5, 5.2);

    // 5. Left Wooden Park Bench with Barnaby the Squirrel reading
    this.buildParkBench(-4.2, 16.5, 0.4, false);
    this.buildReadingSquirrel(-4.2, 16.5);

    // Stone Milestone with "BOOKS IDEAS PEOPLE A BRIGHTER TOMORROW" + Pip the Bluebird
    this.buildStoneMilestone(-5.8, 18);

    // Big shade tree above left bench (Image 1)
    this.buildShadeTree(-7.5, 17);

    // 6. Right Wooden Park Bench with "A QUIETER BRIGHTER WORLD" & Stacks of Books (pushed to right on grass)
    this.buildParkBench(9.2, 16, -0.35, true);

    // 7. Victorian Street Lamp Post with Hanging Banner on Right (Image 1)
    this.buildStreetLampWithBanner(6.5, 13);

    // 8. Chalkboard A-Frame Sign: "Good Stories Brighter Days" (Image 1)
    this.buildChalkboardEasel(4.2, 6.5);

    // 9. Scenic background: Lake with arched bridge and gazebo (Image 1 left)
    this.buildLakeAndBridge(-16, 12);

    // 10. Grand Milwaukee Skyline Outdoor 360° Panoramic Scenery & Monument (Image 3)
    this.buildMilwaukeeScenery();
  }

  buildCurvingPathHedges(pathCurve) {
    const flowerColors = [0xde5484, 0xf6d155, 0x5b92e5, 0xffffff, 0x8a4fe0, 0xba55d3, 0xffa07a, 0xff6b81];
    const leafColors = [0x356e3b, 0x3f7d45, 0x2e5e34, 0x4a8c52];
    const stoneColors = [0xa69888, 0x8c8275, 0xb8ad9e, 0x7c7367];

    const numSamples = 52;
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const pt = pathCurve.getPoint(t);
      const tangent = pathCurve.getTangent(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Keep wide clean concrete entrance plaza: no bushes near doors (z < 8.5)
      // AND stop completely before the wooden walkway and riprap rocks (z > 22.0)
      if (pt.z < 8.5 || pt.z > 22.0) continue;

      // Both left (-1) and right (+1) sides of the curving concrete flagstone path
      [-1, 1].forEach((side) => {
        // 1. PATH BORDER ROCKS: Nestled directly against the concrete path slab edge (dist = 2.26m)
        if (i % 2 === 0) {
          const stonePos = pt.clone().addScaledVector(normal, side * 2.26);
          const stoneMat = this.clayMaterial(stoneColors[(i + (side > 0 ? 2 : 0)) % stoneColors.length], 0.95);
          const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + ((i % 3) * 0.03)), stoneMat);
          stone.scale.set(1.2, 0.65, 0.9);
          stone.position.set(stonePos.x, 0.08, stonePos.z);
          stone.rotation.y = Math.sin(i * 1.3);
          stone.castShadow = true;
          this.scene.add(stone);
        }

        // 2. LOW FLOWER BORDER: Nestled on the grass BELOW the bushes, along the front edge of the bushes (dist = 2.62m)
        const flowerDist = 2.62 + (Math.sin(i * 1.7) * 0.10);
        const flowerPos = pt.clone().addScaledVector(normal, side * flowerDist);
        const numFlowers = 2 + (i % 2);
        for (let f = 0; f < numFlowers; f++) {
          const col = flowerColors[(i * 3 + f * 2 + (side > 0 ? 4 : 0)) % flowerColors.length];
          const fOffset = (f - (numFlowers - 1) / 2) * 0.22;
          const fPos = flowerPos.clone().addScaledVector(tangent, fOffset);

          // Small green stem rising from the grass
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 0.16, 6),
            this.clayMaterial(0x3e7545, 0.85)
          );
          stem.position.set(fPos.x, 0.08, fPos.z);
          this.scene.add(stem);

          // Flower blossom below the bushes, resting gently on stem (y = 0.16)
          const flGeo = (f % 2 === 0) ? new THREE.CylinderGeometry(0.11, 0.02, 0.08, 6) : new THREE.DodecahedronGeometry(0.085);
          const fl = new THREE.Mesh(flGeo, this.clayMaterial(col, 0.65));
          fl.position.set(fPos.x, 0.16, fPos.z);
          fl.rotation.x = 0.15;
          this.scene.add(fl);
        }

        // 3. CLAY BUSH MOUNDS: Positioned behind the flower border, taller than flowers (dist = 3.32m)
        const bushDist = 3.32 + (Math.sin(i * 1.3) * 0.14);
        const hedgePos = pt.clone().addScaledVector(normal, side * bushDist);
        const leafMat = this.clayMaterial(leafColors[(i + (side > 0 ? 1 : 0)) % leafColors.length], 0.85);
        const radius = 0.46 + ((i % 4) * 0.035);
        const bush = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), leafMat);
        bush.scale.set(1.15, 0.82, 1.15);
        bush.position.set(hedgePos.x, radius * 0.72, hedgePos.z);
        bush.castShadow = true;
        this.scene.add(bush);
      });
    }
  }

  buildMilwaukeeScenery() {
    // 1. Broad Ground & Lake Michigan Basin (Covering the Full U-Shape Panorama)
    this.buildUEnvironmentGround();

    // 2. South Downtown Skyline: US Bank Center, Northwestern Mutual, City Hall, Mid-Rises
    this.buildSouthDowntownSkyline();

    // 3. Iconic Santiago Calatrava Milwaukee Art Museum (Soaring Sun-Veil Wings & Suspension Bridge)
    this.buildCalatravaArtMuseum();

    // 4. West City Streetscape (Left Arm of U-Shape: Buildings, Avenue, Autumn Trees, Vehicles)
    this.buildWestStreetscape();

    // 5. East Lakefront Harbor (Right Arm of U-Shape: Lake Michigan, Breakwater Lighthouse, Sailboats, Coastal Bluffs)
    this.buildEastLakefrontHarbor();

    // 6. Lakefront Promenade, Stone Riprap, Monument & Walkers (South Border)
    this.buildLakefrontPromenade();

    // 7. 3D Smiling Clay Sun with Radiant Rays & Fluffy Clouds
    this.build3DSunAndSky();
  }

  buildUEnvironmentGround() {
    // West asphalt city street ground (Left arm)
    const westGeo = new THREE.PlaneGeometry(50, 65);
    const westMat = this.clayMaterial(0x4a4845, 0.95);
    const westGround = new THREE.Mesh(westGeo, westMat);
    westGround.rotation.x = -Math.PI / 2;
    westGround.position.set(-42, 0.01, 16);
    this.scene.add(westGround);

    // Lake Michigan Deep Blue Water Surface (Spanning South & East from z = 24.5 to 94.5)
    const waterGeo = new THREE.PlaneGeometry(130, 70);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2774aa,
      roughness: 0.15,
      metalness: 0.78,
      transparent: true,
      opacity: 0.94
    });
    const lakeWater = new THREE.Mesh(waterGeo, waterMat);
    lakeWater.rotation.x = -Math.PI / 2;
    lakeWater.position.set(10, 0.015, 59.5);
    this.scene.add(lakeWater);

    // East Coastal Park Lawn & Bluffs (Right arm: stops at shoreline z = 24.0)
    const eastGeo = new THREE.PlaneGeometry(42, 38);
    const eastMat = this.clayMaterial(0x447738, 0.9);
    const eastGround = new THREE.Mesh(eastGeo, eastMat);
    eastGround.rotation.x = -Math.PI / 2;
    eastGround.position.set(40, 0.04, 5);
    this.scene.add(eastGround);
  }


  buildBuildingPerimeterWalkway() {
    const pathTex = this.createCurvedStonePathTexture();
    const stoneMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.78 });
    const deckMat = this.clayMaterial(0x9b6a3d, 0.74);
    const roseMats = [0xf5a3bb, 0xf7d774, 0xd775e8, 0xffffff, 0xff8f70].map(c => this.clayMaterial(c, 0.72));
    const hedgeMat = this.clayMaterial(0x4f7f3b, 0.92);
    const rockMat = this.clayMaterial(0x988b7f, 0.94);

    const addPlane = (w, d, x, z, mat, y = 0.046) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      mesh.userData.walkable = true;
      this.scene.add(mesh);
      this.walkableSurfaces.push(mesh);
      return mesh;
    };

    // Front approach remains for visitors, but walkers are no longer routed here.
    addPlane(35.0, 2.8, 0, 6.1, stoneMat);
    addPlane(2.8, 45.8, -18.5, -16.75, stoneMat);
    addPlane(2.8, 45.8, 18.5, -16.75, stoneMat);
    addPlane(35.0, 2.8, 0, -39.0, stoneMat);
    // Both side loops get boardwalk/civic-walk treatment, with rocks and roses like the front.
    addPlane(4.0, 46.0, -22.0, -16.7, deckMat, 0.052);
    addPlane(4.0, 46.0, 22.0, -16.7, deckMat, 0.052);
    addPlane(35.0, 4.0, 0, 26.6, deckMat, 0.052);

    const decorateSide = (side) => {
      const pathX = side * 18.5;
      const deckX = side * 22.0;
      for (let i = 0; i < 18; i++) {
        const z = 4.5 - i * 2.55;
        const rx = pathX + side * 1.95;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 + (i % 3) * 0.035), rockMat);
        rock.scale.set(1.22, 0.58, 0.9);
        rock.position.set(rx, 0.17, z);
        rock.rotation.y = i * 0.71;
        rock.castShadow = true;
        this.scene.add(rock);

        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), roseMats[i % roseMats.length]);
        flower.position.set(rx + side * 0.42, 0.22, z + 0.15 * Math.sin(i));
        flower.castShadow = true;
        this.scene.add(flower);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.22, 6), this.clayMaterial(0x2f6d37, 0.9));
        stem.position.set(flower.position.x, 0.11, flower.position.z);
        this.scene.add(stem);

        if (i % 3 === 0) {
          const hedge = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), hedgeMat);
          hedge.scale.set(1.6, 0.72, 0.9);
          hedge.position.set(pathX - side * 1.35, 0.42, z);
          hedge.castShadow = true;
          this.scene.add(hedge);
        }
        if (i % 5 === 0) {
          this.buildStreetLampWithBanner(deckX, z);
        }
      }
    };
    decorateSide(-1);
    decorateSide(1);

    [[-18.5, 6.1], [18.5, 6.1], [-18.5, -39], [18.5, -39]].forEach(([x, z]) => {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(2.2, 22), stoneMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(x, 0.048, z);
      pad.receiveShadow = true;
      pad.userData.walkable = true;
      this.scene.add(pad);
      this.walkableSurfaces.push(pad);
    });

    this.buildParkBench(-22.2, -20.0, Math.PI / 2, false);
    this.buildParkBench(22.2, -20.0, -Math.PI / 2, false);
    this.buildParkBench(0, -39.0, 0, false);
  }


  buildMilwaukeeBoatHouse() {
    // Removed the duplicate immediate-right boathouse. This area is now land, street, sidewalk, and boardwalk support.
    const side = new THREE.Group();
    side.position.set(34, 0, 9.5);
    const grassMat = this.clayMaterial(0x5e8a45, 0.94);
    const streetMat = this.clayMaterial(0x3f4548, 0.93);
    const walkMat = this.clayMaterial(0xcac0ae, 0.86);
    const curbMat = this.clayMaterial(0x8f887f, 0.9);

    const grass = new THREE.Mesh(new THREE.PlaneGeometry(32, 28), grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, 0.061, 0);
    grass.receiveShadow = true;
    side.add(grass);

    const street = new THREE.Mesh(new THREE.PlaneGeometry(34, 6.0), streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.066, -7.8);
    street.receiveShadow = true;
    side.add(street);

    const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(34, 2.0), walkMat);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, 0.071, -4.2);
    sidewalk.receiveShadow = true;
    sidewalk.userData.walkable = true;
    side.add(sidewalk);
    this.walkableSurfaces.push(sidewalk);

    for (let i = -7; i <= 7; i++) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.18), curbMat);
      curb.position.set(i * 2.2, 0.13, -5.25);
      side.add(curb);
    }

    // Small street details instead of a duplicate civic pavilion.
    [[-10,-6.9,0xe76f51],[0,-8.4,0xf4a261],[9,-7.2,0x457b9d]].forEach(([x,z,c]) => {
      this.buildClayCar(34 + x, 9.5 + z, c, 'sedan');
    });

    // Decorative low shrubs keep this land zone visually tied to the front path.
    [-12, -8, -4, 4, 8, 12].forEach((x, idx) => {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), this.clayMaterial(0x4f7f3b, 0.92));
      shrub.scale.set(1.55, 0.65, 0.95);
      shrub.position.set(x, 0.42, 3.2 + Math.sin(idx) * 0.4);
      side.add(shrub);
    });

    this.scene.add(side);
  }

  buildSouthDowntownSkyline() {
    // A. The US Bank Center Skyscraper (Image Reference)
    const usBankGroup = new THREE.Group();
    usBankGroup.position.set(-18, 0, 56);

    const whiteFrameMat = this.clayMaterial(0xf5f6f8, 0.65);
    const blueGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1c3a59,
      roughness: 0.22,
      metalness: 0.7
    });

    // Main Tower Body (height 40m, width 11m, depth 9m)
    const towerCore = new THREE.Mesh(new THREE.BoxGeometry(10.8, 38, 8.8), blueGlassMat);
    towerCore.position.y = 19;
    usBankGroup.add(towerCore);

    // Vertical White Architectural Mullions
    for (let col = -5; col <= 5; col += 1.25) {
      const mullionF = new THREE.Mesh(new THREE.BoxGeometry(0.3, 38.2, 0.4), whiteFrameMat);
      mullionF.position.set(col, 19, 4.45);
      usBankGroup.add(mullionF);

      const mullionB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 38.2, 0.4), whiteFrameMat);
      mullionB.position.set(col, 19, -4.45);
      usBankGroup.add(mullionB);
    }

    // Horizontal Floor Slabs & Mechanical Bands
    for (let fl = 3; fl <= 36; fl += 3.2) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.5, 9.2), whiteFrameMat);
      slab.position.y = fl;
      usBankGroup.add(slab);
    }

    // Lower Structural Cross-Bracing Trusses (floors 3-5, y = 8 to 14)
    const strutMat = this.clayMaterial(0xffffff, 0.6);
    [-4, 0, 4].forEach(bx => {
      const brace1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, 0.35), strutMat);
      brace1.position.set(bx, 11, 4.5);
      brace1.rotation.z = 0.52;
      usBankGroup.add(brace1);

      const brace2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, 0.35), strutMat);
      brace2.position.set(bx, 11, 4.5);
      brace2.rotation.z = -0.52;
      usBankGroup.add(brace2);
    });

    // Dark Upper Mechanical Penthouse Crown
    const penthouse = new THREE.Mesh(new THREE.BoxGeometry(9.6, 4.8, 7.8), this.clayMaterial(0x222222, 0.8));
    penthouse.position.y = 40.4;
    usBankGroup.add(penthouse);

    // Illuminated 3D "us bank" Signage (Red background block + White letters)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 160;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#d32f2f';
    sCtx.roundRect(10, 10, 492, 140, 16);
    sCtx.fill();
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 74px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('us bank', 256, 80);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signPlateN = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.6),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signPlateN.position.set(0, 40.4, 3.96);
    usBankGroup.add(signPlateN);

    const signPlateS = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.6),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signPlateS.position.set(0, 40.4, -3.96);
    signPlateS.rotation.y = Math.PI;
    usBankGroup.add(signPlateS);

    // Rooftop Communications Antenna Spire
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 12, 8), this.clayMaterial(0xcccccc, 0.4, 0.6));
    antenna.position.y = 48.8;
    usBankGroup.add(antenna);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), this.clayMaterial(0xff2222, 0.2));
    beacon.position.y = 54.8;
    usBankGroup.add(beacon);

    this.scene.add(usBankGroup);

    // B. The Northwestern Mutual Modern Curved Glass Tower
    const nwmGroup = new THREE.Group();
    nwmGroup.position.set(-5, 0, 59);

    const cyanGlassMat = new THREE.MeshStandardMaterial({
      color: 0x3aa0b2,
      roughness: 0.16,
      metalness: 0.75
    });
    // Curved Cylindrical Tower Body facing Lake Michigan
    const nwmTower = new THREE.Mesh(
      new THREE.CylinderGeometry(5.4, 5.8, 35, 24, 1, false, -Math.PI * 0.2, Math.PI * 1.4),
      cyanGlassMat
    );
    nwmTower.position.y = 17.5;
    nwmGroup.add(nwmTower);

    // Tapering Angled Glass Crown
    const nwmCrown = new THREE.Mesh(
      new THREE.ConeGeometry(5.3, 6, 24, 1, true, -Math.PI * 0.2, Math.PI * 1.4),
      cyanGlassMat
    );
    nwmCrown.position.y = 38;
    nwmCrown.rotation.x = 0.15;
    nwmGroup.add(nwmCrown);

    this.scene.add(nwmGroup);

    // C. Historic Flemish Milwaukee City Hall & Spire
    const cityHallGroup = new THREE.Group();
    cityHallGroup.position.set(-30, 0, 53);

    const brickMat = this.clayMaterial(0x993d25, 0.9);
    const stoneTrimMat = this.clayMaterial(0xded5c2, 0.85);
    const copperSpireMat = this.clayMaterial(0x428265, 0.7);

    // Main 8-story Flemish Brick Body
    const chBody = new THREE.Mesh(new THREE.BoxGeometry(8.5, 18, 8.5), brickMat);
    chBody.position.y = 9;
    cityHallGroup.add(chBody);

    // Decorative Stepped Gables & Cornice
    const chGable = new THREE.Mesh(new THREE.BoxGeometry(8.9, 1.2, 8.9), stoneTrimMat);
    chGable.position.y = 18.6;
    cityHallGroup.add(chGable);

    // Square Clock Tower
    const clockTower = new THREE.Mesh(new THREE.BoxGeometry(4.2, 9, 4.2), brickMat);
    clockTower.position.y = 23.5;
    cityHallGroup.add(clockTower);

    // Golden Clock Face on 4 sides
    [-2.12, 2.12].forEach(ox => {
      const clockMeshX = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), this.clayMaterial(0xf6cf52, 0.5));
      clockMeshX.position.set(ox, 24.5, 0);
      clockMeshX.rotation.y = (ox > 0) ? Math.PI / 2 : -Math.PI / 2;
      cityHallGroup.add(clockMeshX);
    });
    [-2.12, 2.12].forEach(oz => {
      const clockMeshZ = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), this.clayMaterial(0xf6cf52, 0.5));
      clockMeshZ.position.set(0, 24.5, oz);
      clockMeshZ.rotation.y = (oz > 0) ? 0 : Math.PI;
      cityHallGroup.add(clockMeshZ);
    });

    // Soaring Copper-Patina Green Spire
    const chSpire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 9, 8), copperSpireMat);
    chSpire.position.y = 32.5;
    cityHallGroup.add(chSpire);

    this.scene.add(cityHallGroup);

    // D. Mid-Rise Downtown Clay Buildings
    const midRises = [
      { x: -9, z: 49, w: 7, h: 18, d: 6.5, col: 0xd8cdbc }, // Limestone commercial
      { x: -23, z: 47, w: 6.5, h: 22, d: 6, col: 0x82462e }, // Terracotta brick
      { x: 1, z: 52, w: 6, h: 16, d: 6, col: 0x3c6482 }    // Blue glass block
    ];

    midRises.forEach(b => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), this.clayMaterial(b.col, 0.85));
      bMesh.position.set(b.x, b.h * 0.5, b.z);
      this.scene.add(bMesh);

      // Punch-out window grids
      const winMat = this.clayMaterial(0x1a2e40, 0.6);
      const rows = Math.floor(b.h / 2.5);
      for (let r = 1; r < rows; r++) {
        const winBand = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.88, 0.9, b.d + 0.1), winMat);
        winBand.position.set(b.x, r * 2.5, b.z);
        this.scene.add(winBand);
      }
    });
  }


  buildCalatravaArtMuseum() {
    // Kept boathouse: rebuilt as the pushed-back 3D waterfront hero from the reference image.
    const g = new THREE.Group();
    g.position.set(4, 0, 43.0);
    g.scale.setScalar(1.05);

    const whiteMat = this.clayMaterial(0xf6efe4, 0.56);
    const stoneMat = this.clayMaterial(0xcfc5b5, 0.86);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x2f8aa0, roughness: 0.18, metalness: 0.42,
      transparent: true, opacity: 0.78, side: THREE.DoubleSide
    });
    const grassMat = this.clayMaterial(0x5d8b42, 0.94);
    const rockMat = this.clayMaterial(0x8f867c, 0.96);
    const bollardMat = this.clayMaterial(0x5b321e, 0.84);
    const ropeMat = this.clayMaterial(0xd3b078, 0.86);

    const beamBetween = (a, b, r, mat = whiteMat, parent = g) => {
      const dir = new THREE.Vector3().subVectors(b, a);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 12), mat);
      beam.position.copy(a).add(b).multiplyScalar(0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      beam.castShadow = true;
      parent.add(beam);
      return beam;
    };

    const land = new THREE.Mesh(new THREE.PlaneGeometry(70, 38), grassMat);
    land.rotation.x = -Math.PI / 2;
    land.position.set(0, 0.07, 4);
    land.receiveShadow = true;
    g.add(land);

    // Waterline foreground for the hero, with riprap, quay, rope, and posts.
    const water = new THREE.Mesh(new THREE.PlaneGeometry(76, 14), new THREE.MeshStandardMaterial({
      color: 0x167bb8, roughness: 0.18, metalness: 0.62, transparent: true, opacity: 0.88
    }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.03, 20.4);
    g.add(water);

    for (let i = -28; i <= 28; i += 2) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.44 + (Math.abs(i) % 5) * 0.025), rockMat);
      rock.scale.set(1.25, 0.72, 0.95);
      rock.position.set(i * 0.68, 0.30, 13.9 + Math.sin(i) * 0.12);
      rock.rotation.y = i * 0.27;
      g.add(rock);
    }

    const quay = new THREE.Mesh(new THREE.BoxGeometry(40, 0.36, 1.0), stoneMat);
    quay.position.set(0, 0.27, 12.7);
    quay.castShadow = true;
    g.add(quay);

    for (let i = -9; i <= 9; i++) {
      const x = i * 2.0;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.75, 12), bollardMat);
      post.position.set(x, 0.72, 12.2);
      post.castShadow = true;
      g.add(post);
      if (i < 9) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 0.92, 12.2),
          new THREE.Vector3(x + 1.0, 0.72, 12.2),
          new THREE.Vector3(x + 2.0, 0.92, 12.2)
        ]);
        const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.035, 7, false), ropeMat);
        g.add(rope);
      }
    }

    // Center promenade and formal hedges, locked to the central axis.
    const path = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 18), stoneMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.09, 3.2);
    path.receiveShadow = true;
    g.add(path);

    [-4.8, 4.8].forEach(sideX => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 16.2), whiteMat);
      edge.position.set(sideX, 0.22, 3.8);
      g.add(edge);
      for (let z = -3.5; z <= 8.0; z += 2.2) {
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), this.clayMaterial(0xffd27a, 0.35, 0.3));
        light.position.set(sideX * 0.82, 0.36, z);
        g.add(light);
      }
    });

    [-10.5, -8.8, 8.8, 10.5].forEach((x, idx) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 3.1, 10), this.clayMaterial(0x6b3f25, 0.9));
      trunk.position.set(x, 1.55, 2.8 + (idx % 2) * 2.1);
      g.add(trunk);
      for (let p = 0; p < 5; p++) {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.82, 10, 10), this.clayMaterial(0x5e8b3d, 0.92));
        crown.position.set(x + (p - 2) * 0.35, 3.5 + (p % 2) * 0.35, 2.8 + (idx % 2) * 2.1 + Math.sin(p) * 0.3);
        g.add(crown);
      }
    });

    // Long low base with teal glass side wings.
    const base = new THREE.Mesh(new THREE.BoxGeometry(26, 3.0, 7.0), whiteMat);
    base.position.set(0, 1.55, 0);
    base.castShadow = true;
    g.add(base);
    [-7.2, -3.6, 3.6, 7.2].forEach(x => {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.25, 0.18), glassMat);
      glass.position.set(x, 1.75, 3.58);
      g.add(glass);
    });

    // Curved central canopy represented as stacked arched ribs/shell layers.
    for (let i = 0; i < 6; i++) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(4.7 + i * 0.35, 0.16, 10, 52, Math.PI), whiteMat);
      arch.position.set(0, 2.15 + i * 0.06, 3.68 - i * 0.18);
      arch.scale.y = 0.46 + i * 0.02;
      g.add(arch);
    }
    [-4.9, 4.9].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.7, 0.48), whiteMat);
      post.position.set(x, 1.32, 3.65);
      g.add(post);
    });

    // Triangular teal glass atrium and radial mullions.
    const tri = new THREE.Shape();
    tri.moveTo(-4.0, 0); tri.lineTo(0, 7.6); tri.lineTo(4.0, 0); tri.closePath();
    const atrium = new THREE.Mesh(new THREE.ShapeGeometry(tri), glassMat);
    atrium.position.set(0, 2.55, 3.84);
    g.add(atrium);
    for (let i = -4; i <= 4; i++) {
      const x = i * 0.55;
      beamBetween(new THREE.Vector3(x, 2.65, 3.90), new THREE.Vector3(x * 0.15, 9.8 - Math.abs(x) * 0.8, 3.92), 0.045);
    }

    // Three central masts/spires.
    beamBetween(new THREE.Vector3(0, 5.0, 1.0), new THREE.Vector3(0, 21.0, 0.0), 0.20);
    beamBetween(new THREE.Vector3(-1.45, 5.6, 0.8), new THREE.Vector3(-2.8, 16.6, 0.0), 0.15);
    beamBetween(new THREE.Vector3(1.45, 5.6, 0.8), new THREE.Vector3(2.8, 16.6, 0.0), 0.15);

    // The defining wing roof: many cream slats, symmetrical and pushed wide like the reference.
    for (let i = 0; i < 21; i++) {
      const rootY = 9.2 + i * 0.13;
      const tipY = 13.0 - i * 0.08;
      const z = 0.25 + i * 0.045;
      const span = 5.0 + i * 0.62;
      beamBetween(new THREE.Vector3(-0.55, rootY, z), new THREE.Vector3(-span, tipY, z + 0.35), 0.072);
      beamBetween(new THREE.Vector3(0.55, rootY, z), new THREE.Vector3(span, tipY, z + 0.35), 0.072);
    }
    // Primary upper edge beams.
    beamBetween(new THREE.Vector3(-0.6, 13.3, 1.25), new THREE.Vector3(-18.2, 14.1, 1.9), 0.12);
    beamBetween(new THREE.Vector3(0.6, 13.3, 1.25), new THREE.Vector3(18.2, 14.1, 1.9), 0.12);

    // Connector block cluster near the central hinge.
    for (let i = -4; i <= 4; i++) {
      const collar = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), whiteMat);
      collar.position.set(i * 0.18, 10.0 + Math.abs(i) * 0.11, 1.16 + Math.abs(i) * 0.08);
      g.add(collar);
    }

    // Distant skyline on land, behind the pavilion.
    const skyline = [
      { x:-18, z:-13, w:4.4, h:12, d:3.2, c:0xd5a66c },
      { x:-13, z:-15, w:3.8, h:8, d:3.2, c:0xc58b52 },
      { x:-8, z:-17, w:4.2, h:10, d:3.4, c:0x60798b },
      { x:9, z:-16, w:4.5, h:13, d:3.4, c:0x1c5968 },
      { x:15, z:-13.5, w:4.8, h:15, d:3.5, c:0xf0e2c8 },
      { x:21, z:-13, w:4.8, h:10, d:3.6, c:0x9b4c35 }
    ];
    skyline.forEach(b => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), this.clayMaterial(b.c, 0.88));
      m.position.set(b.x, b.h * 0.5, b.z);
      g.add(m);
      const win = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.78, b.h * 0.72, 0.06), this.clayMaterial(0x26394a, 0.65));
      win.position.set(b.x, b.h * 0.50, b.z + b.d * 0.52);
      g.add(win);
    });

    // US Bank label, stylized but small and subordinate.
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512; labelCanvas.height = 128;
    const lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = '#f8f8f8'; lctx.fillRect(0,0,512,128);
    lctx.fillStyle = '#c62828'; lctx.font = 'bold 44px sans-serif'; lctx.textAlign = 'center'; lctx.fillText('us bank',256,82);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(2.2,0.55), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(labelCanvas) }));
    label.position.set(15,15.4,-11.2);
    g.add(label);

    this.scene.add(g);
  }

  buildWestStreetscape() {
    // West Arm of U-Shape: Continuous Downtown Urban Streetscape (Left when facing South)
    const buildingsW = [
      { x: -32, z: 24, w: 9, h: 23, d: 8, col: 0xe8dbb8, type: 'cream_city' }, // Milwaukee Cream City Brick
      { x: -44, z: 28, w: 10, h: 28, d: 9, col: 0x244f77, type: 'blue_glass' }, // Glass office tower
      { x: -34, z: 8, w: 8, h: 18, d: 7.5, col: 0x863d2a, type: 'warehouse' },   // Historic brick warehouse
      { x: -48, z: 10, w: 9.5, h: 25, d: 9, col: 0x5b646c, type: 'granite' },    // Granite commercial tower
      { x: -32, z: -8, w: 8.5, h: 17, d: 8, col: 0x7a4d36, type: 'storefront' }  // Brownstone lofts
    ];

    buildingsW.forEach(b => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), this.clayMaterial(b.col, 0.85));
      bMesh.position.set(b.x, b.h * 0.5, b.z);
      this.scene.add(bMesh);

      // Rooftop cornices and water tank
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, 0.8, b.d + 0.6), this.clayMaterial(0xd8d0c2, 0.9));
      cornice.position.set(b.x, b.h + 0.4, b.z);
      this.scene.add(cornice);

      if (b.type === 'warehouse') {
        // Rooftop cedar water tank on stilts
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.4, 12), this.clayMaterial(0x6b4423, 0.9));
        tank.position.set(b.x, b.h + 2.4, b.z);
        this.scene.add(tank);
      }
    });

    // Avenue Sidewalk & Autumn Shade Trees along West Corridor
    const treeColors = [0xf3be38, 0xd85b24, 0x3a773d, 0xe09428];
    for (let t = 0; t < 7; t++) {
      const tz = 32 - t * 6.5;
      const tx = -23.5 + (Math.random() - 0.5) * 1.0;

      // Tree trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.2, 8), this.clayMaterial(0x5a361e, 0.9));
      trunk.position.set(tx, 1.6, tz);
      this.scene.add(trunk);

      // Puffy autumn foliage
      const leafColor = treeColors[t % treeColors.length];
      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 0.5, 8, 8), this.clayMaterial(leafColor, 0.85));
        puff.position.set(tx + (Math.random() - 0.5) * 1.2, 3.8 + Math.random() * 1.2, tz + (Math.random() - 0.5) * 1.2);
        this.scene.add(puff);
      }
    }

    // Clay City Vehicles parked along West curb
    this.buildClayCar(-26, 20, 0xfac832, 'taxi'); // Yellow Cab
    this.buildClayCar(-26.5, 6, 0x2563eb, 'sedan'); // Blue Sedan
  }

  buildClayCar(x, z, colorHex, type) {
    const car = new THREE.Group();
    car.position.set(x, 0.45, z);

    // Car Body
    const bodyMat = this.clayMaterial(colorHex, 0.6);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.2), bodyMat);
    body.position.y = 0.4;
    car.add(body);

    // Cabin / Windows
    const cabinMat = this.clayMaterial(0x1a2e40, 0.5);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.75, 2.4), cabinMat);
    cabin.position.set(0, 1.1, -0.2);
    car.add(cabin);

    // Wheels
    const wheelMat = this.clayMaterial(0x222222, 0.9);
    [[-1.05, 0.9], [1.05, 0.9], [-1.05, -1.2], [1.05, -1.2]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.35, wz);
      car.add(wheel);
    });

    if (type === 'taxi') {
      const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.4), this.clayMaterial(0xffffff, 0.4));
      roofSign.position.set(0, 1.6, -0.2);
      car.add(roofSign);
    }

    car.rotation.y = Math.PI;
    this.scene.add(car);
  }

  buildEastLakefrontHarbor() {
    // East Arm of U-Shape: Lake Michigan Harbor, Breakwater Pier & Lighthouse (Right when facing South)

    // 1. Stone Breakwater Pier extending into Lake Michigan
    const pierMat = this.clayMaterial(0x8a847c, 0.9);
    const pier = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 5.0), pierMat);
    pier.position.set(34, 0.6, 16);
    this.scene.add(pier);

    // Breakwater Riprap along Pier
    for (let px = 26; px <= 42; px += 2.0) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + Math.random() * 0.3), this.clayMaterial(0x6e6860, 0.95));
      rock.position.set(px, 0.5, 13.2 + (Math.random() - 0.5) * 0.6);
      this.scene.add(rock);
    }

    // 2. Milwaukee Harbor Breakwater Lighthouse
    const lightGroup = new THREE.Group();
    lightGroup.position.set(42, 0, 16);

    const lhWhiteMat = this.clayMaterial(0xffffff, 0.7);
    const lhRedMat = this.clayMaterial(0xcc2929, 0.7);

    // Conical White Masonry Tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.7, 10.5, 16), lhWhiteMat);
    tower.position.y = 5.25;
    lightGroup.add(tower);

    // Iron Gallery Walkway Rail
    const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16), this.clayMaterial(0x222222, 0.8));
    gallery.position.y = 10.65;
    lightGroup.add(gallery);

    // Red Lantern Room & Octagonal Cap
    const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 8), this.clayMaterial(0xfff6cf, 0.2));
    lanternGlass.position.y = 11.6;
    lightGroup.add(lanternGlass);

    const roofCap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.2, 8), lhRedMat);
    roofCap.position.y = 13.0;
    lightGroup.add(roofCap);

    // Glowing Lighthouse Beacon Light
    const beaconLight = new THREE.PointLight(0xffea95, 2.5, 35);
    beaconLight.position.set(0, 11.6, 0);
    lightGroup.add(beaconLight);

    this.scene.add(lightGroup);

    // 3. Sailboats on Lake Michigan at Various Distances in Deep Water (z >= 42)
    this.buildSailboat(12, 42, -0.45, 'MKE ♥', 0x1e3f8a);
    this.buildSailboat(30, 48, 0.35, 'WISCONSIN', 0x991b1b);
    this.buildSailboat(-14, 44, 0.15, '', 0x059669);
    this.buildSailboat(48, 56, -0.2, '', 0x2563eb);

    // 4. East Grassy Bluffs with Shade Trees
    const treeColors = [0x3e7545, 0xefb834, 0xd85b24];
    for (let e = 0; e < 6; e++) {
      const ez = 22 - e * 5.5;
      const ex = 24.5 + (Math.random() - 0.5) * 1.5;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 2.8, 8), this.clayMaterial(0x5a361e, 0.9));
      trunk.position.set(ex, 1.4, ez);
      this.scene.add(trunk);

      const leafCol = treeColors[e % treeColors.length];
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 0.4, 8, 8), this.clayMaterial(leafCol, 0.85));
        puff.position.set(ex + (Math.random() - 0.5) * 1.0, 3.2 + Math.random() * 1.0, ez + (Math.random() - 0.5) * 1.0);
        this.scene.add(puff);
      }
    }
  }

  buildSailboat(x, z, rotY, insignia, insigColor) {
    const boat = new THREE.Group();
    boat.position.set(x, 0.2, z);

    const hullMat = this.clayMaterial(0xffffff, 0.85);
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.95, 3.5, 5), hullMat);
    hull.rotation.z = Math.PI / 2;
    hull.rotation.y = Math.PI / 4;
    hull.scale.set(0.6, 1.0, 0.45);
    boat.add(hull);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.0, 8), this.clayMaterial(0x734822, 0.8));
    mast.position.y = 2.0;
    boat.add(mast);

    const sailCanvas = document.createElement('canvas');
    sailCanvas.width = 256;
    sailCanvas.height = 512;
    const sailCtx = sailCanvas.getContext('2d');
    sailCtx.fillStyle = '#ffffff';
    sailCtx.fillRect(0, 0, 256, 512);

    if (insignia) {
      sailCtx.fillStyle = '#1e3f8a';
      sailCtx.font = 'bold 42px sans-serif';
      sailCtx.textAlign = 'center';
      sailCtx.fillText(insignia, 128, 270);
    }

    const sailTex = new THREE.CanvasTexture(sailCanvas);
    const sail = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({ map: sailTex, side: THREE.DoubleSide })
    );
    const vertices = new Float32Array([
      0, 0.4, 0,
      0, 3.8, 0,
      1.9, 0.8, 0
    ]);
    const uvs = new Float32Array([
      0, 0,
      0, 1,
      1, 0
    ]);
    sail.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    sail.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    sail.geometry.computeVertexNormals();
    boat.add(sail);

    boat.rotation.y = rotY;
    this.scene.add(boat);
  }

  buildLakefrontPromenade() {
    // 1. Grass Edge Border Rocks (z = 23.75) - Stopping completely before the wooden boardwalk deck (z in [24.35, 27.05])
    const rockColors = [0x998d7f, 0xaf9f8d, 0x82776a, 0xb8aba0];
    for (let r = -24; r <= 24; r += 1.5) {
      if (Math.abs(r) < 2.8) continue; // Keep central walkway into dock completely open
      const rockMat = this.clayMaterial(rockColors[Math.abs(Math.floor(r * 2)) % rockColors.length], 0.95);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38 + Math.random() * 0.22), rockMat);
      rock.scale.set(1.2, 0.65, 1.0);
      rock.position.set(r + (Math.random() - 0.5) * 0.3, 0.20, 23.75 + (Math.random() - 0.5) * 0.2);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // 1b. Colorful Grass Flower Border behind rocks (z = 23.25, y = 0.16)
    const promenadeFlowerColors = [0xde5484, 0xf6d155, 0x5b92e5, 0xffffff, 0xba55d3, 0xffa07a];
    for (let f = -23.5; f <= 23.5; f += 0.9) {
      if (Math.abs(f) < 3.0) continue;
      const col = promenadeFlowerColors[Math.abs(Math.floor(f * 3)) % promenadeFlowerColors.length];
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.18, 6), this.clayMaterial(0x3e7545, 0.85));
      stem.position.set(f + (Math.random() - 0.5) * 0.2, 0.09, 23.25);
      this.scene.add(stem);

      const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), this.clayMaterial(col, 0.65));
      blossom.position.set(f + (Math.random() - 0.5) * 0.2, 0.18, 23.25);
      this.scene.add(blossom);
    }

    // 1c. Lake Water Riprap Breakwater Boulders (z = 27.85 - resting out in the water past dock railing)
    for (let w = -24; w <= 24; w += 1.8) {
      const wRockMat = this.clayMaterial(rockColors[Math.abs(Math.floor(w * 3)) % rockColors.length], 0.92);
      const wRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.35), wRockMat);
      wRock.scale.set(1.3, 0.75, 1.1);
      wRock.position.set(w + (Math.random() - 0.5) * 0.4, 0.22, 27.85 + (Math.random() - 0.5) * 0.3);
      wRock.rotation.set(Math.random(), Math.random(), Math.random());
      wRock.castShadow = true;
      this.scene.add(wRock);
    }

    // 2. Iconic 3D Carved Monument: "Milwaukee ♥ A Kinder Brighter City" (Image 3)
    const signGroup = new THREE.Group();
    signGroup.position.set(-4.5, 0, 24.8);

    const baseStone = this.clayMaterial(0xd7cdb8, 0.85);
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.8), baseStone);
    pBase.position.y = 0.225;
    pBase.castShadow = true;
    signGroup.add(pBase);

    [-0.95, 0.95].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.55), baseStone);
      pillar.position.set(px, 1.1, 0);
      pillar.castShadow = true;
      signGroup.add(pillar);
    });

    const woodMat = this.clayMaterial(0x8a5229, 0.75);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.15, 0.16), woodMat);
    signBoard.position.set(0, 1.35, 0.05);
    signBoard.castShadow = true;
    signGroup.add(signBoard);

    const mkeCanvas = document.createElement('canvas');
    mkeCanvas.width = 1024;
    mkeCanvas.height = 512;
    const mkeCtx = mkeCanvas.getContext('2d');
    const grad = mkeCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#93582d');
    grad.addColorStop(1, '#663919');
    mkeCtx.fillStyle = grad;
    mkeCtx.roundRect(16, 16, 992, 480, 28);
    mkeCtx.fill();
    mkeCtx.lineWidth = 14;
    mkeCtx.strokeStyle = '#43210b';
    mkeCtx.stroke();

    mkeCtx.textAlign = 'center';
    mkeCtx.fillStyle = '#fff4e0';
    mkeCtx.shadowColor = '#241005';
    mkeCtx.shadowBlur = 10;
    mkeCtx.shadowOffsetY = 6;
    mkeCtx.font = 'bold 112px "Segoe Script", "Brush Script MT", Georgia, cursive';
    mkeCtx.fillText('Milwaukee', 512, 190);

    mkeCtx.fillStyle = '#ff6b6b';
    mkeCtx.font = 'bold 64px sans-serif';
    mkeCtx.fillText('♥', 512, 265);

    mkeCtx.fillStyle = '#ffecd1';
    mkeCtx.font = 'bold 54px Georgia, serif';
    mkeCtx.shadowBlur = 6;
    mkeCtx.shadowOffsetY = 4;
    mkeCtx.fillText('A Kinder Brighter City', 512, 350);

    const mkeSignTex = new THREE.CanvasTexture(mkeCanvas);
    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 1.05),
      new THREE.MeshStandardMaterial({ map: mkeSignTex, roughness: 0.7 })
    );
    signFace.position.set(0, 1.35, 0.14);
    signGroup.add(signFace);

    // Clustered Purple Coneflowers & Black-Eyed Susans around Monument Base
    const flowerColors = [0x9c27b0, 0xba68c8, 0xffd54f, 0xffb300];
    for (let f = 0; f < 16; f++) {
      const angle = (f / 16) * Math.PI * 2;
      const dist = 0.9 + Math.random() * 0.7;
      const fx = Math.cos(angle) * dist;
      const fz = Math.sin(angle) * 0.5;
      const col = flowerColors[f % flowerColors.length];

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), this.clayMaterial(0x3e7545, 0.8));
      stem.position.set(fx, 0.25, fz);
      signGroup.add(stem);

      const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), this.clayMaterial(col, 0.6));
      blossom.position.set(fx, 0.5, fz);
      signGroup.add(blossom);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 6), this.clayMaterial(0xd86221, 0.7));
      cone.position.set(fx, 0.56, fz);
      signGroup.add(cone);
    }

    signGroup.rotation.y = 0.2;
    this.scene.add(signGroup);

    // 3. Promenade Wooden Bench placed safely on lush green grass before rocks and boardwalk
    this.buildParkBench(7.8, 21.0, -0.35, false);

    // 4. Authentic Harbor Dock Boardwalk (Heavy Timber Decking, Pilings, Mooring Bollards & Rope Railings)
    this.buildHarborDockBoardwalk();

    // 5. Animated Strolling NPCs on Promenade with 2 Arms, 2 Legs & Real Walk Cycles
    this.buildPromenadeWalkingNPCs();

    // 6. Promenade Bollard Lanterns with Warm Lights
    [-8.0, 7.5].forEach(bx => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.1, 10), this.clayMaterial(0x2a2a2a, 0.5));
      post.position.set(bx, 0.55, 25.4);
      this.scene.add(post);

      const lampGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 8), this.clayMaterial(0xfff1aa, 0.2));
      lampGlow.position.set(bx, 1.05, 25.4);
      this.scene.add(lampGlow);

      const pl = new THREE.PointLight(0xffea9e, 1.2, 6);
      pl.position.set(bx, 1.15, 25.4);
      this.scene.add(pl);
    });
  }

  buildHarborDockBoardwalk() {
    const dockGroup = new THREE.Group();
    const woodColors = [0x785338, 0x6e4b31, 0x825b3e, 0x5e3e26];
    const ironMat = this.clayMaterial(0x222225, 0.85);
    const ropeMat = this.clayMaterial(0xc2a67e, 0.95);

    // Continuous Main Timber Boardwalk Deck (x in [-24, 24], z in [24.4, 27.0])
    const deckSubstructure = new THREE.Mesh(
      new THREE.BoxGeometry(48.2, 0.18, 2.7),
      this.clayMaterial(0x4a3221, 0.9)
    );
    deckSubstructure.position.set(0, 0.09, 25.7);
    deckSubstructure.receiveShadow = true;
    dockGroup.add(deckSubstructure);

    // Individual transverse weathered timber planks every 0.38m
    for (let px = -24; px <= 24; px += 0.38) {
      const plankCol = woodColors[Math.abs(Math.floor(px * 3)) % woodColors.length];
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.05, 2.66),
        this.clayMaterial(plankCol, 0.85)
      );
      plank.position.set(px, 0.19, 25.7);
      plank.receiveShadow = true;
      dockGroup.add(plank);
    }

    // Heavy Timber Edge Fascia Beam along Harbor Water Edge (z = 27.05)
    const fasciaBeam = new THREE.Mesh(
      new THREE.BoxGeometry(48.2, 0.32, 0.18),
      this.clayMaterial(0x5a3b22, 0.88)
    );
    fasciaBeam.position.set(0, 0.16, 27.05);
    dockGroup.add(fasciaBeam);

    // Heavy Timber Dock Pilings along water boundary with iron pile bands
    for (let px = -22; px <= 22; px += 3.6) {
      const piling = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 1.4, 12),
        this.clayMaterial(0x442c18, 0.9)
      );
      piling.position.set(px, 0.5, 27.12);
      piling.castShadow = true;
      dockGroup.add(piling);

      // Iron band cap on top of piling
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.06, 12),
        ironMat
      );
      band.position.set(px, 1.15, 27.12);
      dockGroup.add(band);

      // Coiled marine mooring rope around piling
      const ropeCoil = new THREE.Mesh(
        new THREE.TorusGeometry(0.20, 0.035, 8, 14),
        ropeMat
      );
      ropeCoil.rotation.x = Math.PI / 2;
      ropeCoil.position.set(px, 0.65, 27.12);
      dockGroup.add(ropeCoil);
    }

    // Heavy Marine Rope Railing connecting wooden stanchion posts along the harbor edge
    for (let px = -23; px <= 23; px += 2.4) {
      const stanchion = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.05, 0.12),
        this.clayMaterial(0x5c3d25, 0.85)
      );
      stanchion.position.set(px, 0.65, 26.92);
      stanchion.castShadow = true;
      dockGroup.add(stanchion);

      // Dual suspended sagging marine ropes
      if (px < 22) {
        const nextX = px + 2.4;
        const midX = (px + nextX) * 0.5;

        // Top rope catenary curve
        const curveTop = new THREE.CatmullRomCurve3([
          new THREE.Vector3(px, 1.05, 26.92),
          new THREE.Vector3(midX, 0.96, 26.92),
          new THREE.Vector3(nextX, 1.05, 26.92)
        ]);
        const ropeTop = new THREE.Mesh(new THREE.TubeGeometry(curveTop, 12, 0.024, 6, false), ropeMat);
        dockGroup.add(ropeTop);

        // Lower rope catenary curve
        const curveLow = new THREE.CatmullRomCurve3([
          new THREE.Vector3(px, 0.58, 26.92),
          new THREE.Vector3(midX, 0.51, 26.92),
          new THREE.Vector3(nextX, 0.58, 26.92)
        ]);
        const ropeLow = new THREE.Mesh(new THREE.TubeGeometry(curveLow, 12, 0.02, 6, false), ropeMat);
        dockGroup.add(ropeLow);
      }
    }

    // Cast-Iron Mooring Cleats / Double-Horn Bollards spaced every 6m
    [-18, -12, -6, 6, 12, 18].forEach(bx => {
      const bollardBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.18), ironMat);
      bollardBase.position.set(bx, 0.23, 26.75);
      dockGroup.add(bollardBase);

      const bollardPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 10), ironMat);
      bollardPost.position.set(bx, 0.32, 26.75);
      dockGroup.add(bollardPost);

      const bollardCross = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8), ironMat);
      bollardCross.rotation.z = Math.PI / 2;
      bollardCross.position.set(bx, 0.38, 26.75);
      dockGroup.add(bollardCross);
    });

    this.scene.add(dockGroup);
  }


  buildPromenadeWalkingNPCs() {
    this.promenadeNPCs = [];
    const people = [
      { name:'Mateo', skinColor:0x8d5536, shirtColor:0xc49a6c, pantsColor:0x2b4c7e, shoeColor:0xf2f2f2, hairColor:0x1f140e, hatColor:0xb83232, hasBackpack:true },
      { name:'Nia', skinColor:0xa66a44, shirtColor:0xe76f51, pantsColor:0x264653, shoeColor:0x2a9d8f, hairColor:0x1c1917, hasPonytail:true },
      { name:'Lucas', skinColor:0x9c6644, shirtColor:0x386641, pantsColor:0xd4a373, shoeColor:0x422415, hairColor:0x281c15, hasGlasses:true, hasBook:true },
      { name:'David', skinColor:0x8a5d3f, shirtColor:0x457b9d, pantsColor:0x1d3557, shoeColor:0x2b2d42, hairColor:0x111111, hasGlasses:true },
      { name:'Amina', skinColor:0x70452f, shirtColor:0x8e5ea2, pantsColor:0x243447, shoeColor:0xf4e9dd, hairColor:0x17110e, hasPonytail:true },
      { name:'Sofia', skinColor:0xb87a54, shirtColor:0x2a9d8f, pantsColor:0x3b4252, shoeColor:0xf1f1ef, hairColor:0x5a3522, hasBook:true },
      { name:'Theo', skinColor:0x80553c, shirtColor:0xb56576, pantsColor:0x355070, shoeColor:0x443128, hairColor:0x2b1b12, hasBackpack:true },
      { name:'Maya', skinColor:0x9f6547, shirtColor:0xe9c46a, pantsColor:0x31572c, shoeColor:0xffffff, hairColor:0x241713, hasGlasses:true }
    ];
    people.forEach((p, i) => {
      const dir = (i % 2 === 0) ? 1 : -1;
      this.createWalkingHumanNPC({ ...p, x: -16 + i * 4.4, z: 26.6, minX:-17.5, maxX:17.5, dir, speed:0.82 + (i % 4) * 0.10 });
    });
  }

  createWalkingHumanNPC(config) {
    const npcGroup = new THREE.Group();
    npcGroup.position.set(config.x, 0, config.z);

    const targetRotY = (config.dir > 0) ? Math.PI / 2 : -Math.PI / 2;
    npcGroup.rotation.y = targetRotY;

    const skinMat = this.clayMaterial(config.skinColor, 0.85);
    const shirtMat = this.clayMaterial(config.shirtColor, 0.82);
    const pantsMat = this.clayMaterial(config.pantsColor, 0.85);
    const shoeMat = this.clayMaterial(config.shoeColor, 0.8);
    const hairMat = this.clayMaterial(config.hairColor, 0.9);

    // Torso (Roblox / Clay stylized chest & waist)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.24), shirtMat);
    torso.position.y = 0.96;
    torso.castShadow = true;
    npcGroup.add(torso);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 8), skinMat);
    neck.position.y = 1.25;
    npcGroup.add(neck);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.29;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
    head.position.y = 0.14;
    head.castShadow = true;
    headGroup.add(head);

    // Facial clay beads (Eyes)
    const eyeMat = this.clayMaterial(0x1a1a1a, 0.4);
    [-0.05, 0.05].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
      eye.position.set(ex, 0.15, 0.125);
      headGroup.add(eye);
    });

    // Friendly smile
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI),
      this.clayMaterial(0x3a1d12, 0.8)
    );
    smile.rotation.x = Math.PI * 0.9;
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.10, 0.13);
    headGroup.add(smile);

    // Hair / Hat / Accessories
    if (config.hatColor) {
      // Baseball cap crown and visor
      const capMat = this.clayMaterial(config.hatColor, 0.82);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
      cap.position.y = 0.16;
      headGroup.add(cap);

      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10, 1, false, 0, Math.PI * 0.7), capMat);
      visor.rotation.y = Math.PI * 0.65;
      visor.position.set(0, 0.14, 0.07);
      headGroup.add(visor);
    } else if (config.hasPonytail) {
      // Hair dome + high ponytail + headband
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), hairMat);
      hair.position.set(0, 0.16, -0.02);
      headGroup.add(hair);

      const bandMat = this.clayMaterial(0xf4a261, 0.8);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.016, 6, 16), bandMat);
      band.position.set(0, 0.16, 0.01);
      headGroup.add(band);

      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), hairMat);
      tail.scale.set(0.8, 1.4, 0.8);
      tail.rotation.x = 0.4;
      tail.position.set(0, 0.22, -0.16);
      headGroup.add(tail);
    } else {
      // Textured clay hair
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.152, 10, 10), hairMat);
      hair.position.set(0, 0.16, -0.015);
      headGroup.add(hair);
    }

    if (config.hasGlasses) {
      const frameMat = this.clayMaterial(0x222222, 0.5);
      [-0.05, 0.05].forEach(gx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 12), frameMat);
        ring.position.set(gx, 0.15, 0.135);
        headGroup.add(ring);
      });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), frameMat);
      bridge.position.set(0, 0.15, 0.138);
      headGroup.add(bridge);
    }

    npcGroup.add(headGroup);

    // 2 ARTICULATED LEGS (Hip Pivots with proper leg cylinder and shoes)
    const legL = new THREE.Group();
    legL.position.set(-0.11, 0.70, 0);
    const legMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.64, 8), pantsMat);
    legMeshL.position.y = -0.32;
    legMeshL.castShadow = true;
    legL.add(legMeshL);
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), shoeMat);
    shoeL.position.set(0, -0.64, 0.03);
    shoeL.castShadow = true;
    legL.add(shoeL);
    npcGroup.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.11, 0.70, 0);
    const legMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.64, 8), pantsMat);
    legMeshR.position.y = -0.32;
    legMeshR.castShadow = true;
    legR.add(legMeshR);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), shoeMat);
    shoeR.position.set(0, -0.64, 0.03);
    shoeR.castShadow = true;
    legR.add(shoeR);
    npcGroup.add(legR);

    // 2 ARTICULATED ARMS (Shoulder Pivots with jacket sleeves and clay hands)
    const armL = new THREE.Group();
    armL.position.set(-0.25, 1.18, 0);
    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.44, 8), shirtMat);
    sleeveL.position.y = -0.22;
    sleeveL.castShadow = true;
    armL.add(sleeveL);
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
    handL.position.y = -0.45;
    armL.add(handL);
    npcGroup.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.25, 1.18, 0);
    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.44, 8), shirtMat);
    sleeveR.position.y = -0.22;
    sleeveR.castShadow = true;
    armR.add(sleeveR);
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
    handR.position.y = -0.45;
    armR.add(handR);

    if (config.hasBook) {
      // Handheld Clay Hardcover Book
      const bookGroup = new THREE.Group();
      bookGroup.position.set(0.02, -0.45, 0.06);
      bookGroup.rotation.set(0.4, 0.2, 0);

      const coverMat = this.clayMaterial(0x8b263e, 0.85);
      const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.035), coverMat);
      bookGroup.add(bookCover);

      const pageMat = this.clayMaterial(0xf5eed7, 0.9);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.03), pageMat);
      pages.position.x = 0.01;
      bookGroup.add(pages);

      armR.add(bookGroup);
    }

    npcGroup.add(armR);

    // Optional Accessories
    if (config.hasBackpack) {
      const packMat = this.clayMaterial(0x7a4b2a, 0.85);
      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.16), packMat);
      backpack.position.set(0, 0.95, -0.18);
      backpack.castShadow = true;
      npcGroup.add(backpack);

      const strapMat = this.clayMaterial(0x422817, 0.9);
      [-0.1, 0.1].forEach(sx => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.03), strapMat);
        strap.position.set(sx, 0.98, -0.06);
        npcGroup.add(strap);
      });
    }

    this.scene.add(npcGroup);

    this.promenadeNPCs.push({
      name: config.name,
      group: npcGroup,
      legL,
      legR,
      armL,
      armR,
      minX: config.minX,
      maxX: config.maxX,
      dir: config.dir,
      speed: config.speed,
      walkCycle: Math.random() * Math.PI * 2,
      targetRotY,
      holdItem: !!config.hasBook
    });
  }


  updatePromenadeNPCs(dt) {
    if (!this.promenadeNPCs) return;
    const lerp = (a,b,t) => ({ x:THREE.MathUtils.lerp(a[0],b[0],t), z:THREE.MathUtils.lerp(a[1],b[1],t) });
    this.promenadeNPCs.forEach((npc, idx) => {
      if (npc.loopState === undefined) {
        npc.loopState = 'boardwalk'; npc.hiddenElapsed = 0; npc.hiddenDuration = 5 + ((idx * 1.37) % 5);
      }
      if (npc.loopState === 'boardwalk') {
        npc.group.visible = true;
        npc.group.position.x += npc.dir * npc.speed * dt;
        npc.group.position.z = 26.6 + Math.sin((npc.group.position.x + idx) * 0.16) * 0.10;
        npc.targetRotY = (npc.dir > 0) ? Math.PI / 2 : -Math.PI / 2;
        if ((npc.dir > 0 && npc.group.position.x >= 18) || (npc.dir < 0 && npc.group.position.x <= -18)) {
          npc.loopState = 'sideHidden'; npc.hiddenElapsed = 0; npc.hiddenDuration = 5 + ((idx * 1.37) % 5); npc.group.visible = false;
        }
      } else {
        npc.hiddenElapsed += dt;
        const phase = Math.min(1, npc.hiddenElapsed / npc.hiddenDuration);
        const pts = npc.dir > 0 ? [[18,26.6],[22,-8],[22,-39],[-22,-39],[-18,26.6]] : [[-18,26.6],[-22,-8],[-22,-39],[22,-39],[18,26.6]];
        const scaled = phase * 4; const seg = Math.min(3, Math.floor(scaled)); const t = Math.min(1, scaled - seg);
        const p = lerp(pts[seg], pts[seg + 1], t);
        npc.group.position.set(p.x, 0, p.z);
        if (phase >= 1) { npc.group.position.set(npc.dir > 0 ? -18 : 18, 0, 26.6); npc.loopState = 'boardwalk'; npc.group.visible = true; }
      }
      npc.group.rotation.y = THREE.MathUtils.lerp(npc.group.rotation.y, npc.targetRotY, dt * 5.0);
      npc.walkCycle += dt * npc.speed * 5.0; const stride = Math.sin(npc.walkCycle);
      npc.legL.rotation.x = stride * 0.58; npc.legR.rotation.x = -stride * 0.58;
      if (!npc.holdItem) { npc.armL.rotation.x = -stride * 0.48; npc.armR.rotation.x = stride * 0.48; }
      else { npc.armL.rotation.x = -stride * 0.34; npc.armR.rotation.x = -0.32 + Math.sin(npc.walkCycle * 0.5) * 0.06; }
      if (npc.group.visible) npc.group.position.y = Math.abs(Math.sin(npc.walkCycle * 2.0)) * 0.035;
    });
  }


  build3DSunAndSky() {
    const sunGroup = new THREE.Group();
    sunGroup.position.set(16, 36, 50);
    const sunMat = this.clayMaterial(0xffd426, 0.5, 0.1);
    const rayMat = this.clayMaterial(0xffb703, 0.5, 0.1);
    const eyeMat = this.clayMaterial(0x3a2512, 0.9);
    const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(3.6, 20, 20), sunMat);
    sunGroup.add(sunSphere);
    [-0.9,0.9].forEach(ex => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32,10,10), eyeMat); eye.scale.set(1,1.4,0.6); eye.position.set(ex,0.6,-3.45); sunGroup.add(eye); });
    const smileCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.2,-0.4,-3.45), new THREE.Vector3(0,-1.2,-3.48), new THREE.Vector3(1.2,-0.4,-3.45)]);
    sunGroup.add(new THREE.Mesh(new THREE.TubeGeometry(smileCurve,16,0.16,8,false), eyeMat));
    for (let i=0;i<12;i++){ const ray = new THREE.Mesh(new THREE.ConeGeometry(0.55,2.2,8), rayMat); const a=(i/12)*Math.PI*2; ray.position.set(Math.cos(a)*4.7,Math.sin(a)*4.7,-0.05); ray.rotation.z=a-Math.PI/2; sunGroup.add(ray); }
    this.scene.add(sunGroup);

    const cloudMat = this.clayMaterial(0xffffff, 0.96);
    const makeCloud = (x,y,z,s,drift) => {
      const cloud = new THREE.Group(); cloud.position.set(x,y,z); cloud.userData = { baseX:x, baseZ:z, speed:drift, offset:Math.random()*10 };
      [[0,0,0,1.1],[-1.0,-0.12,0,0.78],[1.0,-0.08,0,0.84],[-0.35,0.45,0,0.92],[0.45,0.38,0,1.0]].forEach(([px,py,pz,ps]) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(ps*s,14,12), cloudMat); puff.position.set(px*s,py*s,pz*s); cloud.add(puff);
      });
      this.scene.add(cloud); this.skyClouds.push(cloud);
    };
    makeCloud(-19, 27, 38, 1.55, 0.05); makeCloud(18, 29, 39, 1.35, 0.04); makeCloud(-5, 25, 42, 0.75, 0.055); makeCloud(30, 23, 48, 0.95, 0.045);

    const birdBodyMat = this.clayMaterial(0xf7f7f2, 0.55);
    const birdTipMat = this.clayMaterial(0x1b1b1b, 0.75);
    for (let i=0;i<7;i++) {
      const bird = new THREE.Group(); bird.position.set(-24+i*7, 20+(i%3)*2.2, 32+i*2.0); bird.userData={baseX:bird.position.x,baseY:bird.position.y,baseZ:bird.position.z,speed:0.06+i*0.008,offset:i*1.9};
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6), birdBodyMat); bird.add(body);
      const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.65,6), birdBodyMat); wingL.position.set(-0.35,0,0); wingL.rotation.z=Math.PI/2; bird.add(wingL);
      const wingR = wingL.clone(); wingR.position.x=0.35; wingR.rotation.z=-Math.PI/2; bird.add(wingR);
      const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.035,6,4), birdTipMat); tipL.position.set(-0.64,0,0); bird.add(tipL);
      const tipR = tipL.clone(); tipR.position.x=0.64; bird.add(tipR);
      bird.userData.wingL=wingL; bird.userData.wingR=wingR; this.scene.add(bird); this.flyingBirds.push(bird);
    }
  }


  updateSkyElements(dt, time) {
    if (this.skyClouds) {
      this.skyClouds.forEach(cloud => {
        const data = cloud.userData;
        cloud.position.x = data.baseX + Math.sin(time * data.speed + data.offset) * 1.4;
        cloud.position.z = data.baseZ + Math.cos(time * data.speed * 0.7 + data.offset) * 0.5;
      });
    }
    if (this.flyingBirds) {
      this.flyingBirds.forEach(bird => {
        const data = bird.userData;
        bird.position.x = data.baseX + Math.sin(time * data.speed + data.offset) * 10.0;
        bird.position.z = data.baseZ + Math.cos(time * data.speed + data.offset) * 3.5;
        bird.position.y = data.baseY + Math.sin(time * data.speed * 1.3 + data.offset) * 0.8;
        const wingAngle = Math.sin(time * 5.0 + data.offset) * 0.35;
        data.wingL.rotation.z = Math.PI / 2 + wingAngle;
        data.wingR.rotation.z = -Math.PI / 2 - wingAngle;
      });
    }
  }

  createEntrancePlanter(x, z) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 0.9, 16), this.clayMaterial(0xab5838, 0.75));
    pot.position.set(x, 0.45, z);
    pot.castShadow = true;
    this.scene.add(pot);

    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), this.clayMaterial(0x3e7545, 0.85));
    bush.position.set(x, 1.2, z);
    bush.castShadow = true;
    this.scene.add(bush);

    // Pink / red blossoms on planter
    for (let i = 0; i < 8; i++) {
      const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), this.clayMaterial(0xdf4a6e, 0.7));
      fl.position.set(x + (Math.random() - 0.5) * 0.9, 1.1 + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.9);
      this.scene.add(fl);
    }
  }

  buildParkBench(x, z, rotY, withBooks = false) {
    const bench = new THREE.Group();
    const wood = this.clayMaterial(0xa0673a, 0.75); // Honey oak wood
    const iron = this.clayMaterial(0x2a221b, 0.6);

    // Seat slats
    for (let s = 0; s < 4; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.16), wood);
      slat.position.set(0, 0.55, -0.28 + s * 0.18);
      slat.castShadow = true;
      bench.add(slat);
    }

    // Backrest slats
    const back1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.06), wood);
    back1.position.set(0, 0.85, -0.32);
    back1.castShadow = true;
    bench.add(back1);

    const back2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.06), wood);
    back2.position.set(0, 1.12, -0.35);
    back2.castShadow = true;
    bench.add(back2);

    // Legs & Armrests
    [-1.05, 1.05].forEach(lx => {
      const legF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), iron);
      legF.position.set(lx, 0.275, 0.22);
      bench.add(legF);
      const legB = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), iron);
      legB.position.set(lx, 0.55, -0.34);
      bench.add(legB);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.65), wood);
      arm.position.set(lx, 0.78, -0.05);
      bench.add(arm);
    });

    // Backrest inscription or book stack
    if (withBooks) {
      // "A QUIETER BRIGHTER WORLD" text plate
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#a0673a';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#4a2b15';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('A QUIETER', 256, 45);
      ctx.fillText('BRIGHTER WORLD', 256, 85);
      const tex = new THREE.CanvasTexture(canvas);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.25), new THREE.MeshBasicMaterial({ map: tex }));
      plate.position.set(0, 1.12, -0.31);
      bench.add(plate);

      // Stack of books on right of bench
      const bColors = [0x2f608f, 0x9b3329, 0xd49b43];
      bColors.forEach((c, idx) => {
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.3), this.clayMaterial(c, 0.7));
        bk.position.set(0.6, 0.62 + idx * 0.085, 0);
        bk.rotation.y = (idx - 1) * 0.1;
        bk.castShadow = true;
        bench.add(bk);
      });
    }

    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;
    this.scene.add(bench);
  }

  buildReadingSquirrel(x, z) {
    const squirrelGroup = new THREE.Group();
    const benchPos = new THREE.Vector3(x - 0.2, 0.58, z);
    const treeBase = new THREE.Vector3(-7.25, 0.12, 16.9);
    squirrelGroup.position.copy(benchPos);

    const furMat = this.clayMaterial(0x8e4420, 0.88);
    const creamMat = this.clayMaterial(0xf7eedb, 0.85);
    const darkMat = this.clayMaterial(0x1a120c, 0.35, 0.15);
    const walnutMat = this.clayMaterial(0x7d4b26, 0.96);

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), furMat);
    body.scale.set(0.92, 1.18, 0.88);
    body.position.set(0, 0.22, 0);
    body.castShadow = true;
    squirrelGroup.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), creamMat);
    belly.scale.set(0.82, 1.08, 0.62);
    belly.position.set(0, 0.20, 0.105);
    squirrelGroup.add(belly);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.46, 0.04);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), furMat);
    headGroup.add(head);

    [-0.078, 0.078].forEach(cx => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 10), creamMat);
      cheek.scale.set(1.0, 0.72, 0.9);
      cheek.position.set(cx, -0.05, 0.105);
      headGroup.add(cheek);
    });

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), darkMat);
    nose.position.set(0, -0.01, 0.175);
    headGroup.add(nose);

    [-0.095, 0.095].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), darkMat);
      eye.position.set(ex, 0.05, 0.13);
      headGroup.add(eye);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      shine.position.set(ex + 0.012, 0.07, 0.16);
      headGroup.add(shine);
    });

    [-0.10, 0.10].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.15, 10), furMat);
      ear.position.set(ex, 0.16, -0.01);
      ear.rotation.z = idx === 0 ? 0.18 : -0.18;
      headGroup.add(ear);
    });
    squirrelGroup.add(headGroup);

    const legL = new THREE.Group();
    const legR = new THREE.Group();
    [-0.12, 0.12].forEach((lx, idx) => {
      const leg = idx === 0 ? legL : legR;
      leg.position.set(lx, 0.13, 0.02);
      const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), furMat);
      thigh.scale.set(0.7, 1.0, 1.1);
      leg.add(thigh);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.04, 0.13), furMat);
      foot.position.set(0, -0.08, 0.11);
      leg.add(foot);
      squirrelGroup.add(leg);
    });

    const armL = new THREE.Group();
    const armR = new THREE.Group();
    [-0.085, 0.085].forEach((ax, idx) => {
      const arm = idx === 0 ? armL : armR;
      arm.position.set(ax, 0.25, 0.10);
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.15, 8), furMat);
      limb.position.y = -0.055;
      limb.rotation.x = 0.68;
      limb.rotation.z = idx === 0 ? -0.22 : 0.22;
      arm.add(limb);
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.029, 7, 7), creamMat);
      paw.position.set(idx === 0 ? 0.02 : -0.02, -0.12, 0.08);
      arm.add(paw);
      squirrelGroup.add(arm);
    });

    // The squirrel now holds a walnut, never a sign or book.
    const walnutGroup = new THREE.Group();
    walnutGroup.position.set(0, 0.18, 0.22);
    const walnut = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 1), walnutMat);
    walnut.scale.set(0.96, 1.10, 0.86);
    walnut.castShadow = true;
    walnutGroup.add(walnut);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.007, 6, 14), this.clayMaterial(0x5f351c, 0.9));
    seam.rotation.x = Math.PI / 2;
    walnutGroup.add(seam);
    squirrelGroup.add(walnutGroup);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.16, -0.13);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), this.clayMaterial(0x9c3d18, 0.92));
    tail.scale.set(0.50, 1.48, 0.86);
    tail.position.set(0, 0.25, -0.06);
    tail.rotation.x = -0.34;
    tail.castShadow = true;
    tailGroup.add(tail);
    squirrelGroup.add(tailGroup);

    squirrelGroup.rotation.y = 0.25;
    this.scene.add(squirrelGroup);

    this.barnabySquirrel = {
      group: squirrelGroup,
      headGroup,
      tailGroup,
      walnutGroup,
      legL,
      legR,
      armL,
      armR,
      benchPos,
      treeBase
    };

    body.userData = {
      type: 'squirrel',
      name: 'Barnaby the Walnut Squirrel',
      prompt: 'âœ¦ Barnaby runs to the tree, retrieves a walnut, and returns to his bench.'
    };
    head.userData = body.userData;
    this.interactiveObjects.push(body);
    this.interactiveObjects.push(head);
  }


  updateBarnabySquirrel(time) {
    if (!this.barnabySquirrel) return;
    const b = this.barnabySquirrel;
    const cycle = time % 28.0;
    const lerp3 = (a, c, t) => a.clone().lerp(c, THREE.MathUtils.clamp(t, 0, 1));
    let running = false; b.group.visible = true;

    if (cycle < 5) { b.group.position.copy(b.benchPos); b.group.rotation.y = 0.25; b.walnutGroup.visible = true; }
    else if (cycle < 8) { const p = lerp3(b.benchPos,b.treeBase,(cycle-5)/3); p.y += Math.abs(Math.sin(time*12))*0.035; b.group.position.copy(p); b.group.rotation.y=-Math.PI/2; b.walnutGroup.visible=false; running=true; }
    else if (cycle < 11) { b.group.position.set(b.treeBase.x, THREE.MathUtils.lerp(0.12,3.15,(cycle-8)/3), b.treeBase.z); b.group.rotation.y=Math.PI; b.walnutGroup.visible=false; running=true; }
    else if (cycle < 13) { b.group.position.set(b.treeBase.x,3.15,b.treeBase.z); b.group.visible = cycle < 11.6 || cycle > 12.4; b.walnutGroup.visible = cycle > 12.2; }
    else if (cycle < 16) { b.group.position.set(b.treeBase.x, THREE.MathUtils.lerp(3.15,0.12,(cycle-13)/3), b.treeBase.z); b.group.rotation.y=0; b.walnutGroup.visible=true; running=true; }
    else if (cycle < 19) { const p = lerp3(b.treeBase,b.benchPos,(cycle-16)/3); p.y += Math.abs(Math.sin(time*12))*0.035; b.group.position.copy(p); b.group.rotation.y=Math.PI/2; b.walnutGroup.visible=true; running=true; }
    else { b.group.position.copy(b.benchPos); b.group.rotation.y=0.25; b.walnutGroup.visible=true; }

    const gait = Math.sin(time*13);
    b.legL.rotation.x = running ? gait*0.65 : 0;
    b.legR.rotation.x = running ? -gait*0.65 : 0;
    b.armL.rotation.x = running ? -gait*0.48 : -0.18 + Math.sin(time*4.0)*0.04;
    b.armR.rotation.x = running ? gait*0.48 : 0.22 + Math.sin(time*4.0+1.3)*0.04;
    b.tailGroup.rotation.x = -0.20 + Math.sin(time*2.2)*0.10;
    b.tailGroup.rotation.z = Math.cos(time*1.8)*0.08;
    b.headGroup.rotation.x = 0.08 + Math.sin(time*1.5)*0.035;
    b.headGroup.rotation.z = (!running && b.walnutGroup.visible) ? Math.sin(time*5.5)*0.045 : 0;
    b.walnutGroup.rotation.y = Math.sin(time*2.0)*0.12;
    b.walnutGroup.scale.setScalar((!running && b.walnutGroup.visible) ? 1.0 + Math.sin(time*6.0)*0.035 : 1.0);
  }

  buildStoneMilestone(x, z) {
    const stoneGroup = new THREE.Group();
    stoneGroup.position.set(x, 0, z);

    const stoneMat = this.clayMaterial(0x948b82, 0.9);
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.5), stoneMat);
    stone.position.y = 0.7;
    stone.castShadow = true;
    stone.receiveShadow = true;
    stoneGroup.add(stone);

    // Inscription (Image 1)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#948b82';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#3e352d';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOOKS', 256, 140);
    ctx.fillText('IDEAS', 256, 200);
    ctx.fillText('PEOPLE', 256, 260);
    ctx.font = '32px Georgia, serif';
    ctx.fillText('A BRIGHTER', 256, 340);
    ctx.fillText('TOMORROW', 256, 385);
    ctx.fillStyle = '#3d6e4a';
    ctx.beginPath();
    ctx.arc(230, 440, 20, 0, Math.PI);
    ctx.arc(280, 440, 20, 0, Math.PI);
    ctx.fill();

    const stoneTex = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }));
    label.position.set(0, 0.7, 0.26);
    stoneGroup.add(label);

    // Pip the Bluebird perched on top
    const birdMat = this.clayMaterial(0x3a78b5, 0.8);
    const bellyMat = this.clayMaterial(0xdb8246, 0.85);
    const beakMat = this.clayMaterial(0xe8a928, 0.7);

    const birdBody = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), birdMat);
    birdBody.scale.set(0.9, 1.1, 1.2);
    birdBody.position.set(0.1, 1.5, 0);
    birdBody.castShadow = true;
    stoneGroup.add(birdBody);

    const birdBelly = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bellyMat);
    birdBelly.position.set(0.1, 1.48, 0.08);
    stoneGroup.add(birdBelly);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0.1, 1.52, 0.18);
    stoneGroup.add(beak);

    stoneGroup.rotation.y = 0.25;
    this.scene.add(stoneGroup);

    stone.userData = {
      type: 'milestone',
      name: "Leola's Milestone & Pip the Bluebird",
      prompt: '✦ Pip chirps: "Welcome! Come on inside!"'
    };
    this.interactiveObjects.push(stone);
  }

  buildStreetLampWithBanner(x, z) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0, z);

    const blackIron = this.clayMaterial(0x1e1e1e, 0.4, 0.5);

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.5, 12), blackIron);
    base.position.y = 0.25;
    lampGroup.add(base);

    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.0, 12), blackIron);
    pole.position.y = 2.75;
    lampGroup.add(pole);

    // Lantern fixture on top
    const lanternGeo = new THREE.CylinderGeometry(0.28, 0.18, 0.6, 6);
    const lanternMesh = new THREE.Mesh(lanternGeo, this.clayMaterial(0xffea9f, 0.2, 0.1));
    lanternMesh.position.y = 5.4;
    lampGroup.add(lanternMesh);

    const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.35, 6), blackIron);
    lanternCap.position.y = 5.85;
    lampGroup.add(lanternCap);

    const lampLight = new THREE.PointLight(0xffe6a0, 1.5, 12);
    lampLight.position.set(0, 5.4, 0);
    lampGroup.add(lampLight);

    // Hanging Banner (Image 1): "A HAPPIER BRIGHTER KINDER TOMORROW"
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 256;
    bannerCanvas.height = 640;
    const ctx = bannerCanvas.getContext('2d');
    ctx.fillStyle = '#fff7ea';
    ctx.roundRect(8, 8, 240, 624, 16);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#6e4324';
    ctx.stroke();

    ctx.fillStyle = '#4a2b15';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('A', 128, 120);
    ctx.fillText('HAPPIER', 128, 170);
    ctx.fillText('BRIGHTER', 128, 220);
    ctx.fillText('KINDER', 128, 270);
    ctx.fillText('TOMORROW', 128, 320);

    ctx.fillStyle = '#4a7c59';
    ctx.beginPath();
    ctx.arc(110, 400, 18, 0, Math.PI);
    ctx.arc(146, 400, 18, 0, Math.PI);
    ctx.fill();

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.0), new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.8, side: THREE.DoubleSide }));
    banner.position.set(0.7, 3.4, 0);
    lampGroup.add(banner);

    // Banner crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), blackIron);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0.75, 4.9, 0);
    lampGroup.add(crossbar);

    this.scene.add(lampGroup);
  }

  buildChalkboardEasel(x, z) {
    const easel = new THREE.Group();
    easel.position.set(x, 0, z);
    easel.rotation.y = -0.5;

    const wood = this.clayMaterial(0x563219, 0.8);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.06), wood);
    board.position.y = 0.75;
    easel.add(board);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = '#f0e6d2';
    ctx.font = 'bold 32px cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Good', 128, 90);
    ctx.fillText('Stories', 128, 140);
    ctx.fillText('Brighter', 128, 190);
    ctx.fillText('Days', 128, 240);
    ctx.fillText('♥', 128, 290);

    const tex = new THREE.CanvasTexture(canvas);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.15), new THREE.MeshBasicMaterial({ map: tex }));
    face.position.set(0, 0.75, 0.04);
    easel.add(face);

    this.scene.add(easel);
  }

  buildShadeTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 5.0, 12), this.clayMaterial(0x5a361e, 0.9));
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    tree.add(trunk);

    const canopyMat = this.clayMaterial(0x447738, 0.9);
    for (let i = 0; i < 7; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(2.0 + Math.random() * 0.8, 10, 10), canopyMat);
      puff.scale.set(1.1, 0.8, 1.1);
      puff.position.set((Math.random() - 0.5) * 2.5, 4.5 + Math.random() * 2.0, (Math.random() - 0.5) * 2.5);
      puff.castShadow = true;
      tree.add(puff);
    }

    this.scene.add(tree);
  }

  buildLakeAndBridge(x, z) {
    // Water plane
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4a8eb5,
      roughness: 0.1,
      metalness: 0.8
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(16, 32), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x - 6, 0.02, z);
    this.scene.add(water);

    // Arched Wooden Bridge
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - 8, 0.2, z - 2),
      new THREE.Vector3(x - 4, 1.2, z),
      new THREE.Vector3(x, 0.2, z + 2)
    ]);
    const bridge = new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 20, 0.4, 8, false), this.clayMaterial(0x8a5832, 0.8));
    bridge.castShadow = true;
    this.scene.add(bridge);

    // Gazebo Pavilion (Image 1 background)
    const gazebo = new THREE.Group();
    gazebo.position.set(x - 12, 0, z - 6);
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), this.clayMaterial(0xfff7ea, 0.8));
      pillar.position.set(Math.cos(angle) * 1.5, 1.25, Math.sin(angle) * 1.5);
      gazebo.add(pillar);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 6), this.clayMaterial(0xa04c32, 0.75));
    roof.position.y = 3.1;
    gazebo.add(roof);
    this.scene.add(gazebo);
  }

  buildLibraryArchitecture() {
    // 1. Honey-oak floor
    const woodTex = this.createWoodFloorTexture();
    const floorGeo = new THREE.PlaneGeometry(34, 46);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.45,
      metalness: 0.05
    });
    this.interiorFloor = new THREE.Mesh(floorGeo, floorMat);
    this.interiorFloor.rotation.x = -Math.PI / 2;
    this.interiorFloor.position.set(0, 0.05, -15);
    this.interiorFloor.receiveShadow = true;
    this.interiorFloor.userData.walkable = true;
    this.scene.add(this.interiorFloor);

    // 2. Central Braided Jute Rug
    const juteTex = this.createBraidedRugTexture('#c79f74', '#8a5c37');
    const rugGeo = new THREE.CircleGeometry(5.4, 32);
    const rugMat = new THREE.MeshStandardMaterial({ map: juteTex, roughness: 0.85 });
    const centerRug = new THREE.Mesh(rugGeo, rugMat);
    centerRug.rotation.x = -Math.PI / 2;
    centerRug.position.set(0, 0.06, -9);
    centerRug.receiveShadow = true;
    centerRug.userData.walkable = true;
    this.scene.add(centerRug);

    // Entrance Runner Mat
    const welcomeRug = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), rugMat);
    welcomeRug.rotation.x = -Math.PI / 2;
    welcomeRug.position.set(0, 0.06, 2.0);
    welcomeRug.receiveShadow = true;
    welcomeRug.userData.walkable = true;
    this.scene.add(welcomeRug);

    // Reading Nook Moss-Green Rug
    const mossTex = this.createBraidedRugTexture('#527a4d', '#395a35');
    const mossRug = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshStandardMaterial({ map: mossTex, roughness: 0.9 }));
    mossRug.rotation.x = -Math.PI / 2;
    mossRug.position.set(-8.5, 0.06, -16);
    mossRug.receiveShadow = true;
    mossRug.userData.walkable = true;
    this.scene.add(mossRug);
    this.walkableSurfaces.push(this.interiorFloor, centerRug, welcomeRug, mossRug);

    // Walls
    const wallMat = this.clayMaterial(0xf4e6d4, 0.9);
    const trimMat = this.clayMaterial(0x6b3f22, 0.8);

    // Rear Wall with Window looking outside
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(34, 11, 1), wallMat);
    rearWall.position.set(0, 5.5, -37);
    rearWall.receiveShadow = true;
    this.scene.add(rearWall);

    // Side Walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 11, 44), wallMat);
    leftWall.position.set(-17, 5.5, -15);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 11, 44), wallMat);
    rightWall.position.set(17, 5.5, -15);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // GLASS ROOF WITH SKYLIGHT PANES (User requested glass roof!)
    this.buildGlassRoof();

    // Wooden Rafter Arches supporting glass roof
    for (let z = -35; z <= 3; z += 5.5) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(34, 0.7, 0.9), trimMat);
      beam.position.set(0, 10.3, z);
      beam.castShadow = true;
      this.scene.add(beam);
    }

    // Hanging Glowing Globe Lanterns
    this.lanternLightGroup = new THREE.Group();
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfff3d6,
      emissive: 0xffd988,
      emissiveIntensity: 1.8,
      roughness: 0.3
    });
    const cordMat = this.clayMaterial(0x3a2214, 0.7);

    const lanternPositions = [
      [-4.5, 7.5, 0.0],
      [4.5, 7.3, -1.0],
      [-5.0, 7.2, -9.0],
      [5.0, 7.4, -10.0],
      [-4.5, 7.5, -19.0],
      [4.5, 7.2, -20.0]
    ];

    lanternPositions.forEach(([lx, ly, lz]) => {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 11 - ly, 8), cordMat);
      cord.position.set(lx, ly + (11 - ly) * 0.5, lz);
      this.lanternLightGroup.add(cord);

      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), lanternMat);
      globe.position.set(lx, ly, lz);
      this.lanternLightGroup.add(globe);

      const pLight = new THREE.PointLight(0xffe2a4, 2.2, 15, 1.4);
      pLight.position.set(lx, ly - 0.2, lz);
      this.lanternLightGroup.add(pLight);
    });
    this.scene.add(this.lanternLightGroup);

    // --- FULL GLASS FRONT FACADE (SEE THROUGH FROM OUTSIDE TO INSIDE) ---
    // Glass curtain wall on both sides of entrance
    const facadeGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbed6d6,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      thickness: 0.3
    });

    // Left glass facade window
    const glassFacadeL = new THREE.Mesh(new THREE.BoxGeometry(9.0, 8.0, 0.1), facadeGlassMat);
    glassFacadeL.position.set(-9.5, 4.5, 4.9);
    this.scene.add(glassFacadeL);

    // Right glass facade window
    const glassFacadeR = new THREE.Mesh(new THREE.BoxGeometry(9.0, 8.0, 0.1), facadeGlassMat);
    glassFacadeR.position.set(9.5, 4.5, 4.9);
    this.scene.add(glassFacadeR);

    // Stone pillars on far corners
    const stoneColL = new THREE.Mesh(new THREE.BoxGeometry(3.0, 11, 1.5), this.clayMaterial(0xb49a7e, 0.9));
    stoneColL.position.set(-15.5, 5.5, 5.0);
    this.scene.add(stoneColL);

    const stoneColR = new THREE.Mesh(new THREE.BoxGeometry(3.0, 11, 1.5), this.clayMaterial(0xb49a7e, 0.9));
    stoneColR.position.set(15.5, 5.5, 5.0);
    this.scene.add(stoneColR);

    // Stone Inscription on Right Pillar (Image 1): "BRIGHTER PEOPLE KINDER PLACES"
    this.createCarvedPlaque("BRIGHTER\nPEOPLE\nKINDER\nPLACES", 15.4, 7.0, 5.8, 2.2, 3.5);

    // Grand Timber Arch with Carved "LIBRARY" & Book Emblem (Image 1)
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(10.0, 2.2, 1.2), trimMat);
    archBeam.position.set(0, 9.6, 5);
    this.scene.add(archBeam);

    // Semicircular glass window above doors
    const transomGlass = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 0.1, 32, 1, false, 0, Math.PI), facadeGlassMat);
    transomGlass.rotation.z = Math.PI;
    transomGlass.position.set(0, 7.5, 4.9);
    this.scene.add(transomGlass);

    // "Leola's Library" header sign on exterior facade
    this.createSignboard("Leola's Library", 0, 9.6, 5.7, 6.4, 1.2, 52);

    // Interior Arch Banner
    this.createSignboard("A BRIGHTER PEOPLE KINDER PLACES TOMORROW", 0, 8.8, 4.2, 7.4, 1.1, 38);

    // Wall Sculptural Banners inside
    this.createCarvedPlaque("ALL ARE\nWELCOME\nHERE", 16.4, 6.0, -8, 2.6, 3.8);
    this.createCarvedPlaque("BOOKS · IDEAS\nPEOPLE\nA BRIGHTER\nTOMORROW", -16.4, 6.0, -8, 2.6, 3.8);
  }

  buildGlassRoof() {
    // Transparent glass ceiling panes between wooden rafters
    const glassRoofMat = new THREE.MeshPhysicalMaterial({
      color: 0xcde8f5,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.5
    });

    const roofPaneGeo = new THREE.PlaneGeometry(34, 44);
    const glassRoof = new THREE.Mesh(roofPaneGeo, glassRoofMat);
    glassRoof.rotation.x = Math.PI / 2;
    glassRoof.position.set(0, 11, -15);
    this.scene.add(glassRoof);
  }

  buildGlassDoors() {
    this.doorGroupL = new THREE.Group();
    this.doorGroupR = new THREE.Group();

    // High quality glass material with warm transparency
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbed6d6,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.45,
      thickness: 0.15
    });

    const frameMat = this.clayMaterial(0x5a341b, 0.75); // Warm clay wood frame
    const handleMat = this.clayMaterial(0xe8bd38, 0.2, 0.8); // Polished brass handle

    // --- LEFT SLIDING DOOR ---
    const paneL = new THREE.Mesh(new THREE.BoxGeometry(3.3, 5.8, 0.08), glassMat);
    paneL.position.set(-1.75, 3.1, 0);
    this.doorGroupL.add(paneL);

    const topRailL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 0.14), frameMat);
    topRailL.position.set(-1.75, 6.0, 0);
    this.doorGroupL.add(topRailL);

    const bottomRailL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.35, 0.14), frameMat);
    bottomRailL.position.set(-1.75, 0.18, 0);
    this.doorGroupL.add(bottomRailL);

    const leftStileL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.0, 0.14), frameMat);
    leftStileL.position.set(-3.41, 3.1, 0);
    this.doorGroupL.add(leftStileL);

    const rightStileL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.0, 0.14), frameMat);
    rightStileL.position.set(-0.09, 3.1, 0);
    this.doorGroupL.add(rightStileL);

    // Polished Brass Handle
    const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 16), handleMat);
    handleL.position.set(-0.35, 2.8, 0.12);
    this.doorGroupL.add(handleL);

    this.doorGroupL.position.set(0, 0, 4.9);
    this.scene.add(this.doorGroupL);

    // --- RIGHT SLIDING DOOR ---
    const paneR = new THREE.Mesh(new THREE.BoxGeometry(3.3, 5.8, 0.08), glassMat);
    paneR.position.set(1.75, 3.1, 0);
    this.doorGroupR.add(paneR);

    const topRailR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 0.14), frameMat);
    topRailR.position.set(1.75, 6.0, 0);
    this.doorGroupR.add(topRailR);

    const bottomRailR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.35, 0.14), frameMat);
    bottomRailR.position.set(1.75, 0.18, 0);
    this.doorGroupR.add(bottomRailR);

    const leftStileR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.0, 0.14), frameMat);
    leftStileR.position.set(0.09, 3.1, 0);
    this.doorGroupR.add(leftStileR);

    const rightStileR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.0, 0.14), frameMat);
    rightStileR.position.set(3.41, 3.1, 0);
    this.doorGroupR.add(rightStileR);

    const handleR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 16), handleMat);
    handleR.position.set(0.35, 2.8, 0.12);
    this.doorGroupR.add(handleR);

    this.doorGroupR.position.set(0, 0, 4.9);
    this.scene.add(this.doorGroupR);

    // Door Portal Arch Frame
    const archMat = this.clayMaterial(0x8a5430, 0.85);
    const doorFrameArch = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.25, 16, 32, Math.PI), archMat);
    doorFrameArch.position.set(0, 6.0, 4.92);
    this.scene.add(doorFrameArch);

    // Glass transom inside arch
    const transomGeo = new THREE.CircleGeometry(3.4, 32, 0, Math.PI);
    const transom = new THREE.Mesh(transomGeo, glassMat);
    transom.position.set(0, 6.0, 4.9);
    this.scene.add(transom);

    // Overhead sensor track
    const track = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.35, 0.4), frameMat);
    track.position.set(0, 6.15, 4.9);
    this.scene.add(track);

    // Brass Plaque over doors: "Leola's Learning Library"
    const plaqueMat = this.clayMaterial(0xd4af37, 0.3, 0.8);
    const doorPlaque = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 0.08), plaqueMat);
    doorPlaque.position.set(0, 6.6, 5.05);
    this.scene.add(doorPlaque);

    // Interactive Sensor Zone
    const sensorGeo = new THREE.BoxGeometry(6.5, 4.5, 3.0);
    const sensorMat = new THREE.MeshBasicMaterial({ visible: false });
    this.doorSensor = new THREE.Mesh(sensorGeo, sensorMat);
    this.doorSensor.position.set(0, 2.2, 5.0);
    this.doorSensor.userData = { type: 'doors', label: 'Doors: Automatic Clay Slider' };
    this.scene.add(this.doorSensor);
    this.interactiveObjects.push(this.doorSensor);
  }

  buildReceptionDesk() {
    this.deskGroup = new THREE.Group();
    const woodMat = this.clayMaterial(0x6a3e20, 0.78); // Warm honey-oak wood
    const topMat = this.clayMaterial(0x84502b, 0.72); // Polished top counter with wax sheen
    const goldMat = this.clayMaterial(0xd4af37, 0.35, 0.7); // Polished brass

    // Center of 3/4 circle desk
    const centerX = 0;
    const centerZ = -9.0;
    const rOuter = 3.9;
    const rInner = 3.25;
    const rMid = 3.58;
    const counterHeight = 1.15;
    const totalAngle = Math.PI * 1.5; // 270 degrees = 3/4 circle
    const startAngle = -Math.PI * 0.75; // -135 degrees to +135 degrees (rear 90 degrees open)

    // Outer curved wall
    const outerGeo = new THREE.CylinderGeometry(rOuter, rOuter, counterHeight, 48, 1, true, startAngle, totalAngle);
    const outerWall = new THREE.Mesh(outerGeo, woodMat);
    outerWall.position.set(centerX, counterHeight * 0.5, centerZ);
    outerWall.castShadow = true;
    outerWall.receiveShadow = true;
    this.deskGroup.add(outerWall);

    // Inner curved wall
    const innerGeo = new THREE.CylinderGeometry(rInner, rInner, counterHeight, 48, 1, true, startAngle, totalAngle);
    const innerWall = new THREE.Mesh(innerGeo, woodMat);
    innerWall.position.set(centerX, counterHeight * 0.5, centerZ);
    innerWall.castShadow = true;
    this.deskGroup.add(innerWall);

    // Smooth rounded counter top (composed of smoothly overlapping beveled arc segments)
    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const theta = startAngle + (i / segments) * totalAngle;
      const sx = centerX + Math.sin(theta) * rMid;
      const sz = centerZ + Math.cos(theta) * rMid;

      // Rounded soft-edge counter plank
      const topSegment = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.14, 0.36),
        topMat
      );
      topSegment.position.set(sx, counterHeight + 0.07, sz);
      topSegment.rotation.y = theta;
      topSegment.castShadow = true;
      topSegment.receiveShadow = true;
      this.deskGroup.add(topSegment);

      // Base molding trim along outer base
      const baseSegment = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, 0.38),
        woodMat
      );
      const bx = centerX + Math.sin(theta) * (rOuter + 0.04);
      const bz = centerZ + Math.cos(theta) * (rOuter + 0.04);
      baseSegment.position.set(bx, 0.09, bz);
      baseSegment.rotation.y = theta;
      this.deskGroup.add(baseSegment);
    }

    // Soft rounded end-caps for both ends of the 3/4 circle (no sharp edges!)
    [startAngle, startAngle + totalAngle].forEach(endTheta => {
      const ex = centerX + Math.sin(endTheta) * rMid;
      const ez = centerZ + Math.cos(endTheta) * rMid;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, counterHeight + 0.14, 16), topMat);
      cap.position.set(ex, (counterHeight + 0.14) * 0.5, ez);
      cap.castShadow = true;
      this.deskGroup.add(cap);
    });

    // Front Carved Plaque on Desk: "LEOLA'S LIBRARY"
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 512;
    plaqueCanvas.height = 128;
    const pctx = plaqueCanvas.getContext('2d');
    pctx.fillStyle = '#6a3e20';
    pctx.beginPath();
    pctx.roundRect(16, 16, 480, 96, 20);
    pctx.fill();
    pctx.lineWidth = 6;
    pctx.strokeStyle = '#d4af37';
    pctx.stroke();

    pctx.fillStyle = '#fff4d8';
    pctx.font = 'bold 36px Georgia, serif';
    pctx.textAlign = 'center';
    pctx.textBaseline = 'middle';
    pctx.fillText("LEOLA'S LIBRARY", 256, 56);
    pctx.fillStyle = '#e6bd69';
    pctx.font = '18px Georgia, serif';
    pctx.fillText('✦ Welcome · Stories · Community ✦', 256, 88);

    const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
    const frontPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.8),
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.8 })
    );
    frontPlaque.position.set(centerX, 0.65, centerZ + rOuter + 0.05);
    this.deskGroup.add(frontPlaque);

    // Brass Counter Bell at theta = 0.45
    const bellTheta = 0.45;
    const bx = centerX + Math.sin(bellTheta) * rMid;
    const bz = centerZ + Math.cos(bellTheta) * rMid;
    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      goldMat
    );
    bell.position.set(bx, counterHeight + 0.14 + 0.06, bz);
    this.deskGroup.add(bell);

    // Ceramic Daisy Vase on left side of arc (theta = -0.95)
    const vaseTheta = -0.95;
    const vx = centerX + Math.sin(vaseTheta) * rMid;
    const vz = centerZ + Math.cos(vaseTheta) * rMid;
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.45, 16), this.clayMaterial(0xe8d5be, 0.5));
    vase.position.set(vx, counterHeight + 0.14 + 0.22, vz);
    this.deskGroup.add(vase);

    const daisyMat = this.clayMaterial(0xffffff, 0.9);
    const centerMat = this.clayMaterial(0xffd700, 0.8);
    for (let f = 0; f < 3; f++) {
      const daisy = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), daisyMat);
      daisy.scale.set(1.2, 0.3, 1.2);
      daisy.position.set(vx + (f - 1) * 0.08, counterHeight + 0.14 + 0.45, vz + (f % 2) * 0.06);
      this.deskGroup.add(daisy);
      const daisyCenter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), centerMat);
      daisyCenter.position.set(vx + (f - 1) * 0.08, counterHeight + 0.14 + 0.48, vz + (f % 2) * 0.06);
      this.deskGroup.add(daisyCenter);
    }

    // Librarian Helper NPC (Maya) - Pushes the rolling book cart around bookshelves
    this.librarianHelper = new ClayCharacter(this.scene);

    this.librarianHelper.headMesh.userData = {
      type: 'librarian_helper',
      name: 'Maya (Assistant Librarian)',
      prompt: '✦ Talk to Maya (Assistant Librarian)'
    };
    this.librarianHelper.torsoMesh.userData = {
      type: 'librarian_helper',
      name: 'Maya (Assistant Librarian)',
      prompt: '✦ Talk to Maya (Assistant Librarian)'
    };
    this.interactiveObjects.push(this.librarianHelper.headMesh);
    this.interactiveObjects.push(this.librarianHelper.torsoMesh);

    // Invisible interactive sensor for the entire curved desk
    const deskSensor = new THREE.Mesh(
      new THREE.CylinderGeometry(rOuter + 0.4, rOuter + 0.4, counterHeight + 0.4, 16, 1, true, startAngle, totalAngle),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    deskSensor.position.set(centerX, counterHeight * 0.5, centerZ);
    deskSensor.userData = {
      type: 'desk',
      name: "Leola's 3/4 Circle Reception Desk",
      prompt: '✦ Click to Meet Leola at the Desk',
      walkTo: new THREE.Vector3(0, 1.8, -5.2)
    };
    this.interactiveObjects.push(deskSensor);
    this.deskGroup.add(deskSensor);

    this.scene.add(this.deskGroup);
  }

  buildInteractiveDeskProps() {
    const centerZ = -9.0;
    const rMid = 3.58;
    const deskTopY = 1.15 + 0.14; // Counter surface height

    // 1. 3D Book: "Needle & Yarn: A Love Stitched in Time" at theta = -0.38
    const theta1 = -0.38;
    const b1X = Math.sin(theta1) * rMid;
    const b1Z = centerZ + Math.cos(theta1) * rMid;

    const book1Group = new THREE.Group();
    book1Group.position.set(b1X, deskTopY + 0.06, b1Z);
    book1Group.rotation.y = theta1;

    const book1Cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.11, 0.88),
      this.clayMaterial(0x28568c, 0.72) // Rich ocean blue
    );
    book1Cover.castShadow = true;
    book1Group.add(book1Cover);

    const book1Pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.09, 0.84),
      this.clayMaterial(0xfff7e4, 0.9)
    );
    book1Pages.position.set(0.02, 0, 0);
    book1Group.add(book1Pages);

    const b1Canvas = document.createElement('canvas');
    b1Canvas.width = 256;
    b1Canvas.height = 320;
    const b1Ctx = b1Canvas.getContext('2d');
    b1Ctx.fillStyle = '#28568c';
    b1Ctx.fillRect(0, 0, 256, 320);
    b1Ctx.fillStyle = '#ffd767';
    b1Ctx.font = 'bold 28px Georgia, serif';
    b1Ctx.textAlign = 'center';
    b1Ctx.fillText('Needle & Yarn', 128, 110);
    b1Ctx.font = 'italic 16px Georgia, serif';
    b1Ctx.fillText('A Love Stitched in Time', 128, 150);
    b1Ctx.fillText('🧶', 128, 220);
    const b1Tex = new THREE.CanvasTexture(b1Canvas);
    const b1Label = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.78), new THREE.MeshBasicMaterial({ map: b1Tex }));
    b1Label.rotation.x = -Math.PI / 2;
    b1Label.position.set(0, 0.06, 0);
    book1Group.add(b1Label);

    book1Cover.userData = {
      type: 'book-needle',
      name: 'Needle & Yarn: A Love Stitched in Time',
      prompt: '✦ Click to Pick Up & Read "Needle & Yarn"'
    };
    this.interactiveObjects.push(book1Cover);
    this.scene.add(book1Group);

    // 2. 3D Book: "Crochet Mastery" at theta = -0.12
    const theta2 = -0.12;
    const b2X = Math.sin(theta2) * rMid;
    const b2Z = centerZ + Math.cos(theta2) * rMid;

    const book2Group = new THREE.Group();
    book2Group.position.set(b2X, deskTopY + 0.06, b2Z);
    book2Group.rotation.y = theta2;

    const book2Cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.11, 0.88),
      this.clayMaterial(0xc25b30, 0.72) // Warm terracotta amber
    );
    book2Cover.castShadow = true;
    book2Group.add(book2Cover);

    const book2Pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.09, 0.84),
      this.clayMaterial(0xfff7e4, 0.9)
    );
    book2Pages.position.set(0.02, 0, 0);
    book2Group.add(book2Pages);

    const b2Canvas = document.createElement('canvas');
    b2Canvas.width = 256;
    b2Canvas.height = 320;
    const b2Ctx = b2Canvas.getContext('2d');
    b2Ctx.fillStyle = '#c25b30';
    b2Ctx.fillRect(0, 0, 256, 320);
    b2Ctx.fillStyle = '#fff0c7';
    b2Ctx.font = 'bold 28px Georgia, serif';
    b2Ctx.textAlign = 'center';
    b2Ctx.fillText('Crochet Mastery', 128, 110);
    b2Ctx.font = 'italic 16px Georgia, serif';
    b2Ctx.fillText('Foundational Guide', 128, 150);
    b2Ctx.fillText('✨', 128, 220);
    const b2Tex = new THREE.CanvasTexture(b2Canvas);
    const b2Label = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.78), new THREE.MeshBasicMaterial({ map: b2Tex }));
    b2Label.rotation.x = -Math.PI / 2;
    b2Label.position.set(0, 0.06, 0);
    book2Group.add(b2Label);

    book2Cover.userData = {
      type: 'book-crochet',
      name: 'Crochet Mastery: Foundational Guide',
      prompt: '✦ Click to Pick Up & Read "Crochet Mastery"'
    };
    this.interactiveObjects.push(book2Cover);
    this.scene.add(book2Group);

    // 3. 3D Stripe Donation Box at theta = +0.18
    const thetaDon = 0.18;
    const donX = Math.sin(thetaDon) * rMid;
    const donZ = centerZ + Math.cos(thetaDon) * rMid;

    const boxGroup = new THREE.Group();
    boxGroup.position.set(donX, deskTopY + 0.22, donZ);
    boxGroup.rotation.y = thetaDon;

    const boxChest = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.44, 0.52),
      this.clayMaterial(0x562f17, 0.8) // Rich carved wood chest
    );
    boxChest.castShadow = true;
    boxGroup.add(boxChest);

    // Coin slot on top
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.03, 0.04),
      this.clayMaterial(0x111111, 0.2)
    );
    slot.position.set(0, 0.23, 0);
    boxGroup.add(slot);

    // Brass Plaque on front: "DONATIONS · Stripe Support"
    const donCanvas = document.createElement('canvas');
    donCanvas.width = 512;
    donCanvas.height = 160;
    const dctx = donCanvas.getContext('2d');
    dctx.fillStyle = '#d4af37';
    dctx.fillRect(0, 0, 512, 160);
    dctx.fillStyle = '#3a200b';
    dctx.font = 'bold 44px Georgia, serif';
    dctx.textAlign = 'center';
    dctx.fillText('DONATIONS', 256, 70);
    dctx.font = 'bold 24px Georgia, serif';
    dctx.fillText('🔒 Stripe Support', 256, 120);

    const donTex = new THREE.CanvasTexture(donCanvas);
    const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.22), new THREE.MeshBasicMaterial({ map: donTex }));
    plaqueMesh.position.set(0, 0, 0.265);
    boxGroup.add(plaqueMesh);

    boxChest.userData = {
      type: 'donation',
      name: "Stripe Donation Box",
      prompt: "✦ Click to Support Leola's Library via Stripe"
    };
    this.interactiveObjects.push(boxChest);
    this.scene.add(boxGroup);
  }

  buildBookshelves() {
    this.bookshelfGroup = new THREE.Group();
    const woodMat = this.clayMaterial(0x563219, 0.8);

    const leftZPositions = [0.0, -7.0, -14.0, -21.0, -28.0];
    leftZPositions.forEach((zPos, idx) => {
      this.createGrandShelfBay(-15.8, zPos, 0, woodMat, `Bookshelf Bay L${idx + 1}`);
    });

    const rightZPositions = [0.0, -7.0, -14.0, -26.0];
    rightZPositions.forEach((zPos, idx) => {
      this.createGrandShelfBay(15.8, zPos, Math.PI, woodMat, `Bookshelf Bay R${idx + 1}`);
    });

    this.buildRollingLadder(-14.2, -7.0, woodMat);
    // Grand Interactive Earth Globe Station on Left Back Wall (matching reference photo)
    this.buildGrandInteractiveGlobe(-9.2, 0.0, -33.6);

    this.scene.add(this.bookshelfGroup);
  }

  createGrandShelfBay(x, z, rotY, shelfMat, label) {
    const bay = new THREE.Group();
    const bayWidth = 6.4;
    const bayHeight = 9.2;
    const bayDepth = 1.4;

    // Thin back panel at the rear of the bookshelf (not a solid block!)
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, bayHeight, bayWidth), shelfMat);
    back.position.set(-bayDepth * 0.5 + 0.06, bayHeight * 0.5, 0);
    back.castShadow = true;
    back.receiveShadow = true;
    bay.add(back);

    // Left and Right outer uprights
    const uprightL = new THREE.Mesh(new THREE.BoxGeometry(bayDepth, bayHeight, 0.18), shelfMat);
    uprightL.position.set(0, bayHeight * 0.5, -bayWidth * 0.5 + 0.09);
    bay.add(uprightL);

    const uprightR = new THREE.Mesh(new THREE.BoxGeometry(bayDepth, bayHeight, 0.18), shelfMat);
    uprightR.position.set(0, bayHeight * 0.5, bayWidth * 0.5 - 0.09);
    bay.add(uprightR);

    // Top Cornice Header
    const topHeader = new THREE.Mesh(new THREE.BoxGeometry(bayDepth + 0.25, 0.35, bayWidth + 0.2), shelfMat);
    topHeader.position.set(0.08, bayHeight, 0);
    bay.add(topHeader);

    // Bottom Kickplate
    const kickplate = new THREE.Mesh(new THREE.BoxGeometry(bayDepth + 0.1, 0.4, bayWidth), shelfMat);
    kickplate.position.set(0.05, 0.2, 0);
    bay.add(kickplate);

    const shelfCount = 5;
    const bookColors = [
      0xc0392b, // Rich Crimson
      0x27ae60, // Forest Clay Green
      0xf39c12, // Warm Goldenrod
      0x2980b9, // Deep Cerulean
      0x8e44ad, // Royal Plum
      0xd35400, // Rust Terracotta
      0x16a085, // Sage Turquoise
      0xe67e22, // Amber Carrot
      0x2c3e50, // Midnight Navy
      0xf1c40f, // Sunflower Yellow
      0xe74c3c, // Poppy Scarlet
      0x1abc9c  // Seafoam Mint
    ];

    for (let s = 0; s < shelfCount; s++) {
      const sy = 0.8 + s * 1.65;

      // Shelf Plank
      const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(bayDepth, 0.12, bayWidth - 0.1), shelfMat);
      shelfPlank.position.set(0, sy, 0);
      shelfPlank.castShadow = true;
      shelfPlank.receiveShadow = true;
      bay.add(shelfPlank);

      // Books lining the shelf
      const booksInShelf = 22;
      const bookSpacing = (bayWidth - 0.8) / booksInShelf;

      for (let b = 0; b < booksInShelf; b++) {
        const bCol = bookColors[(s * 5 + b) % bookColors.length];
        const bHeight = 1.1 + Math.sin(b * 1.5 + s) * 0.25;
        const bDepth = 0.75 + Math.sin(b * 0.8) * 0.12;
        const bThick = 0.22 + Math.sin(b * 2.1) * 0.05;

        // Book spine / cover
        const bookMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bDepth, bHeight, bThick),
          this.clayMaterial(bCol, 0.75)
        );
        const bz = -(bayWidth * 0.5 - 0.5) + b * bookSpacing;
        // Positioned forward on the shelf so fully visible
        bookMesh.position.set(0.12, sy + bHeight * 0.5 + 0.06, bz);

        // Claymation whimsical tilt
        if (b % 5 === 0) bookMesh.rotation.x = 0.12;
        if (b % 7 === 0) bookMesh.rotation.x = -0.10;

        bookMesh.castShadow = true;
        bookMesh.receiveShadow = true;
        bay.add(bookMesh);

        // Gold embossed spine strip for detailed Pixar aesthetic
        if (b % 3 === 0) {
          const goldBand = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.1, bThick * 0.9),
            this.clayMaterial(0xf1c40f, 0.3, 0.6)
          );
          goldBand.position.set(0.12 + bDepth * 0.5 + 0.01, sy + bHeight * 0.6, bz);
          bay.add(goldBand);
        }
      }

      // Decorative bookends
      const bookendMat = this.clayMaterial(0x8a5430, 0.6, 0.4);
      const bookendL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), bookendMat);
      bookendL.position.set(0.1, sy + 0.25, -bayWidth * 0.5 + 0.35);
      bay.add(bookendL);

      const bookendR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), bookendMat);
      bookendR.position.set(0.1, sy + 0.25, bayWidth * 0.5 - 0.35);
      bay.add(bookendR);
    }

    // Shelf Category Marker Plaque
    const plaqueMat = this.clayMaterial(0xd4af37, 0.3, 0.8);
    const shelfPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 2.2), plaqueMat);
    shelfPlaque.position.set(bayDepth * 0.5 + 0.05, bayHeight - 0.25, 0);
    bay.add(shelfPlaque);

    bay.position.set(x, 0, z);
    bay.rotation.y = rotY;

    this.interactiveObjects.push(bay);
    this.bookshelfGroup.add(bay);
  }

  buildRollingLadder(x, z, woodMat) {
    const ladderGroup = new THREE.Group();
    const sideMat = this.clayMaterial(0x4a2a14, 0.8);
    const rungMat = this.clayMaterial(0xd4af37, 0.3, 0.7);

    [-0.35, 0.35].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 8.8, 0.1), sideMat);
      rail.position.set(rx, 4.4, 0);
      ladderGroup.add(rail);
    });

    for (let r = 0.8; r <= 8.2; r += 0.65) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), rungMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, r, 0);
      ladderGroup.add(rung);
    }

    ladderGroup.position.set(x, 0, z);
    ladderGroup.rotation.z = -0.16;
    this.bookshelfGroup.add(ladderGroup);
  }

  // --- DETAILED HIGH-RESOLUTION EARTH TEXTURE (ALL 7 CONTINENTS) ---
  createDetailedEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 1. Deep Azure Ocean Background with subtle bathymetry bands
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#163b63');
    oceanGrad.addColorStop(0.3, '#1a4c80');
    oceanGrad.addColorStop(0.5, '#1e5a96');
    oceanGrad.addColorStop(0.7, '#1a4c80');
    oceanGrad.addColorStop(1, '#163b63');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle wave currents
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let y = 60; y < 960; y += 40) {
      ctx.beginPath();
      for (let x = 0; x <= 2048; x += 32) {
        const dy = Math.sin(x * 0.02 + y) * 4;
        if (x === 0) ctx.moveTo(x, y + dy);
        else ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }

    // Helper: convert longitude (-180 to 180) and latitude (-90 to 90) to canvas (x, y)
    function toXY(lon, lat) {
      const x = ((lon + 180) / 360) * 2048;
      const y = ((90 - lat) / 180) * 1024;
      return [x, y];
    }

    function drawPoly(coords, fillColor, strokeColor = '#e2be62') {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      for (let i = 0; i < coords.length; i++) {
        const [x, y] = toXY(coords[i][0], coords[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }
    }

    // --- CONTINENT 1: NORTH AMERICA ---
    const northAmerica = [
      [-168, 65], [-160, 71], [-140, 70], [-130, 68], [-120, 75], [-90, 78], [-80, 74],
      [-65, 60], [-55, 50], [-60, 44], [-68, 44], [-70, 41], [-75, 38], [-80, 26],
      [-81, 24], [-82, 30], [-89, 30], [-97, 26], [-97, 20], [-90, 16], [-83, 10],
      [-78, 8], [-83, 9], [-87, 13], [-92, 16], [-105, 22], [-110, 28], [-115, 32],
      [-122, 37], [-124, 48], [-135, 56], [-150, 60], [-162, 55], [-168, 65]
    ];
    drawPoly(northAmerica, '#3f7c49');

    // Rocky Mountains Ridge (Ochre)
    const rockies = [
      [-130, 60], [-125, 52], [-120, 45], [-112, 38], [-105, 30], [-108, 30],
      [-116, 40], [-124, 50], [-130, 60]
    ];
    drawPoly(rockies, '#8a6234', null);

    // Greenland
    const greenland = [
      [-52, 60], [-40, 65], [-20, 76], [-28, 82], [-50, 83], [-60, 75], [-52, 60]
    ];
    drawPoly(greenland, '#e8f4f8');

    // --- CONTINENT 2: SOUTH AMERICA ---
    const southAmerica = [
      [-78, 8], [-72, 12], [-62, 10], [-50, 2], [-35, -5], [-35, -12], [-39, -18],
      [-48, -28], [-55, -38], [-65, -54], [-75, -52], [-74, -42], [-70, -32],
      [-71, -18], [-80, -4], [-80, 2], [-78, 8]
    ];
    drawPoly(southAmerica, '#488550');

    // Andes Mountains (Ochre Ridge)
    const andes = [
      [-76, 5], [-73, -5], [-72, -18], [-69, -32], [-71, -45], [-74, -50],
      [-72, -45], [-67, -30], [-68, -15], [-70, -5], [-74, 5]
    ];
    drawPoly(andes, '#7e5630', null);

    // --- CONTINENT 3: EUROPE ---
    const europe = [
      [-9, 38], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54], [10, 58], [15, 56],
      [28, 70], [32, 65], [30, 55], [24, 45], [14, 40], [16, 38], [12, 37], [5, 43],
      [-3, 36], [-9, 38]
    ];
    drawPoly(europe, '#498652');

    // Scandinavia
    const scandinavia = [
      [5, 58], [12, 56], [18, 60], [28, 70], [22, 71], [15, 68], [6, 62], [5, 58]
    ];
    drawPoly(scandinavia, '#417a4a');

    // British Isles
    const britain = [
      [-5, 50], [0, 52], [1, 56], [-3, 58], [-5, 55], [-5, 50]
    ];
    drawPoly(britain, '#3e7c48');

    // --- CONTINENT 4: AFRICA ---
    const africa = [
      [-6, 36], [10, 37], [25, 32], [32, 31], [35, 26], [43, 12], [51, 12], [42, -5],
      [36, -20], [28, -33], [19, -34], [14, -22], [10, -5], [10, 5], [-15, 12],
      [-17, 21], [-10, 32], [-6, 36]
    ];
    drawPoly(africa, '#44804a');

    // Sahara Desert (Warm Sand Gold)
    const sahara = [
      [-15, 30], [5, 35], [25, 32], [32, 28], [30, 18], [10, 16], [-14, 18], [-15, 30]
    ];
    drawPoly(sahara, '#c99f52', null);

    // Madagascar
    const madagascar = [
      [44, -12], [49, -15], [50, -24], [44, -25], [44, -12]
    ];
    drawPoly(madagascar, '#438048');

    // --- CONTINENT 5: ASIA ---
    const asia = [
      [30, 40], [40, 42], [50, 40], [60, 45], [80, 52], [100, 55], [130, 60],
      [170, 66], [180, 64], [160, 52], [140, 45], [130, 38], [122, 30], [118, 22],
      [108, 14], [104, 2], [98, 10], [90, 22], [80, 12], [73, 22], [62, 25],
      [55, 24], [48, 12], [44, 15], [35, 28], [36, 36], [30, 40]
    ];
    drawPoly(asia, '#48824f');

    // Arabian Peninsula (Gold Sand)
    const arabia = [
      [36, 28], [48, 30], [58, 24], [55, 16], [44, 14], [36, 28]
    ];
    drawPoly(arabia, '#c89d50');

    // India Subcontinent
    const india = [
      [68, 24], [78, 8], [88, 22], [80, 28], [68, 24]
    ];
    drawPoly(india, '#4a8552');

    // Japan
    const japan = [
      [130, 32], [136, 35], [142, 42], [140, 44], [132, 36], [130, 32]
    ];
    drawPoly(japan, '#3f7c48');

    // --- CONTINENT 6: AUSTRALIA & OCEANIA ---
    const australia = [
      [114, -22], [122, -15], [134, -12], [145, -15], [152, -24], [152, -32],
      [145, -38], [130, -32], [115, -34], [113, -26], [114, -22]
    ];
    drawPoly(australia, '#4a8552');

    // Outback (Red Ochre)
    const outback = [
      [120, -22], [138, -20], [142, -28], [125, -30], [120, -22]
    ];
    drawPoly(outback, '#b26836', null);

    // New Zealand
    const newZealand = [
      [172, -36], [176, -38], [174, -42], [168, -46], [172, -36]
    ];
    drawPoly(newZealand, '#427f4a');

    // --- CONTINENT 7: ANTARCTICA (ICE SHEET) ---
    const antarctica = [
      [-180, -70], [-120, -68], [-60, -64], [-30, -72], [20, -68], [80, -66],
      [140, -68], [180, -70], [180, -90], [-180, -90], [-180, -70]
    ];
    drawPoly(antarctica, '#e8f5fb', '#b8dceb');

    // 2. Latitudinal & Longitudinal Navigation Grid (Gold Embroidery Style)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1.5;

    // Equator (Solid Gold)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(2048, 512);
    ctx.stroke();

    // Tropics of Cancer & Capricorn (Dashed Gold)
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = '#c49a32';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 378);
    ctx.lineTo(2048, 378);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 646);
    ctx.lineTo(2048, 646);
    ctx.stroke();
    ctx.setLineDash([]);

    // Prime Meridian
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(1024, 0);
    ctx.lineTo(1024, 1024);
    ctx.stroke();

    // 3. Vintage Compass Rose in the South Pacific (lon = -130, lat = -30)
    const [compX, compY] = toXY(-130, -30);
    ctx.save();
    ctx.translate(compX, compY);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.stroke();

    for (let p = 0; p < 8; p++) {
      const ang = (p * Math.PI) / 4;
      const r = p % 2 === 0 ? 54 : 36;
      ctx.fillStyle = p % 2 === 0 ? '#d4af37' : '#9b7425';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang - 0.2) * 12, Math.sin(ang - 0.2) * 12);
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      ctx.lineTo(Math.cos(ang + 0.2) * 12, Math.sin(ang + 0.2) * 12);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -66);
    ctx.fillText('S', 0, 66);
    ctx.fillText('W', -66, 0);
    ctx.fillText('E', 66, 0);
    ctx.restore();

    // Title Scroll in Atlantic Ocean (lon = -30, lat = 25)
    const [titleX, titleY] = toXY(-30, 25);
    ctx.fillStyle = 'rgba(255, 248, 235, 0.85)';
    ctx.strokeStyle = '#8a5528';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(titleX - 120, titleY - 24, 240, 48, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a2813';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("LEOLA'S WORLD GLOBE", titleX, titleY - 4);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#7a421a';
    ctx.fillText("All Seven Continents", titleX, titleY + 12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // --- GRAND INTERACTIVE TERRESTRIAL GLOBE ON LEFT BACK WALL (Image 1789895236937) ---
  buildGrandInteractiveGlobe(x, y, z) {
    this.grandGlobeGroup = new THREE.Group();
    this.grandGlobeGroup.name = 'Grand_Globe_Station';
    this.grandGlobeGroup.position.set(x, y, z);

    const loader = new THREE.TextureLoader();
    const oakMat = this.clayMaterial(0x7e471d, 0.76); // Rich warm honey-oak matching photo
    const darkOakMat = this.clayMaterial(0x4a2610, 0.82);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.75 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x966432, roughness: 0.45, metalness: 0.65 });

    // 1. Hand-Turned Honey-Oak Pedestal Stand (Stepped circular molded base & baluster column)
    const baseR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.54, 0.12, 32), oakMat);
    baseR1.position.y = 0.06;
    baseR1.castShadow = true;
    baseR1.receiveShadow = true;
    this.grandGlobeGroup.add(baseR1);

    const baseR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.09, 32), oakMat);
    baseR2.position.y = 0.165;
    baseR2.castShadow = true;
    this.grandGlobeGroup.add(baseR2);

    const baseR3 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 32), oakMat);
    baseR3.position.y = 0.25;
    baseR3.castShadow = true;
    this.grandGlobeGroup.add(baseR3);

    // Turned Baluster Column Pillar with Carved Bead Rings
    const neckLower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.20, 0.22, 24), oakMat);
    neckLower.position.y = 0.40;
    this.grandGlobeGroup.add(neckLower);

    const beadLower = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 12, 24), oakMat);
    beadLower.rotation.x = Math.PI / 2;
    beadLower.position.y = 0.51;
    this.grandGlobeGroup.add(beadLower);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), oakMat);
    bulb.scale.set(1.0, 1.45, 1.0);
    bulb.position.y = 0.70;
    this.grandGlobeGroup.add(bulb);

    const beadUpper = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 12, 24), oakMat);
    beadUpper.rotation.x = Math.PI / 2;
    beadUpper.position.y = 0.88;
    this.grandGlobeGroup.add(beadUpper);

    const neckUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.18, 24), oakMat);
    neckUpper.position.y = 0.99;
    this.grandGlobeGroup.add(neckUpper);

    // Lower Brass Mounting Collar & Spherical Drop Finial
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.10, 24), brassMat);
    collar.position.y = 1.13;
    this.grandGlobeGroup.add(collar);

    const dropFinial = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), oakMat);
    dropFinial.position.set(0, 1.08, 0.12);
    this.grandGlobeGroup.add(dropFinial);

    // 2. Semi-Meridian Gimbal Arc Ring at 23.5° Tilt
    const arcRadius = 0.86;
    const meridianArc = new THREE.Mesh(
      new THREE.TorusGeometry(arcRadius, 0.045, 16, 48, Math.PI * 1.06),
      bronzeMat
    );
    meridianArc.position.set(0, 1.82, 0);
    meridianArc.rotation.z = Math.PI * (23.5 / 180);
    meridianArc.rotation.y = Math.PI / 2;
    meridianArc.castShadow = true;
    this.grandGlobeGroup.add(meridianArc);

    // Polar Spindle Axis & Finials
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.92, 12), brassMat);
    spindle.position.y = 1.82;
    spindle.rotation.z = Math.PI * (23.5 / 180);
    this.grandGlobeGroup.add(spindle);

    const tiltRad = Math.PI * (23.5 / 180);
    const finialNorth = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), oakMat);
    finialNorth.position.set(-Math.sin(tiltRad) * 0.98, 1.82 + Math.cos(tiltRad) * 0.98, 0);
    this.grandGlobeGroup.add(finialNorth);

    const finialSouth = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), brassMat);
    finialSouth.position.set(Math.sin(tiltRad) * 0.98, 1.82 - Math.cos(tiltRad) * 0.98, 0);
    this.grandGlobeGroup.add(finialSouth);

    // 3. Glazed Cerulean Blue Clay Earth Sphere with Raised Continents & Fluffy 3D Clouds
    const earthTexture = this.createDetailedEarthTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.24,
      metalness: 0.06
    });

    const globeGeo = new THREE.SphereGeometry(0.72, 36, 36);
    this.grandGlobeSphere = new THREE.Mesh(globeGeo, globeMat);
    this.grandGlobeSphere.position.set(0, 1.82, 0);
    this.grandGlobeSphere.rotation.z = tiltRad;
    this.grandGlobeSphere.castShadow = true;
    this.grandGlobeSphere.receiveShadow = true;

    // Raised 3D Fluffy White Clay Clouds hovering over oceans (Matching Image 1789895236937!)
    const cloudMat = this.clayMaterial(0xfffdfa, 0.92);
    const cloudDefs = [
      { lat: 46, lon: -35, scale: 0.09 },   // Over North Atlantic
      { lat: -22, lon: -18, scale: 0.085 },  // Over South Atlantic
      { lat: 14, lon: -130, scale: 0.095 }, // Over East Pacific
      { lat: -26, lon: -110, scale: 0.08 }   // Over South Pacific
    ];

    cloudDefs.forEach(c => {
      const phi = (90 - c.lat) * (Math.PI / 180);
      const theta = (c.lon + 180) * (Math.PI / 180);
      const cloudGroup = new THREE.Group();

      const p1 = new THREE.Mesh(new THREE.SphereGeometry(c.scale, 8, 8), cloudMat);
      p1.scale.set(1.2, 0.6, 0.9);
      cloudGroup.add(p1);

      const p2 = new THREE.Mesh(new THREE.SphereGeometry(c.scale * 0.75, 8, 8), cloudMat);
      p2.position.set(c.scale * 0.7, 0, 0);
      cloudGroup.add(p2);

      const p3 = new THREE.Mesh(new THREE.SphereGeometry(c.scale * 0.7, 8, 8), cloudMat);
      p3.position.set(-c.scale * 0.7, 0, 0);
      cloudGroup.add(p3);

      const rad = 0.738;
      cloudGroup.position.set(
        -rad * Math.sin(phi) * Math.cos(theta),
        rad * Math.cos(phi),
        rad * Math.sin(phi) * Math.sin(theta)
      );
      cloudGroup.lookAt(0, 0, 0);
      this.grandGlobeSphere.add(cloudGroup);
    });

    this.grandGlobeSphere.userData = {
      type: 'grand_globe',
      name: 'Grand Terrestrial Earth Globe',
      prompt: '🖐 Click & Drag to Spin the Earth Globe'
    };
    this.grandGlobeGroup.add(this.grandGlobeSphere);
    this.interactiveObjects.push(this.grandGlobeSphere);

    // 4. Surrounding Left Back Wall Environment (Matching Reference Photo)
    // Honey-Oak Arched Window with Garden View & Sunlight
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 3.75, -2.85); // Back wall at z = -36.45

    const windowArch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.14, 12, 24, Math.PI), oakMat);
    windowArch.position.y = 1.3;
    windowGroup.add(windowArch);

    const windowJambL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 0.18), oakMat);
    windowJambL.position.set(-1.3, 0, 0);
    windowGroup.add(windowJambL);

    const windowJambR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 0.18), oakMat);
    windowJambR.position.set(1.3, 0, 0);
    windowGroup.add(windowJambR);

    const windowSill = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.35), oakMat);
    windowSill.position.set(0, -1.3, 0.08);
    windowGroup.add(windowSill);

    // Glass pane with sunlit outdoor trees
    const windowPaneTex = this.createArchedWindowBackdropTexture();
    const windowPane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 3.6),
      new THREE.MeshBasicMaterial({ map: windowPaneTex })
    );
    windowPane.position.set(0, 0.35, 0.01);
    windowGroup.add(windowPane);

    // Warm Sunbeam Point Light streaming through the window onto the globe
    const sunbeamLight = new THREE.PointLight(0xffecc2, 2.2, 7.5, 1.2);
    sunbeamLight.position.set(0, 3.6, -1.8);
    this.grandGlobeGroup.add(sunbeamLight);
    this.grandGlobeGroup.add(windowGroup);

    // Chalkboard on Wall: "Stories Open New Horizons ★ ♥" (Right of window)
    const chalkTex = loader.load('assets/images/globe_chalkboard_horizons.png');
    const chalkboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.65, 0.08),
      new THREE.MeshStandardMaterial({ map: chalkTex, roughness: 0.85 })
    );
    chalkboard.position.set(2.4, 3.35, -2.8);
    this.grandGlobeGroup.add(chalkboard);

    // Wooden Plaque on Left Bookshelf Bay: "Good Books Brighter Worlds ♥"
    const plaqueTex = loader.load('assets/images/globe_plaque_good_books.png');
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.25, 0.06),
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.85 })
    );
    plaque.position.set(-3.1, 2.45, -1.2);
    this.grandGlobeGroup.add(plaque);

    // Bay Window Reading Bench with Blue Corduroy Cushion & "Read Explore Belong ♥" Pillow
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-2.2, 0, -1.3);

    const benchBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 1.4), oakMat);
    benchBase.position.set(0, 0.21, 0);
    benchGroup.add(benchBase);

    const benchCushion = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 1.35), this.clayMaterial(0x1d3557, 0.95));
    benchCushion.position.set(0, 0.50, 0);
    benchGroup.add(benchCushion);

    const pillowTex = loader.load('assets/images/globe_pillow_explore.png');
    const explorePillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.44, 0.16),
      new THREE.MeshStandardMaterial({ map: pillowTex, roughness: 0.9 })
    );
    explorePillow.position.set(-0.25, 0.72, -0.28);
    explorePillow.rotation.y = 0.25;
    explorePillow.rotation.z = -0.15;
    benchGroup.add(explorePillow);

    benchCushion.userData = {
      type: 'globe_bench',
      name: 'Globe Reading Window Bench',
      prompt: '✦ Sit by the Grand Globe & Read',
      walkTo: new THREE.Vector3(x - 2.2, 1.8, z - 0.2),
      seatPos: new THREE.Vector3(x - 2.2, 1.25, z - 1.1),
      seatLook: new THREE.Vector3(x, 1.7, z)
    };
    this.interactiveObjects.push(benchCushion);
    this.grandGlobeGroup.add(benchGroup);

    // Potted Ivy Plant on Floor next to Globe
    const floorPot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.26, 12), this.clayMaterial(0xa85638, 0.88));
    floorPot.position.set(-1.15, 0.13, 0.35);
    floorPot.castShadow = true;
    this.grandGlobeGroup.add(floorPot);

    const floorLeafMat = this.clayMaterial(0x386641, 0.85);
    for (let l = 0; l < 22; l++) {
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), floorLeafMat);
      lf.scale.set(1.3, 0.35, 1.3);
      lf.position.set(
        -1.15 + (Math.random() - 0.5) * 0.45,
        0.26 + (Math.random() - 0.5) * 0.15,
        0.35 + (Math.random() - 0.5) * 0.45
      );
      this.grandGlobeGroup.add(lf);
    }

    // Braided Concentric Oval Rugs on Floor under Globe
    const globeRugTex = this.createBraidedPebbleRugTexture();
    const globeRug = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32),
      new THREE.MeshStandardMaterial({ map: globeRugTex, roughness: 0.9 })
    );
    globeRug.rotation.x = -Math.PI / 2;
    globeRug.position.set(0, 0.062, 0.2);
    globeRug.receiveShadow = true;
    globeRug.userData.walkable = true;
    this.walkableSurfaces.push(globeRug);
    this.grandGlobeGroup.add(globeRug);

    this.scene.add(this.grandGlobeGroup);
  }

  createArchedWindowBackdropTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // Sunny morning sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 768);
    skyGrad.addColorStop(0, '#75bbf2');
    skyGrad.addColorStop(0.5, '#b9e2f5');
    skyGrad.addColorStop(0.85, '#ffe9b8');
    skyGrad.addColorStop(1, '#8fa876');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 768);

    // Warm sun rays / morning glow
    ctx.fillStyle = 'rgba(255, 248, 214, 0.35)';
    ctx.beginPath();
    ctx.arc(256, 120, 180, 0, Math.PI * 2);
    ctx.fill();

    // Soft garden trees & leaves outside
    const leafColors = ['#467838', '#5b9649', '#7bb863', '#39632d'];
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = leafColors[i % leafColors.length];
      const lx = 40 + Math.random() * 432;
      const ly = 320 + Math.random() * 400;
      const lr = 35 + Math.random() * 45;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Window mullions (vertical and horizontal wooden dividers)
    ctx.strokeStyle = '#5a351a';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 768);
    ctx.stroke();

    [240, 480].forEach(my => {
      ctx.beginPath();
      ctx.moveTo(0, my);
      ctx.lineTo(512, my);
      ctx.stroke();
    });

    return new THREE.CanvasTexture(canvas);
  }

  buildReadingArea() {
    this.readingGroup = new THREE.Group();
    const woodMat = this.clayMaterial(0x6e472a, 0.8);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.18, 32), woodMat);
    tableTop.position.set(-8.5, 1.05, -16);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.readingGroup.add(tableTop);

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.95, 16), woodMat);
    tableLeg.position.set(-8.5, 0.52, -16);
    this.readingGroup.add(tableLeg);

    const bookL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.8), this.clayMaterial(0xfff6e6, 0.9));
    bookL.position.set(-8.75, 1.18, -16);
    bookL.rotation.z = 0.08;
    this.readingGroup.add(bookL);

    const bookR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.8), this.clayMaterial(0xfff6e6, 0.9));
    bookR.position.set(-8.25, 1.18, -16);
    bookR.rotation.z = -0.08;
    this.readingGroup.add(bookR);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.25, 12), this.clayMaterial(0x3d705c, 0.8));
    cup.position.set(-8.5, 1.25, -15.4);
    this.readingGroup.add(cup);

    this.buildSteppedBookDisplay(-5.0, -11.5, woodMat);
    this.buildMushroomStool(-7.0, -14.2, 0.65);
    this.buildMushroomStool(-10.2, -14.8, 0.55);
    this.buildPlushPouf(-8.5, -13.6, 0xcc9933);
    this.buildPlushPouf(-9.8, -17.2, 0x4a6b82);
    this.buildPlushPouf(-7.0, -17.6, 0xba5a31);
    this.buildSageArmchair(-11.5, -16.0, Math.PI / 2);
    this.buildPlushBunny(-8.5, 0.72, -13.6);

    const lamp = new THREE.PointLight(0xffdf99, 2.0, 10);
    lamp.position.set(-8.5, 2.6, -16);
    this.readingGroup.add(lamp);

    this.createSignboard("QUIET READING NOOK", -8.5, 3.8, -16, 4.2, 0.9, 42);

    tableTop.userData = {
      type: 'reading-table',
      name: 'Reading Table',
      prompt: '✦ Click to Sit Down & Read Needle & Yarn',
      walkTo: new THREE.Vector3(-8.5, 1.8, -13.8),
      seatPos: new THREE.Vector3(-8.5, 1.35, -14.2),
      seatLook: new THREE.Vector3(-8.5, 1.15, -16.0)
    };
    this.interactiveObjects.push(tableTop);

    this.scene.add(this.readingGroup);
  }

  buildSteppedBookDisplay(x, z, woodMat) {
    const standGroup = new THREE.Group();
    standGroup.position.set(x, 0, z);

    for (let t = 0; t < 3; t++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4 + t * 0.45, 0.5), woodMat);
      step.position.set(0, (0.4 + t * 0.45) * 0.5, -t * 0.45);
      step.castShadow = true;
      standGroup.add(step);
    }

    const titles = [
      { text: "Little\\nReaders\\nBrighter\\nWorlds", bg: "#f0e4d0", fg: "#4a2a14" },
      { text: "Dream\\nBig", bg: "#9ec5db", fg: "#1d3d52" },
      { text: "Kindness\\nGrows", bg: "#9edba4", fg: "#1f5227" },
      { text: "Explore\\nTogether", bg: "#5ba2c4", fg: "#0e3345" },
      { text: "Braver\\nKinder", bg: "#d9ab66", fg: "#4a2a0a" },
      { text: "Quieter\\nWorld", bg: "#a89edb", fg: "#271c52" }
    ];

    titles.forEach((item, idx) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = item.bg;
      ctx.roundRect(8, 8, 240, 304, 16);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#4a2b15';
      ctx.stroke();

      ctx.fillStyle = item.fg;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center';
      const lines = item.text.split('\\n');
      lines.forEach((l, li) => {
        ctx.fillText(l, 128, 90 + li * 42);
      });

      const bookTex = new THREE.CanvasTexture(canvas);
      const bookCover = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.95, 0.08),
        new THREE.MeshStandardMaterial({ map: bookTex, roughness: 0.7 })
      );
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      bookCover.position.set(-1.0 + col * 1.0, 0.65 + row * 0.45, -row * 0.45 + 0.15);
      bookCover.rotation.x = -0.15;
      bookCover.castShadow = true;
      standGroup.add(bookCover);
    });

    standGroup.rotation.y = -0.3;
    this.readingGroup.add(standGroup);
  }

  buildMushroomStool(x, z, scale = 0.6) {
    const shroom = new THREE.Group();
    shroom.position.set(x, 0, z);

    const stemMat = this.clayMaterial(0xf4ede2, 0.9);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, 0.7 * scale, 16), stemMat);
    stem.position.y = 0.35 * scale;
    stem.castShadow = true;
    shroom.add(stem);

    const capMat = this.clayMaterial(0xc93b2b, 0.85);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
    cap.scale.set(1.1, 0.7, 1.1);
    cap.position.y = 0.65 * scale;
    cap.castShadow = true;
    shroom.add(cap);

    const dotMat = this.clayMaterial(0xffffff, 0.9);
    for (let d = 0; d < 6; d++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09 * scale, 8, 8), dotMat);
      const angle = (d / 6) * Math.PI * 2;
      dot.scale.set(1.0, 0.2, 1.0);
      dot.position.set(Math.cos(angle) * 0.35 * scale, 0.75 * scale, Math.sin(angle) * 0.35 * scale);
      shroom.add(dot);
    }

    this.readingGroup.add(shroom);
  }

  buildPlushPouf(x, z, colorHex) {
    const poufMat = this.clayMaterial(colorHex, 0.9);
    const pouf = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), poufMat);
    pouf.scale.set(1.2, 0.65, 1.2);
    pouf.position.set(x, 0.4, z);
    pouf.castShadow = true;
    this.readingGroup.add(pouf);
  }

  buildSageArmchair(x, z, rotY) {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);

    const sageMat = this.clayMaterial(0x436854, 0.85);
    const woodMat = this.clayMaterial(0x563219, 0.8);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.6), sageMat);
    seat.position.y = 0.55;
    seat.castShadow = true;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.35), sageMat);
    back.position.set(0, 1.25, -0.65);
    back.castShadow = true;
    chair.add(back);

    [-0.85, 0.85].forEach(ax => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 1.5), sageMat);
      arm.position.set(ax, 0.9, 0);
      arm.castShadow = true;
      chair.add(arm);
    });

    [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.35, 12), woodMat);
      leg.position.set(lx, 0.18, lz);
      chair.add(leg);
    });

    chair.rotation.y = rotY;
    this.readingGroup.add(chair);
  }

  buildPlushBunny(x, y, z) {
    const bunny = new THREE.Group();
    bunny.position.set(x, y, z);
    const bunnyMat = this.clayMaterial(0xf6ede0, 0.9);

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), bunnyMat);
    body.scale.set(1.0, 1.2, 0.9);
    bunny.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), bunnyMat);
    head.position.set(0, 0.32, 0.05);
    bunny.add(head);

    [-0.08, 0.08].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.3, 8), bunnyMat);
      ear.rotation.z = ex * 2.5;
      ear.position.set(ex * 1.5, 0.52, -0.04);
      bunny.add(ear);
    });

    const bCover = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.02), this.clayMaterial(0x3a6ca8, 0.8));
    bCover.position.set(0, 0.15, 0.22);
    bCover.rotation.x = 0.5;
    bunny.add(bCover);

    this.readingGroup.add(bunny);
  }

  buildStudyTablesAndPatrons() {
    this.studyGroup = new THREE.Group();
    const woodMat = this.clayMaterial(0x734825, 0.75); // warm study table oak
    const chairTealMat = this.clayMaterial(0x2d6368, 0.85); // teal upholstered cushions

    // Table 1: x = 6.2, z = -11.5 (generous 7m open aisle separating front desk and study tables)
    this.createStudyTableWithChairs(6.2, -11.5, woodMat, chairTealMat, false);

    // Table 2: x = 6.2, z = -19.5
    this.createStudyTableWithChairs(6.2, -19.5, woodMat, chairTealMat, false);

    this.scene.add(this.studyGroup);
  }

  createStudyTableWithChairs(x, z, woodMat, chairMat, withPatron = false) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, 0, z);

    // Table Top: Large rectangular oak study table
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2.4), woodMat);
    top.position.y = 1.25;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // 4 Table Legs
    [[-2.1, -1.0], [2.1, -1.0], [-2.1, 1.0], [2.1, 1.0]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), woodMat);
      leg.position.set(lx, 0.6, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    // Potted plant in center of table (Image 2)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.25, 12), this.clayMaterial(0xa85638, 0.8));
    pot.position.set(0, 1.45, 0);
    tableGroup.add(pot);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), this.clayMaterial(0x427546, 0.8));
    plant.position.set(0, 1.62, 0);
    tableGroup.add(plant);

    // Open books on table
    const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.45), this.clayMaterial(0xfffaeb, 0.9));
    book1.position.set(-1.2, 1.35, -0.2);
    book1.rotation.y = 0.1;
    tableGroup.add(book1);

    const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.42), this.clayMaterial(0xfffaeb, 0.9));
    book2.position.set(1.3, 1.35, 0.2);
    book2.rotation.y = -0.2;
    tableGroup.add(book2);

    // 6 Chairs facing inward into the table:
    // North side chairs (z = -1.25) facing South (+Z) into table (rotY = 0)
    // South side chairs (z = 1.25) facing North (-Z) into table (rotY = Math.PI)
    [-1.4, 0, 1.4].forEach(cx => {
      this.createStudyChair(tableGroup, cx, -1.25, 0, chairMat, woodMat);
      this.createStudyChair(tableGroup, cx, 1.25, Math.PI, chairMat, woodMat);
    });

    this.studyGroup.add(tableGroup);
  }

  createStudyChair(parent, x, z, rotY, cushionMat, woodMat) {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;

    // Wooden legs
    [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.06), woodMat);
      leg.position.set(lx, 0.325, lz);
      chair.add(leg);
    });

    // Padded Teal Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), cushionMat);
    seat.position.y = 0.7;
    seat.castShadow = true;
    chair.add(seat);

    // Padded Curved Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.1), cushionMat);
    back.position.set(0, 1.15, -0.3);
    back.castShadow = true;
    chair.add(back);

    parent.add(chair);
  }

  createReadingPatron(parent, x, z, rotY) {
    const patron = new THREE.Group();
    patron.position.set(x, 0.65, z);
    patron.rotation.y = rotY;

    // Cozy mustard yellow sweater
    const sweaterMat = this.clayMaterial(0xc78c3a, 0.85);
    const skinMat = this.clayMaterial(0xb07d58, 0.8);
    const hairMat = this.clayMaterial(0x422a18, 0.9);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.55, 12), sweaterMat);
    body.position.y = 0.32;
    body.castShadow = true;
    patron.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
    head.position.set(0, 0.7, 0.05);
    head.rotation.x = 0.25; // looking down at book
    head.castShadow = true;
    patron.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), hairMat);
    hair.position.set(0, 0.75, 0.02);
    patron.add(hair);

    // Arms resting forward on table reading
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8), sweaterMat);
    armL.rotation.set(-0.7, 0.2, 0.3);
    armL.position.set(-0.25, 0.45, 0.2);
    patron.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8), sweaterMat);
    armR.rotation.set(-0.7, -0.2, -0.3);
    armR.position.set(0.25, 0.45, 0.2);
    patron.add(armR);

    parent.add(patron);
  }

  buildArcadeNook() {
    this.arcadeGroup = new THREE.Group();
    // Mounted directly on the East wall (x = 16.4) in the alcove between Bookshelf Bay R3 (z = -14) and Bay R4 (z = -26)
    const arcadePos = new THREE.Vector3(16.35, 0, -20.0);
    this.arcadeGroup.position.copy(arcadePos);
    // Face inwards towards West (negative X direction)
    this.arcadeGroup.rotation.y = -Math.PI / 2;

    const chassisMat = this.clayMaterial(0x3e1d45, 0.72); // Deep rich plum arcade body
    const trimGoldMat = this.clayMaterial(0xe5b23d, 0.45, 0.6); // Classic golden T-molding
    const panelMat = this.clayMaterial(0x1a1a24, 0.85); // Matte control panel black
    const joyShaftMat = this.clayMaterial(0xdcdcdc, 0.2, 0.85); // Chrome joystick shaft
    const joyBallMat = this.clayMaterial(0xd32f2f, 0.35, 0.3); // Candy red arcade ball knob
    const coinDoorMat = this.clayMaterial(0x222226, 0.9); // Stamped steel coin door

    // 1. Wall Mount Bracket Anchor Plates
    const bracketGeo = new THREE.BoxGeometry(0.12, 1.8, 1.4);
    const bracketMat = this.clayMaterial(0x333333, 0.6, 0.5);
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    bracket.position.set(0, 3.2, -0.35);
    this.arcadeGroup.add(bracket);

    // 2. Main Wall-Mounted Cabinet Body (Slanted retro silhouette)
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.4, 1.3), chassisMat);
    body.position.set(0, 3.0, 0.25);
    body.castShadow = true;
    body.receiveShadow = true;
    this.arcadeGroup.add(body);

    // 3. Side Wings with Golden T-Molding Contour
    [-1.02, 1.02].forEach(sideX => {
      const sideWing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.45, 1.36), chassisMat);
      sideWing.position.set(sideX, 3.0, 0.25);
      this.arcadeGroup.add(sideWing);

      // Gold clay edge trim
      const trimFront = new THREE.Mesh(new THREE.BoxGeometry(0.10, 4.46, 0.06), trimGoldMat);
      trimFront.position.set(sideX, 3.0, 0.93);
      this.arcadeGroup.add(trimFront);
    });

    // 4. Backlit Illuminated Marquee Header: "3D CLAY ARCADE · 5 GAMES"
    const marqueeCanvas = document.createElement('canvas');
    marqueeCanvas.width = 512;
    marqueeCanvas.height = 160;
    const mctx = marqueeCanvas.getContext('2d');
    // Glowing gradient
    const grad = mctx.createLinearGradient(0, 0, 512, 160);
    grad.addColorStop(0, '#7b1fa2');
    grad.addColorStop(0.5, '#c2185b');
    grad.addColorStop(1, '#ff6f00');
    mctx.fillStyle = grad;
    mctx.fillRect(0, 0, 512, 160);
    mctx.strokeStyle = '#ffe082';
    mctx.lineWidth = 10;
    mctx.strokeRect(8, 8, 496, 144);
    mctx.fillStyle = '#ffffff';
    mctx.font = 'bold 42px "Arial Black", sans-serif';
    mctx.textAlign = 'center';
    mctx.shadowColor = '#000000';
    mctx.shadowBlur = 8;
    mctx.fillText("★ 3D CLAY ARCADE ★", 256, 68);
    mctx.fillStyle = '#ffe082';
    mctx.font = 'bold 22px Georgia, serif';
    mctx.fillText("✦ 5 RETRO CROCHET GAMES ✦", 256, 118);

    const marqueeTex = new THREE.CanvasTexture(marqueeCanvas);
    const marqueeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 0.65),
      new THREE.MeshStandardMaterial({
        map: marqueeTex,
        roughness: 0.3,
        emissive: 0xffffff,
        emissiveMap: marqueeTex,
        emissiveIntensity: 0.75
      })
    );
    marqueeMesh.position.set(0, 4.75, 0.88);
    marqueeMesh.rotation.x = -0.15;
    this.arcadeGroup.add(marqueeMesh);

    const marqueeLight = new THREE.PointLight(0xffdf88, 1.8, 6);
    marqueeLight.position.set(0, 4.75, 1.2);
    this.arcadeGroup.add(marqueeLight);

    // 5. Beveled CRT Screen Housing with Glowing Animated Crochet Pixel Graphics
    const crtScreenCanvas = document.createElement('canvas');
    crtScreenCanvas.width = 512;
    crtScreenCanvas.height = 384;
    const cctx = crtScreenCanvas.getContext('2d');
    cctx.fillStyle = '#06131c';
    cctx.fillRect(0, 0, 512, 384);
    // Scanlines
    cctx.fillStyle = 'rgba(0, 255, 200, 0.06)';
    for (let y = 0; y < 384; y += 4) {
      cctx.fillRect(0, y, 512, 2);
    }
    // Mini-game graphics
    cctx.fillStyle = '#26c6da';
    cctx.font = 'bold 30px monospace';
    cctx.textAlign = 'center';
    cctx.fillText("YARN RUNNER · 3D", 256, 75);
    cctx.fillStyle = '#ffca28';
    cctx.font = 'bold 20px monospace';
    cctx.fillText("SCORE: 02480   LVL: 04", 256, 115);
    // Pixel yarn ball & cute crochet mascot
    cctx.fillStyle = '#ec407a';
    cctx.beginPath();
    cctx.arc(256, 210, 45, 0, Math.PI * 2);
    cctx.fill();
    cctx.strokeStyle = '#ffffff';
    cctx.lineWidth = 6;
    cctx.beginPath();
    cctx.arc(238, 200, 18, 0, Math.PI * 1.5);
    cctx.stroke();
    cctx.fillStyle = '#ffebee';
    cctx.font = '18px monospace';
    cctx.fillText("INSERT TOKEN OR CLICK TO PLAY", 256, 310);
    cctx.fillStyle = '#69f0ae';
    cctx.fillText("▶ 1P  CROCHET CRUSH  FLAPPY YARN  CRAFT QUEST ◀", 256, 345);

    const crtTex = new THREE.CanvasTexture(crtScreenCanvas);
    const crtMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 1.25),
      new THREE.MeshStandardMaterial({
        map: crtTex,
        roughness: 0.2,
        emissive: 0x26c6da,
        emissiveMap: crtTex,
        emissiveIntensity: 0.65
      })
    );
    crtMesh.position.set(0, 3.45, 0.85);
    crtMesh.rotation.x = -0.25;
    this.arcadeGroup.add(crtMesh);

    const crtGlow = new THREE.PointLight(0x26c6da, 2.2, 7);
    crtGlow.position.set(0, 3.45, 1.25);
    this.arcadeGroup.add(crtGlow);

    // 6. Forward-Extending Slanted Control Deck / Shelf
    const deckGeo = new THREE.BoxGeometry(1.92, 0.16, 0.72);
    const deckMesh = new THREE.Mesh(deckGeo, panelMat);
    deckMesh.position.set(0, 2.38, 1.05);
    deckMesh.rotation.x = 0.20; // Slanted towards player
    deckMesh.castShadow = true;
    this.arcadeGroup.add(deckMesh);

    // Control deck side trims
    const deckTrimMat = this.clayMaterial(0xd4a030, 0.4);
    [-0.97, 0.97].forEach(sx => {
      const dt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.74), deckTrimMat);
      dt.position.set(sx, 2.38, 1.05);
      dt.rotation.x = 0.20;
      this.arcadeGroup.add(dt);
    });

    // 7. Authentic 3D Arcade Joystick / Joypad with Chrome Shaft and Red Ball Knob
    const joyGroup = new THREE.Group();
    joyGroup.position.set(-0.45, 2.45, 1.08);
    joyGroup.rotation.x = 0.20;

    // Joystick rubber washer / mounting ring
    const joyWasher = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.02, 16), chassisMat);
    joyGroup.add(joyWasher);

    // Metal Joystick Shaft
    const joyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.18, 12), joyShaftMat);
    joyShaft.position.y = 0.09;
    joyGroup.add(joyShaft);

    // Candy Red Joystick Ball Knob
    const joyBall = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 16), joyBallMat);
    joyBall.position.y = 0.19;
    joyBall.castShadow = true;
    joyGroup.add(joyBall);
    this.arcadeGroup.add(joyGroup);

    // 8. 6 Colorful Arcade Action Push-Buttons on Control Deck
    const buttonColors = [0xd32f2f, 0x1976d2, 0x388e3c, 0xfbc02d, 0x7b1fa2, 0x0097a7];
    const buttonPositions = [
      [0.05, 0.08], [0.22, 0.10], [0.39, 0.11],
      [0.05, -0.08], [0.22, -0.06], [0.39, -0.05]
    ];
    buttonPositions.forEach(([bx, bz], i) => {
      const bColor = buttonColors[i % buttonColors.length];
      const btnMat = this.clayMaterial(bColor, 0.4, 0.4);
      const btnGroup = new THREE.Group();
      btnGroup.position.set(bx, 2.44, 1.08 + bz);
      btnGroup.rotation.x = 0.20;

      // Button collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.02, 14), chassisMat);
      btnGroup.add(collar);
      // Button plunger cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 14), btnMat);
      cap.position.y = 0.015;
      cap.castShadow = true;
      btnGroup.add(cap);

      this.arcadeGroup.add(btnGroup);
    });

    // 1P / 2P White Start Buttons
    [-0.15, -0.02].forEach(px => {
      const pbtn = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12), this.clayMaterial(0xffffff, 0.5));
      pbtn.position.set(px, 2.50, 0.95);
      pbtn.rotation.x = 0.20;
      this.arcadeGroup.add(pbtn);
    });

    // 9. Lower Front Coin / Token Door with Twin Brass Coin Insert Slots
    const coinDoor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.08), coinDoorMat);
    coinDoor.position.set(0, 1.25, 0.88);
    this.arcadeGroup.add(coinDoor);

    [-0.18, 0.18].forEach(cx => {
      // Lighted 25¢ orange reject button
      const coinInsert = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xff6d00, emissive: 0xff6d00, emissiveIntensity: 0.5 })
      );
      coinInsert.position.set(cx, 1.42, 0.93);
      this.arcadeGroup.add(coinInsert);
    });

    // Interactive target registration
    body.userData = {
      type: 'arcade',
      name: '3D Crochet Arcade (5 Games)',
      prompt: '🕹️ Click to Play 5 Retro Arcade Games',
      walkTo: new THREE.Vector3(13.2, 1.8, -20.0)
    };
    this.interactiveObjects.push(body);

    deckMesh.userData = body.userData;
    this.interactiveObjects.push(deckMesh);
    joyBall.userData = body.userData;
    this.interactiveObjects.push(joyBall);

    this.scene.add(this.arcadeGroup);
  }

  buildMovieBoothBackWall() {
    this.movieBoothGroup = new THREE.Group();

    const oakMat = this.clayMaterial(0x734421, 0.76);
    const darkOakMat = this.clayMaterial(0x4c2813, 0.82);
    const panelMat = this.clayMaterial(0xbf854b, 0.85);
    const goldBrassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.75 });
    const blackMat = this.clayMaterial(0x1a1a1a, 0.6);

    const loader = new THREE.TextureLoader();
    const signTex = loader.load('assets/images/movie_booth_sign.png');
    const screenTex = loader.load('assets/images/movie_booth_screen.png');
    const clapperTex = loader.load('assets/images/movie_booth_clapper.png');
    const plaqueLeftTex = loader.load('assets/images/movie_booth_plaque_left.png');
    const rugTex = loader.load('assets/images/movie_booth_rug.png');

    // 1. Walk-in Alcove Structure (x in [-2.1, 2.1], z in [-33.8, -36.7])
    // Left & Right Inner Oak Paneled Walls
    const innerWallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.6, 2.9), panelMat);
    innerWallL.position.set(-2.1, 2.8, -35.25);
    this.movieBoothGroup.add(innerWallL);

    const innerWallR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.6, 2.9), panelMat);
    innerWallR.position.set(2.1, 2.8, -35.25);
    this.movieBoothGroup.add(innerWallR);

    // Back Oak Paneled Wall of Alcove
    const innerBackWall = new THREE.Mesh(new THREE.BoxGeometry(4.4, 5.6, 0.2), panelMat);
    innerBackWall.position.set(0, 2.8, -36.7);
    this.movieBoothGroup.add(innerBackWall);

    // Ceiling Beam Canopy
    const alcoveCeiling = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 2.9), oakMat);
    alcoveCeiling.position.set(0, 5.5, -35.25);
    this.movieBoothGroup.add(alcoveCeiling);

    // Entrance Archway Header Beam & Top Bookshelf Row
    const headerBeam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 0.85), oakMat);
    headerBeam.position.set(0, 4.70, -34.2);
    this.movieBoothGroup.add(headerBeam);

    // Top Row of Books running across the top of the alcove (as in reference photo!)
    const topRowColors = [0xb83232, 0x2b4c7e, 0x2a9d8f, 0xe76f51, 0xf4a261, 0x5a3d7a, 0x3d704d, 0x8a6a4a, 0xb83232, 0x2b4c7e, 0x2a9d8f, 0xf4a261];
    for (let tb = 0; tb < 14; tb++) {
      const tbH = 0.44 + (tb % 3) * 0.05;
      const tbD = 0.38;
      const tbW = 0.08;
      const tbMat = this.clayMaterial(topRowColors[tb % topRowColors.length], 0.85);
      const topBook = new THREE.Mesh(new THREE.BoxGeometry(tbW, tbH, tbD), tbMat);
      topBook.position.set(-1.85 + tb * 0.28, 4.84 + tbH * 0.5, -34.1);
      this.movieBoothGroup.add(topBook);

      // Heart emblem on spine
      const hDeco = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.045), new THREE.MeshBasicMaterial({ color: 0xfff6ea }));
      hDeco.position.set(-1.85 + tb * 0.28, 4.84 + tbH * 0.4, -33.90);
      this.movieBoothGroup.add(hDeco);
    }

    // 2. Carved Wooden Entrance Sign: "♥ Movie Booth ♥ / Books to Big Adventures"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.82, 0.08),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.75 })
    );
    signBoard.position.set(0, 4.02, -33.74);
    signBoard.castShadow = true;
    this.movieBoothGroup.add(signBoard);

    // Brass hanging chains for sign
    [-1.5, 1.5].forEach(cx => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8), goldBrassMat);
      chain.position.set(cx, 4.42, -33.74);
      this.movieBoothGroup.add(chain);
    });

    // 3. Cinema TV Display with Owl Artwork Screen
    const tvBox = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.95, 0.12), blackMat);
    tvBox.position.set(0, 3.15, -36.56);
    this.movieBoothGroup.add(tvBox);

    const tvScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 1.78),
      new THREE.MeshStandardMaterial({
        map: screenTex,
        roughness: 0.25,
        emissive: 0xffffff,
        emissiveMap: screenTex,
        emissiveIntensity: 0.55
      })
    );
    tvScreen.position.set(0, 3.15, -36.49);
    this.movieBoothGroup.add(tvScreen);

    // Ambient Starlight / Cinema Light
    const cinemaLight = new THREE.PointLight(0x9bd0ff, 1.8, 6.5, 1.4);
    cinemaLight.position.set(0, 3.15, -35.8);
    this.movieBoothGroup.add(cinemaLight);

    // 4. Left Wall Sconce & Plaque
    // Gooseneck brass sconce
    const sconceBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), goldBrassMat);
    sconceBase.rotation.z = Math.PI / 2;
    sconceBase.position.set(-1.98, 4.05, -35.2);
    this.movieBoothGroup.add(sconceBase);

    const sconceArm = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16, Math.PI * 0.75), goldBrassMat);
    sconceArm.position.set(-1.90, 4.00, -35.2);
    sconceArm.rotation.y = Math.PI / 2;
    this.movieBoothGroup.add(sconceArm);

    const sconceShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.22, 12, 1, true),
      this.clayMaterial(0x2d503b, 0.7) // Dark green enamel
    );
    sconceShade.position.set(-1.82, 3.90, -35.2);
    sconceShade.rotation.z = 0.25;
    this.movieBoothGroup.add(sconceShade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff0b3 }));
    bulb.position.set(-1.82, 3.86, -35.2);
    this.movieBoothGroup.add(bulb);

    const sconceLight = new THREE.PointLight(0xffdf88, 2.5, 5.5, 1.2);
    sconceLight.position.set(-1.75, 3.8, -35.2);
    this.movieBoothGroup.add(sconceLight);

    // Plaque under sconce: "Good Movies Grow Great Readers ♥"
    const plaqueLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.05, 0.48),
      new THREE.MeshStandardMaterial({ map: plaqueLeftTex, roughness: 0.85 })
    );
    plaqueLeft.position.set(-1.98, 3.10, -35.2);
    this.movieBoothGroup.add(plaqueLeft);

    // 5. Right Wall Director's Clapperboard
    const clapperBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.15, 0.52),
      new THREE.MeshStandardMaterial({ map: clapperTex, roughness: 0.85 })
    );
    clapperBoard.position.set(1.98, 3.65, -35.2);
    this.movieBoothGroup.add(clapperBoard);

    // 6. Deep Console Counter Shelf Under TV (y = 1.48, z = -36.35)
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.12, 0.65), oakMat);
    counter.position.set(0, 1.48, -36.35);
    counter.castShadow = true;
    this.movieBoothGroup.add(counter);

    // Corbels supporting counter
    [-1.3, 0.0, 1.3].forEach(cx => {
      const corbel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.38), darkOakMat);
      corbel.position.set(cx, 1.25, -36.42);
      this.movieBoothGroup.add(corbel);
    });

    // Popcorn Bucket on Counter (x = -1.15)
    const popcornTubGeo = new THREE.CylinderGeometry(0.19, 0.14, 0.36, 16);
    const popcornTex = this.createPopcornTubTexture();
    const popcornTub = new THREE.Mesh(popcornTubGeo, new THREE.MeshStandardMaterial({ map: popcornTex, roughness: 0.7 }));
    popcornTub.position.set(-1.15, 1.72, -36.32);
    popcornTub.castShadow = true;
    this.movieBoothGroup.add(popcornTub);

    // Popcorn Kernels mounded on top
    const kernelMat = this.clayMaterial(0xffdf6d, 0.85);
    for (let k = 0; k < 28; k++) {
      const kernel = new THREE.Mesh(new THREE.SphereGeometry(0.032 + Math.random() * 0.018, 6, 6), kernelMat);
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.16;
      kernel.position.set(
        -1.15 + Math.cos(angle) * rad,
        1.90 + Math.random() * 0.08,
        -36.32 + Math.sin(angle) * rad
      );
      this.movieBoothGroup.add(kernel);
    }

    // Stack of 3 Books on Center Counter (x = 0) with spine labels
    const stackData = [
      { text: 'Kindness Always Wins ♥', bg: '#4361ee', color: 0x4361ee, h: 0.075, w: 0.30, d: 0.44 },
      { text: 'Animals in Film ★', bg: '#f4a261', color: 0xf4a261, h: 0.072, w: 0.28, d: 0.40 },
      { text: 'Stories on Screen ♥', bg: '#2a9d8f', color: 0x2a9d8f, h: 0.070, w: 0.26, d: 0.36 }
    ];
    let curBookY = 1.54;
    stackData.forEach((bk) => {
      const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(bk.d, bk.h, bk.w), this.clayMaterial(bk.color, 0.85));
      bookMesh.position.set(0.0, curBookY + bk.h * 0.5, -36.32);
      bookMesh.castShadow = true;
      this.movieBoothGroup.add(bookMesh);

      // Spine text decal on front
      const spineTex = this.createMoviePlaqueTexture(bk.text);
      const spineMesh = new THREE.Mesh(new THREE.PlaneGeometry(bk.d * 0.9, bk.h * 0.85), new THREE.MeshStandardMaterial({ map: spineTex }));
      spineMesh.position.set(0.0, curBookY + bk.h * 0.5, -36.32 + bk.w * 0.5 + 0.005);
      this.movieBoothGroup.add(spineMesh);

      curBookY += bk.h;
    });

    // Potted Ivy Plant on Right Counter (x = +1.15)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.22, 12), this.clayMaterial(0xb56345, 0.9));
    pot.position.set(1.15, 1.65, -36.32);
    pot.castShadow = true;
    this.movieBoothGroup.add(pot);

    const ivyLeafMat = this.clayMaterial(0x35633b, 0.85);
    for (let leaf = 0; leaf < 18; leaf++) {
      const lMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), ivyLeafMat);
      lMesh.scale.set(1.2, 0.3, 1.4);
      lMesh.position.set(
        1.15 + (Math.random() - 0.5) * 0.35,
        1.72 - Math.random() * 0.35,
        -36.22 + Math.random() * 0.25
      );
      this.movieBoothGroup.add(lMesh);
    }

    // 7. Built-in Seating Benches (Left & Right)
    // Left Bench (Navy Blue)
    const benchBaseL = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.44, 1.85), oakMat);
    benchBaseL.position.set(-1.45, 0.22, -35.2);
    this.movieBoothGroup.add(benchBaseL);

    const cushionMatL = this.clayMaterial(0x243954, 0.95);
    const cushionL = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.16, 1.80), cushionMatL);
    cushionL.position.set(-1.45, 0.52, -35.2);
    cushionL.receiveShadow = true;
    this.movieBoothGroup.add(cushionL);

    const backrestL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 1.80), cushionMatL);
    backrestL.position.set(-1.95, 0.92, -35.2);
    this.movieBoothGroup.add(backrestL);

    // Pillow: "Cozy Stories Here ♥"
    const pillowTex = this.createPillowTexture("Cozy Stories\nHere ♥");
    const pillowL = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.16),
      new THREE.MeshStandardMaterial({ map: pillowTex, roughness: 0.9 })
    );
    pillowL.position.set(-1.45, 0.74, -35.65);
    pillowL.rotation.y = 0.2;
    pillowL.rotation.z = -0.15;
    this.movieBoothGroup.add(pillowL);

    // Right Bench (Forest Green)
    const benchBaseR = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.44, 1.85), oakMat);
    benchBaseR.position.set(1.45, 0.22, -35.2);
    this.movieBoothGroup.add(benchBaseR);

    const cushionMatR = this.clayMaterial(0x36543b, 0.95);
    const cushionR = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.16, 1.80), cushionMatR);
    cushionR.position.set(1.45, 0.52, -35.2);
    cushionR.receiveShadow = true;
    this.movieBoothGroup.add(cushionR);

    const backrestR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 1.80), cushionMatR);
    backrestR.position.set(1.95, 0.92, -35.2);
    this.movieBoothGroup.add(backrestR);

    // Terracotta Corduroy Star Pillow ("★")
    const starPillowMat = this.clayMaterial(0xb85633, 0.9);
    const pillowR = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.40, 0.16), starPillowMat);
    pillowR.position.set(1.45, 0.74, -35.65);
    pillowR.rotation.y = -0.2;
    pillowR.rotation.z = 0.15;
    this.movieBoothGroup.add(pillowR);

    // White Felt Star attached to center of pillow
    const starShape = this.createStarMesh(0.12, 0.05, 5);
    starShape.position.set(1.44, 0.75, -35.56);
    starShape.rotation.y = -0.2;
    this.movieBoothGroup.add(starShape);

    // Tartan Plaid Throw Blanket draped over corner
    const blanketMat = new THREE.MeshStandardMaterial({
      map: this.createTartanBlanketTexture(),
      roughness: 0.95
    });
    const blanketSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.85), blanketMat);
    blanketSeat.position.set(1.35, 0.62, -34.6);
    this.movieBoothGroup.add(blanketSeat);

    const blanketDrape = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.04), blanketMat);
    blanketDrape.position.set(1.35, 0.38, -34.18);
    this.movieBoothGroup.add(blanketDrape);

    // 8. Floor Rugs
    // Woven runner inside booth: "SMALL SCREEN BIG IDEAS ♥"
    const matInside = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.05),
      new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.9 })
    );
    matInside.rotation.x = -Math.PI / 2;
    matInside.position.set(0, 0.065, -35.2);
    this.movieBoothGroup.add(matInside);

    // Braided circular pebble rug in front of booth
    const pebbleTex = this.createBraidedPebbleRugTexture();
    const frontRug = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32),
      new THREE.MeshStandardMaterial({ map: pebbleTex, roughness: 0.9 })
    );
    frontRug.rotation.x = -Math.PI / 2;
    frontRug.position.set(0, 0.06, -33.2);
    this.movieBoothGroup.add(frontRug);

    // 9. Grand Back Wall Bookshelves & Illuminated Transom Sign
    this.buildGrandBackWallLibraryArchitecture(oakMat, darkOakMat);

    // 10. INTERACTION REGISTRATION
    // Clickable seats and screen
    const boothInteractionData = {
      type: 'movie-booth-seat',
      name: 'Cozy Movie Booth',
      prompt: '🎬 Click to Sit Down & Watch Movies in Movie Booth',
      walkTo: new THREE.Vector3(0, 1.8, -34.8),
      seatPos: new THREE.Vector3(-1.05, 1.15, -35.2),
      seatLook: new THREE.Vector3(0, 1.45, -36.65)
    };

    cushionL.userData = { ...boothInteractionData, seat: 'left', seatPos: new THREE.Vector3(-1.05, 1.15, -35.2) };
    this.interactiveObjects.push(cushionL);

    cushionR.userData = { ...boothInteractionData, seat: 'right', seatPos: new THREE.Vector3(1.05, 1.15, -35.2) };
    this.interactiveObjects.push(cushionR);

    tvScreen.userData = { ...boothInteractionData, prompt: '🎬 Click to Sit & Watch Video Masterclasses' };
    this.interactiveObjects.push(tvScreen);

    this.scene.add(this.movieBoothGroup);
  }

  buildGrandBackWallLibraryArchitecture(oakMat, darkOakMat) {
    const bookColors = [0xb83232, 0x2b4c7e, 0x2a9d8f, 0xe76f51, 0xf4a261, 0x5a3d7a, 0x8a6a4a, 0x3d704d, 0x1f5d63, 0x9b3329, 0xd49b43, 0x3e7c48];

    // --- 1. MOVIE BOOTH FLANKING BOOKCASE TOWERS (bx = -3.7 and +3.7) ---
    [-3.7, 3.7].forEach(bx => {
      const isLeft = bx < 0;

      // Back panel
      const backBoard = new THREE.Mesh(new THREE.BoxGeometry(3.0, 5.4, 0.08), oakMat);
      backBoard.position.set(bx, 2.7, -35.5);
      this.movieBoothGroup.add(backBoard);

      // Outer side upright
      const outerUpright = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.4, 0.80), oakMat);
      outerUpright.position.set(isLeft ? bx - 1.45 : bx + 1.45, 2.7, -35.15);
      this.movieBoothGroup.add(outerUpright);

      // Inner side upright
      const innerUpright = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.4, 0.80), oakMat);
      innerUpright.position.set(isLeft ? bx + 1.45 : bx - 1.45, 2.7, -35.15);
      this.movieBoothGroup.add(innerUpright);

      // Top cornice beam
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.16, 0.85), oakMat);
      topBeam.position.set(bx, 5.35, -35.15);
      this.movieBoothGroup.add(topBeam);

      // Bottom base
      const baseBeam = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.22, 0.85), oakMat);
      baseBeam.position.set(bx, 0.11, -35.15);
      this.movieBoothGroup.add(baseBeam);

      // 5 Horizontal Shelf Levels
      const shelfHeights = [0.85, 1.85, 2.85, 3.85, 4.85];
      shelfHeights.forEach((sy, tier) => {
        const hShelf = new THREE.Mesh(new THREE.BoxGeometry(2.88, 0.08, 0.76), darkOakMat);
        hShelf.position.set(bx, sy, -35.15);
        this.movieBoothGroup.add(hShelf);

        if (isLeft) {
          if (tier === 0) {
            for (let b = 0; b < 6; b++) {
              const bMat = this.clayMaterial(bookColors[(tier * 3 + b) % bookColors.length], 0.85);
              const bH = 0.44 + (b % 3) * 0.06;
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH, 0.36), bMat);
              book.position.set(bx + 0.35 + b * 0.16, sy + 0.04 + bH * 0.5, -35.05);
              this.movieBoothGroup.add(book);
            }
          } else if (tier === 1 || tier === 4) {
            for (let b = 0; b < 12; b++) {
              const bMat = this.clayMaterial(bookColors[(tier * 4 + b) % bookColors.length], 0.85);
              const bH = 0.42 + (b % 4) * 0.05;
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH, 0.36), bMat);
              book.position.set(bx - 1.15 + b * 0.20, sy + 0.04 + bH * 0.5, -35.05);
              this.movieBoothGroup.add(book);

              const heartMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xfff6ea }));
              heartMesh.position.set(bx - 1.15 + b * 0.20, sy + 0.04 + bH * 0.45, -34.86);
              this.movieBoothGroup.add(heartMesh);
            }
          } else if (tier === 2) {
            for (let b = 0; b < 6; b++) {
              const bMat = this.clayMaterial(bookColors[(tier * 2 + b) % bookColors.length], 0.85);
              const bH = 0.45 + (b % 3) * 0.05;
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH, 0.36), bMat);
              book.position.set(bx + 0.35 + b * 0.16, sy + 0.04 + bH * 0.5, -35.05);
              this.movieBoothGroup.add(book);
            }
          } else if (tier === 3) {
            const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.22, 12), this.clayMaterial(0xb56345, 0.9));
            plantPot.position.set(bx - 0.85, sy + 0.15, -35.05);
            this.movieBoothGroup.add(plantPot);

            const leafMat = this.clayMaterial(0x35633b, 0.85);
            for (let l = 0; l < 14; l++) {
              const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), leafMat);
              lf.scale.set(1.3, 0.3, 1.3);
              lf.position.set(bx - 0.85 + (Math.random() - 0.5) * 0.3, sy + 0.26 + Math.random() * 0.15, -35.05 + (Math.random() - 0.5) * 0.25);
              this.movieBoothGroup.add(lf);
            }

            for (let b = 0; b < 7; b++) {
              const bMat = this.clayMaterial(bookColors[(tier * 3 + b) % bookColors.length], 0.85);
              const bH = 0.45 + (b % 3) * 0.06;
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH, 0.36), bMat);
              book.position.set(bx - 0.2 + b * 0.18, sy + 0.04 + bH * 0.5, -35.05);
              this.movieBoothGroup.add(book);
            }
          }
        } else {
          if (tier === 0 || tier === 2 || tier === 4) {
            for (let b = 0; b < 12; b++) {
              const bMat = this.clayMaterial(bookColors[(tier * 3 + b) % bookColors.length], 0.85);
              const bH = 0.42 + (b % 4) * 0.05;
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH, 0.36), bMat);
              book.position.set(bx - 1.15 + b * 0.20, sy + 0.04 + bH * 0.5, -35.05);
              this.movieBoothGroup.add(book);

              const heartMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xfff6ea }));
              heartMesh.position.set(bx - 1.15 + b * 0.20, sy + 0.04 + bH * 0.45, -34.86);
              this.movieBoothGroup.add(heartMesh);
            }
          } else if (tier === 1) {
            for (let b = 0; b < 6; b++) {
              const bMat = this.clayMaterial(bookColors[(tier * 2 + b) % bookColors.length], 0.85);
              const bH = 0.45 + (b % 3) * 0.05;
              const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH, 0.36), bMat);
              book.position.set(bx - 1.15 + b * 0.16, sy + 0.04 + bH * 0.5, -35.05);
              this.movieBoothGroup.add(book);
            }
          }
        }
      });
    });

    // Plaques and Tags on Towers
    const plaque1Tex = this.createMoviePlaqueTexture("Movies\nInspire\nReaders ♥");
    const plaque1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.78, 0.06),
      new THREE.MeshStandardMaterial({ map: plaque1Tex, roughness: 0.85 })
    );
    plaque1.position.set(-4.25, 3.28, -35.05);
    this.movieBoothGroup.add(plaque1);

    const plaque2Tex = this.createMoviePlaqueTexture("Real People\nBrave Ideas\nBetter Worlds ♥");
    const plaque2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.78, 0.06),
      new THREE.MeshStandardMaterial({ map: plaque2Tex, roughness: 0.85 })
    );
    plaque2.position.set(-4.25, 1.28, -35.05);
    this.movieBoothGroup.add(plaque2);

    const tagTexts = [
      { text: 'STORIES', bg: '#2b4c7e' },
      { text: 'ON SCREEN', bg: '#2a9d8f' },
      { text: 'ON THE SHELF', bg: '#e76f51' },
      { text: 'IN YOUR HEART', bg: '#e9c46a' }
    ];
    let tagY = 4.40;
    tagTexts.forEach((tData) => {
      const tagTex = this.createHangingTagTexture(tData.text, tData.bg);
      const tagMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.20, 0.04),
        new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.85 })
      );
      tagMesh.position.set(3.7, tagY, -35.05);
      this.movieBoothGroup.add(tagMesh);
      tagY -= 0.24;
    });

    const pushpin = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xcc292b, roughness: 0.3 })
    );
    pushpin.position.set(3.7, 4.54, -35.05);
    this.movieBoothGroup.add(pushpin);

    const heartCharm = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      this.clayMaterial(0xb83232, 0.85)
    );
    heartCharm.scale.set(1.1, 1.2, 0.6);
    heartCharm.position.set(3.7, tagY - 0.03, -35.05);
    this.movieBoothGroup.add(heartCharm);

    const kinderBookTex = this.createKinderWorldBookTexture();
    const kinderBook = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.78, 0.08),
      new THREE.MeshStandardMaterial({ map: kinderBookTex, roughness: 0.85 })
    );
    kinderBook.position.set(4.25, 2.28, -35.05);
    this.movieBoothGroup.add(kinderBook);

    // --- 2. GRAND ILLUMINATED ARCHED TRANSOM WINDOW & SIGN ABOVE MOVIE BOOTH ---
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 7.2, -36.4);

    const archRadius = 3.2;
    const archFrame = new THREE.Mesh(
      new THREE.TorusGeometry(archRadius, 0.20, 16, 32, Math.PI),
      oakMat
    );
    archFrame.rotation.z = Math.PI;
    archGroup.add(archFrame);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xfff0cc,
      emissive: 0xffd988,
      emissiveIntensity: 0.65,
      roughness: 0.35,
      side: THREE.DoubleSide
    });
    const glassPane = new THREE.Mesh(
      new THREE.CircleGeometry(archRadius - 0.1, 32, 0, Math.PI),
      glassMat
    );
    glassPane.position.z = -0.05;
    archGroup.add(glassPane);

    for (let m = 1; m < 6; m++) {
      const angle = (m / 6) * Math.PI;
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, archRadius - 0.2, 0.08), oakMat);
      mullion.position.set(Math.cos(angle) * (archRadius * 0.5), Math.sin(angle) * (archRadius * 0.5), 0);
      mullion.rotation.z = angle - Math.PI / 2;
      archGroup.add(mullion);
    }

    const transomTex = this.createLeolasLibraryTransomSignTexture();
    const transomSign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 1.65),
      new THREE.MeshStandardMaterial({
        map: transomTex,
        roughness: 0.65,
        emissive: 0xffffff,
        emissiveMap: transomTex,
        emissiveIntensity: 0.35
      })
    );
    transomSign.position.set(0, 0.25, 0.12);
    transomSign.castShadow = true;
    archGroup.add(transomSign);

    const transomLight = new THREE.PointLight(0xffdf99, 2.2, 14, 1.2);
    transomLight.position.set(0, 0.5, 1.0);
    archGroup.add(transomLight);
    this.movieBoothGroup.add(archGroup);

    // --- 3. TALL DOUBLE-HEIGHT GRAND BOOKSHELVES ACROSS EAST BACK WALL (x = 5.2 to 16.2, height 9.4m) ---
    const eastBayWidth = 3.4;
    const eastBayHeight = 9.4;
    const eastBayDepth = 0.85;
    const eastShelfLevels = [1.0, 2.3, 3.6, 4.9, 6.2, 7.5, 8.8];
    const eastBayCenters = [7.0, 10.4, 13.8];

    eastBayCenters.forEach((cx, bayIdx) => {
      const bayGroup = new THREE.Group();
      bayGroup.position.set(cx, 0, -36.2);

      const back = new THREE.Mesh(new THREE.BoxGeometry(eastBayWidth, eastBayHeight, 0.08), oakMat);
      back.position.set(0, eastBayHeight * 0.5, -0.38);
      bayGroup.add(back);

      [-eastBayWidth * 0.5 + 0.08, eastBayWidth * 0.5 - 0.08].forEach(ux => {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.16, eastBayHeight, eastBayDepth), oakMat);
        upright.position.set(ux, eastBayHeight * 0.5, 0);
        upright.castShadow = true;
        bayGroup.add(upright);
      });

      const cornice = new THREE.Mesh(new THREE.BoxGeometry(eastBayWidth + 0.2, 0.45, eastBayDepth + 0.2), oakMat);
      cornice.position.set(0, eastBayHeight - 0.22, 0.05);
      cornice.castShadow = true;
      bayGroup.add(cornice);

      const base = new THREE.Mesh(new THREE.BoxGeometry(eastBayWidth + 0.1, 0.35, eastBayDepth + 0.1), oakMat);
      base.position.set(0, 0.18, 0.02);
      bayGroup.add(base);

      eastShelfLevels.forEach((sy, tierIdx) => {
        const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(eastBayWidth - 0.16, 0.09, eastBayDepth - 0.1), darkOakMat);
        shelfPlank.position.set(0, sy, 0);
        shelfPlank.castShadow = true;
        shelfPlank.receiveShadow = true;
        bayGroup.add(shelfPlank);

        const numBooks = 16;
        const spacing = (eastBayWidth - 0.5) / numBooks;
        for (let b = 0; b < numBooks; b++) {
          const bCol = bookColors[(bayIdx * 7 + tierIdx * 3 + b) % bookColors.length];
          const bH = 0.55 + Math.sin(b * 1.8 + tierIdx) * 0.12;
          const bD = 0.52;
          const bW = 0.11;
          const bk = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), this.clayMaterial(bCol, 0.8));
          const bxPos = -(eastBayWidth * 0.5 - 0.35) + b * spacing;
          bk.position.set(bxPos, sy + bH * 0.5 + 0.045, 0.08);

          if (b % 4 === 0) bk.rotation.z = 0.08;
          if (b % 6 === 0) bk.rotation.z = -0.07;
          bk.castShadow = true;
          bayGroup.add(bk);

          if (b % 2 === 0) {
            const goldStrip = new THREE.Mesh(
              new THREE.BoxGeometry(bW * 0.9, 0.08, 0.02),
              this.clayMaterial(0xf1c40f, 0.35, 0.6)
            );
            goldStrip.position.set(bxPos, sy + bH * 0.65, 0.35);
            bayGroup.add(goldStrip);
          }
        }

        if (tierIdx === 2 && bayIdx === 1) {
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.28, 12), this.clayMaterial(0xb25838, 0.85));
          pot.position.set(0.6, sy + 0.18, 0.15);
          bayGroup.add(pot);
          const vineMat = this.clayMaterial(0x356e3b, 0.85);
          for (let v = 0; v < 18; v++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), vineMat);
            leaf.scale.set(1.4, 0.3, 1.4);
            leaf.position.set(0.6 + (Math.random() - 0.5) * 0.45, sy + 0.25 - v * 0.04, 0.22 + Math.random() * 0.15);
            bayGroup.add(leaf);
          }
        }
      });

      const lampArm = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 16, Math.PI * 0.6), this.clayMaterial(0xd4af37, 0.35, 0.7));
      lampArm.position.set(0, eastBayHeight - 0.05, eastBayDepth * 0.5 + 0.1);
      lampArm.rotation.y = Math.PI / 2;
      bayGroup.add(lampArm);

      const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.26, 0.16, 12), this.clayMaterial(0x2d503b, 0.7));
      lampShade.position.set(0, eastBayHeight - 0.22, eastBayDepth * 0.5 + 0.25);
      bayGroup.add(lampShade);

      const lampLight = new THREE.PointLight(0xffdf99, 1.4, 9, 1.4);
      lampLight.position.set(0, eastBayHeight - 0.35, eastBayDepth * 0.5 + 0.25);
      bayGroup.add(lampLight);

      this.movieBoothGroup.add(bayGroup);
    });

    // Rolling Wooden Library Ladder on Brass Rail across East Bays
    const brassRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 11.2, 16),
      this.clayMaterial(0xd4af37, 0.3, 0.75)
    );
    brassRail.rotation.z = Math.PI / 2;
    brassRail.position.set(10.4, 7.4, -35.7);
    this.movieBoothGroup.add(brassRail);

    this.buildRollingLibraryLadder(11.8, -35.7, 7.4, oakMat);

    // --- 4. TALL GRAND BOOKSHELVES ACROSS WEST BACK WALL ---
    const westBayGroup = new THREE.Group();
    westBayGroup.position.set(-5.8, 0, -36.2);

    const wBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, eastBayHeight, 0.08), oakMat);
    wBack.position.set(0, eastBayHeight * 0.5, -0.38);
    westBayGroup.add(wBack);

    [-1.32, 1.32].forEach(ux => {
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.16, eastBayHeight, eastBayDepth), oakMat);
      upright.position.set(ux, eastBayHeight * 0.5, 0);
      upright.castShadow = true;
      westBayGroup.add(upright);
    });

    const wCornice = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.45, eastBayDepth + 0.2), oakMat);
    wCornice.position.set(0, eastBayHeight - 0.22, 0.05);
    westBayGroup.add(wCornice);

    eastShelfLevels.forEach(sy => {
      const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.09, eastBayDepth - 0.1), darkOakMat);
      shelfPlank.position.set(0, sy, 0);
      westBayGroup.add(shelfPlank);

      for (let b = 0; b < 13; b++) {
        const bCol = bookColors[(b * 3 + Math.floor(sy)) % bookColors.length];
        const bH = 0.52 + (b % 3) * 0.08;
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.11, bH, 0.50), this.clayMaterial(bCol, 0.8));
        bk.position.set(-1.0 + b * 0.17, sy + bH * 0.5 + 0.045, 0.08);
        westBayGroup.add(bk);
      }
    });
    this.movieBoothGroup.add(westBayGroup);

    // High Gallery Bookshelf spanning ABOVE the arched window and Grand Globe (x in [-7.5, -16.0], y in [6.5, 9.4])
    const highGalleryGroup = new THREE.Group();
    highGalleryGroup.position.set(-11.8, 8.0, -36.2);

    const gBack = new THREE.Mesh(new THREE.BoxGeometry(8.8, 3.2, 0.08), oakMat);
    highGalleryGroup.add(gBack);

    const gCornice = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.45, 0.8), oakMat);
    gCornice.position.set(0, 1.45, 0.35);
    highGalleryGroup.add(gCornice);

    [-1.0, 0.2, 1.4].forEach(gy => {
      const gShelf = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.09, 0.65), darkOakMat);
      gShelf.position.set(0, gy, 0.28);
      highGalleryGroup.add(gShelf);

      for (let b = 0; b < 36; b++) {
        const bCol = bookColors[(b * 5 + Math.floor(gy * 10)) % bookColors.length];
        const bH = 0.58 + (b % 4) * 0.06;
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.13, bH, 0.52), this.clayMaterial(bCol, 0.8));
        bk.position.set(-4.1 + b * 0.23, gy + bH * 0.5 + 0.045, 0.28);
        highGalleryGroup.add(bk);
      }
    });
    this.movieBoothGroup.add(highGalleryGroup);

    // --- 5. WARM HONEY-OAK WALL WAINSCOTING ACROSS ENTIRE BACK WALL ---
    const wainscotGeo = new THREE.PlaneGeometry(34, 11);
    const wainscotMat = this.clayMaterial(0x8a5229, 0.85);
    const wainscotWall = new THREE.Mesh(wainscotGeo, wainscotMat);
    wainscotWall.position.set(0, 5.5, -36.85);
    this.movieBoothGroup.add(wainscotWall);
  }

  buildRollingLibraryLadder(x, z, railHeight, woodMat) {
    const ladderGroup = new THREE.Group();
    const sideMat = this.clayMaterial(0x4a2a14, 0.8);
    const rungMat = this.clayMaterial(0xd4af37, 0.3, 0.7);

    [-0.32, 0.32].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, railHeight + 0.6, 0.1), sideMat);
      rail.position.set(rx, (railHeight + 0.6) * 0.5, 0);
      ladderGroup.add(rail);

      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI * 1.5), rungMat);
      hook.position.set(rx, railHeight + 0.15, -0.05);
      hook.rotation.y = Math.PI / 2;
      ladderGroup.add(hook);

      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), rungMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(rx, 0.06, 0);
      ladderGroup.add(wheel);
    });

    for (let r = 0.5; r <= railHeight; r += 0.45) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.64, 8), rungMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, r, 0);
      ladderGroup.add(rung);
    }

    ladderGroup.position.set(x, 0, z);
    ladderGroup.rotation.x = 0.12;
    this.movieBoothGroup.add(ladderGroup);
  }

  createLeolasLibraryTransomSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#542d14';
    ctx.beginPath();
    ctx.roundRect(16, 16, 992, 352, 32);
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(32, 32, 960, 320);
    ctx.setLineDash([]);

    ctx.fillStyle = '#f1c40f';
    ctx.font = '36px sans-serif';
    ctx.fillText('✨', 64, 180);
    ctx.fillText('✨', 930, 180);

    ctx.fillStyle = '#fff4d8';
    ctx.font = 'bold 72px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 12;
    ctx.fillText("Leola's Library", 512, 165);

    ctx.fillStyle = '#f7d070';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.shadowBlur = 4;
    ctx.fillText("✦ Stories · Knowledge · Wonder · Community ✦", 512, 245);

    return new THREE.CanvasTexture(canvas);
  }

  createStarMesh(outerRadius, innerRadius, points) {
    const shape = new THREE.Shape();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    return new THREE.Mesh(geo, this.clayMaterial(0xfffdf5, 0.95));
  }

  createPopcornTubTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Red & white vertical carnival stripes
    const numStripes = 16;
    const w = canvas.width / numStripes;
    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#cc292b' : '#fff8ed';
      ctx.fillRect(i * w, 0, w, canvas.height);
    }

    // Center cream banner
    ctx.fillStyle = '#fff4e3';
    ctx.strokeStyle = '#8a1d1e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(40, 140, 432, 230, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#221a14';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText('POPCORN', 256, 210);

    ctx.font = 'italic 34px Georgia, serif';
    ctx.fillStyle = '#8a1d1e';
    ctx.fillText('for BIG', 256, 260);

    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#221a14';
    ctx.fillText('Imaginations ♥', 256, 315);

    return new THREE.CanvasTexture(canvas);
  }

  createTartanBlanketTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Scottish tartan wool base
    ctx.fillStyle = '#8b263e'; // rich ruby red base
    ctx.fillRect(0, 0, 512, 512);

    // Deep forest green and navy crossing bands
    ctx.fillStyle = 'rgba(28, 64, 42, 0.65)';
    for (let x = 0; x < 512; x += 128) {
      ctx.fillRect(x, 0, 48, 512);
      ctx.fillRect(0, x, 512, 48);
    }

    ctx.fillStyle = 'rgba(25, 42, 77, 0.65)';
    for (let x = 64; x < 512; x += 128) {
      ctx.fillRect(x, 0, 36, 512);
      ctx.fillRect(0, x, 512, 36);
    }

    // Yellow and white fine accent stripes
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    for (let x = 32; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, 512);
      ctx.moveTo(0, x); ctx.lineTo(512, x);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  createPillowTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Cream woven cushion background
    ctx.fillStyle = '#f5efe6';
    ctx.fillRect(0, 0, 512, 512);

    // Woven cross-hatch knit texture
    ctx.strokeStyle = '#e2d7c5';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Quilted pillow border
    ctx.strokeStyle = '#d4c3ab';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 472, 472);

    // Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#263852';
    ctx.font = 'bold 54px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, 256, 230 + idx * 75);
    });

    return new THREE.CanvasTexture(canvas);
  }

  createBraidedPebbleRugTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e8decb';
    ctx.fillRect(0, 0, 512, 512);

    const ringColors = ['#2b4c7e', '#e76f51', '#2a9d8f', '#f4a261', '#5a3d7a', '#c49a6c', '#386641', '#d4a373'];
    for (let r = 240; r > 10; r -= 18) {
      const col = ringColors[Math.floor(r / 18) % ringColors.length];
      ctx.fillStyle = col;
      const count = Math.floor(r * 0.5);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const px = 256 + Math.cos(a) * r;
        const py = 256 + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  createMoviePlaqueTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Wood plaque
    ctx.fillStyle = '#e2cca9';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#a6855b';
    ctx.lineWidth = 16;
    ctx.roundRect(24, 24, 464, 464, 32);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#2f2015';
    ctx.font = 'bold 54px Georgia, serif';
    const lines = text.split('\n');
    lines.forEach((l, idx) => {
      ctx.fillText(l, 256, 180 + idx * 75);
    });

    return new THREE.CanvasTexture(canvas);
  }

  createHangingTagTexture(text, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.roundRect(10, 10, 492, 120, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.roundRect(18, 18, 476, 104, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px "Arial Black", sans-serif';
    ctx.fillText(text, 256, 88);

    return new THREE.CanvasTexture(canvas);
  }

  createKinderWorldBookTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#22518c';
    ctx.roundRect(20, 20, 472, 600, 28);
    ctx.fill();

    ctx.strokeStyle = '#f4d06f';
    ctx.lineWidth = 10;
    ctx.roundRect(36, 36, 440, 568, 20);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fffdfa';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('Books', 256, 180);
    ctx.fillText('Make a', 256, 250);
    ctx.fillText('Kinder', 256, 320);
    ctx.fillText('World', 256, 390);

    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('♥', 256, 480);

    return new THREE.CanvasTexture(canvas);
  }

  sitDownInMovieBooth(data) {
    this.phase = 'seated';
    this.isWalking = false;
    this.clearNavigationDots();

    const startPos = this.camera.position.clone();
    const endPos = data.seatPos || new THREE.Vector3(-1.05, 1.15, -35.2);
    const startLook = new THREE.Vector3(
      this.camera.position.x - Math.sin(this.yaw),
      this.camera.position.y + this.pitch,
      this.camera.position.z - Math.cos(this.yaw)
    );
    const endLook = data.seatLook || new THREE.Vector3(0, 1.45, -36.65);

    let t = 0;
    const animateSeat = () => {
      t += 0.04;
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.camera.position.lerpVectors(startPos, endPos, easeT);
      const curLook = new THREE.Vector3().lerpVectors(startLook, endLook, easeT);
      this.camera.lookAt(curLook);

      if (t < 1.0) {
        requestAnimationFrame(animateSeat);
      } else {
        this.camera.position.copy(endPos);
        this.camera.lookAt(endLook);
        this.playerPos.set(endPos.x, 0, endPos.z);
        const dx = endLook.x - endPos.x;
        const dz = endLook.z - endPos.z;
        this.yaw = Math.atan2(-dx, -dz);
        this.pitch = 0.05;
        this.dispatchEvent(new CustomEvent('interact', { detail: { type: 'movie-booth-seat', seated: true } }));
      }
    };
    animateSeat();
  }

  // ==========================================
  // TRUE SEATED LEOLA AVATAR (RECEPTION DESK)
  // ==========================================
  buildTrueSeatedLeolaAvatar() {
    const leolaGroup = new THREE.Group();
    // Reception desk center is (0, 0, -9.0), counter height 1.35.
    // Leola is seated behind the desk at (0, 0, -9.3) facing forward (+z, rotY = 0)
    leolaGroup.position.set(0, 0, -9.3);

    // Materials faithful to turnaround reference sheets
    const skinMat = this.clayMaterial(0xba7744, 0.82); // Warm bronze clay skin
    const hairMat = this.clayMaterial(0x231710, 0.92); // Dark coffee braided crown hair
    const blouseMat = this.clayMaterial(0xf6f1e5, 0.85); // Cream linen peasant blouse
    const pantsMat = this.clayMaterial(0x4a2e1b, 0.88); // High-waisted cocoa-brown trousers
    const bootMat = this.clayMaterial(0x2d180d, 0.85); // Espresso leather boots
    const goldMat = this.clayMaterial(0xd4af37, 0.35, 0.7); // Warm gold choker & crochet hook
    const turquoiseMat = this.clayMaterial(0x2cbab2, 0.45, 0.6); // Turquoise drop earrings
    const honeyOakMat = this.clayMaterial(0x8a5229, 0.78); // Honey oak chair frame
    const leatherMat = this.clayMaterial(0xb87333, 0.82); // Tufted caramel leather upholstery

    // 1. EXECUTIVE HONEY-OAK & TUFTED CARAMEL LEATHER SWIVEL ARMCHAIR
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0);

    // 5-Point star wheeled base
    const baseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 10), goldMat);
    baseHub.position.y = 0.12;
    chairGroup.add(baseHub);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const legArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.42), goldMat);
      legArm.position.set(Math.sin(angle) * 0.22, 0.1, Math.cos(angle) * 0.22);
      legArm.rotation.y = angle;
      chairGroup.add(legArm);

      const casterWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), this.clayMaterial(0x222222, 0.8));
      casterWheel.rotation.z = Math.PI / 2;
      casterWheel.position.set(Math.sin(angle) * 0.42, 0.04, Math.cos(angle) * 0.42);
      chairGroup.add(casterWheel);
    }

    // Swivel column
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 10), this.clayMaterial(0x222222, 0.6));
    column.position.y = 0.32;
    chairGroup.add(column);

    // Chair oak shell & seat
    const chairSeatShell = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.7), honeyOakMat);
    chairSeatShell.position.y = 0.54;
    chairGroup.add(chairSeatShell);

    // Tufted caramel leather cushion
    const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.14, 0.64), leatherMat);
    seatCushion.position.y = 0.63;
    seatCushion.castShadow = true;
    chairGroup.add(seatCushion);

    // Curved tufted high backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 0.12), leatherMat);
    backrest.position.set(0, 1.05, -0.29);
    backrest.rotation.x = -0.06;
    backrest.castShadow = true;
    chairGroup.add(backrest);

    // Honey-oak backrest frame
    const backFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.84, 0.06), honeyOakMat);
    backFrame.position.set(0, 1.05, -0.34);
    backFrame.rotation.x = -0.06;
    chairGroup.add(backFrame);

    // Sculpted wooden armrests
    [-0.34, 0.34].forEach(ax => {
      const armUpright = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.06), honeyOakMat);
      armUpright.position.set(ax, 0.76, 0.02);
      chairGroup.add(armUpright);

      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.48), honeyOakMat);
      armPad.position.set(ax, 0.92, 0.06);
      chairGroup.add(armPad);
    });

    leolaGroup.add(chairGroup);

    // 2. SEATED LEOLA BODY & LEGS
    const seatHeight = 0.68;

    // Pelvis & High-Waisted Cocoa Trousers
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.38), pantsMat);
    hips.position.set(0, seatHeight + 0.11, -0.04);
    hips.castShadow = true;
    leolaGroup.add(hips);

    // Seated Legs (Bent 90 degrees at knees)
    // Left Leg
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 10), pantsMat);
    thighL.rotation.x = Math.PI / 2;
    thighL.position.set(-0.14, seatHeight + 0.1, 0.18);
    thighL.castShadow = true;
    leolaGroup.add(thighL);

    const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.48, 10), pantsMat);
    shinL.position.set(-0.14, seatHeight - 0.16, 0.4);
    shinL.castShadow = true;
    leolaGroup.add(shinL);

    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.24), bootMat);
    bootL.position.set(-0.14, 0.07, 0.45);
    bootL.castShadow = true;
    leolaGroup.add(bootL);

    const buckleL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), goldMat);
    buckleL.position.set(-0.21, 0.09, 0.45);
    leolaGroup.add(buckleL);

    // Right Leg
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 10), pantsMat);
    thighR.rotation.x = Math.PI / 2;
    thighR.position.set(0.14, seatHeight + 0.1, 0.18);
    thighR.castShadow = true;
    leolaGroup.add(thighR);

    const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.48, 10), pantsMat);
    shinR.position.set(0.14, seatHeight - 0.16, 0.4);
    shinR.castShadow = true;
    leolaGroup.add(shinR);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.24), bootMat);
    bootR.position.set(0.14, 0.07, 0.45);
    bootR.castShadow = true;
    leolaGroup.add(bootR);

    const buckleR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), goldMat);
    buckleR.position.set(0.21, 0.09, 0.45);
    leolaGroup.add(buckleR);

    // 3. TORSO, BLOUSE & PATCHWORK QUILTED TAPESTRY VEST
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, seatHeight + 0.22, -0.04);

    // Cream linen blouse chest
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.48, 12), blouseMat);
    chest.position.y = 0.24;
    chest.castShadow = true;
    torsoGroup.add(chest);

    // Patchwork floral quilted tapestry vest
    const vestTex = this.createQuiltedVestTexture();
    const vestMat = new THREE.MeshStandardMaterial({ map: vestTex, roughness: 0.85 });
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.20, 0.44, 14), vestMat);
    vest.position.y = 0.22;
    vest.castShadow = true;
    torsoGroup.add(vest);

    // Front cord lacing & wooden toggle beads on vest
    const laceMat = this.clayMaterial(0x3a1e0f, 0.9);
    for (let l = 0; l < 4; l++) {
      const ly = 0.12 + l * 0.07;
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.01), laceMat);
      lace.position.set(0, ly, 0.215);
      torsoGroup.add(lace);

      const toggleL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), honeyOakMat);
      toggleL.position.set(-0.045, ly, 0.22);
      torsoGroup.add(toggleL);

      const toggleR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), honeyOakMat);
      toggleR.position.set(0.045, ly, 0.22);
      torsoGroup.add(toggleR);
    }

    leolaGroup.add(torsoGroup);

    // 4. NECK & GOLD CHOKER
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 10), skinMat);
    neck.position.set(0, seatHeight + 0.72, -0.04);
    leolaGroup.add(neck);

    const choker = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.085, 0.035, 12), goldMat);
    choker.position.set(0, seatHeight + 0.70, -0.04);
    leolaGroup.add(choker);

    // 5. SCULPTED HEAD, HALO BRAID CROWN UPDO, FACE & JEWELRY
    const headGroup = new THREE.Group();
    headGroup.position.set(0, seatHeight + 0.88, -0.02);

    // Head clay sphere
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Rosy clay cheeks
    const cheekMat = this.clayMaterial(0xc46955, 0.65);
    [-0.10, 0.10].forEach(cx => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), cheekMat);
      cheek.position.set(cx, -0.03, 0.14);
      cheek.scale.set(1.2, 0.6, 0.4);
      headGroup.add(cheek);
    });

    // Almond Hazel Eyes with twin specular shine dots
    [-0.065, 0.065].forEach(ex => {
      // Sclera (White)
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), this.clayMaterial(0xffffff, 0.2));
      eyeWhite.position.set(ex, 0.03, 0.155);
      headGroup.add(eyeWhite);

      // Hazel Iris
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), this.clayMaterial(0x5a4220, 0.2));
      iris.position.set(ex, 0.03, 0.175);
      headGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), this.clayMaterial(0x111111, 0.1));
      pupil.position.set(ex, 0.03, 0.188);
      headGroup.add(pupil);

      // Twin Specular Sparkles
      const spark1 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      spark1.position.set(ex - 0.006, 0.036, 0.196);
      headGroup.add(spark1);

      const spark2 = new THREE.Mesh(new THREE.SphereGeometry(0.003, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      spark2.position.set(ex + 0.005, 0.025, 0.196);
      headGroup.add(spark2);

      // Sculpted Eyebrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.02), hairMat);
      brow.position.set(ex, 0.075, 0.165);
      brow.rotation.z = (ex > 0 ? -0.15 : 0.15);
      headGroup.add(brow);
    });

    // Friendly Warm Smile
    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.045, -0.065, 0.165),
      new THREE.Vector3(0, -0.078, 0.178),
      new THREE.Vector3(0.045, -0.065, 0.165)
    ]);
    const smileLip = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 10, 0.012, 6, false), this.clayMaterial(0xa04332, 0.7));
    headGroup.add(smileLip);

    // Subtle White Teeth highlight inside smile
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.012, 0.012), this.clayMaterial(0xffffff, 0.3));
    teeth.position.set(0, -0.068, 0.172);
    headGroup.add(teeth);

    // Gentle Freckles
    const freckleMat = this.clayMaterial(0x754323, 0.9);
    [-0.035, -0.015, 0.015, 0.035].forEach((fx, idx) => {
      const fDot = new THREE.Mesh(new THREE.SphereGeometry(0.004, 4, 4), freckleMat);
      fDot.position.set(fx, -0.01 + (idx % 2) * 0.008, 0.174);
      headGroup.add(fDot);
    });

    // Turquoise Drop Teardrop Earrings with Gold Bead
    [-0.19, 0.19].forEach(ex => {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), goldMat);
      stud.position.set(ex, 0.0, 0.02);
      headGroup.add(stud);

      const drop = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), turquoiseMat);
      drop.rotation.x = Math.PI;
      drop.position.set(ex, -0.045, 0.02);
      headGroup.add(drop);
    });

    // Braided Crown Twist Halo Updo & Chignon Bun (Signature Hairstyling)
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.188, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
    hairBase.position.set(0, 0.02, -0.02);
    headGroup.add(hairBase);

    // Halo Braided Crown Ring encircling the head
    const haloTorus = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.048, 10, 24), hairMat);
    haloTorus.rotation.x = Math.PI * 0.45;
    haloTorus.position.set(0, 0.08, -0.01);
    headGroup.add(haloTorus);

    // Back Chignon Bun
    const chignon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), hairMat);
    chignon.scale.set(1.2, 0.9, 0.8);
    chignon.position.set(0, 0.02, -0.16);
    headGroup.add(chignon);

    leolaGroup.add(headGroup);

    // 6. ARMS & GOLDEN CROCHET HOOK (Faithful to "interact with leola.png")
    // LEFT ARM: Elbow on armrest/counter, hand supporting cheek, holding golden crochet hook
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.26, seatHeight + 0.42, 0.0);

    // Puffed 3/4 peasant sleeve
    const puffL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), blouseMat);
    puffL.scale.set(0.9, 1.2, 0.9);
    puffL.position.set(0, -0.06, 0.06);
    leftArmGroup.add(puffL);

    // Forearm angled up towards cheek
    const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.34, 8), skinMat);
    forearmL.position.set(0.06, 0.14, 0.14);
    forearmL.rotation.set(-0.85, 0.3, -0.65);
    forearmL.castShadow = true;
    leftArmGroup.add(forearmL);

    // Left hand cupping cheek
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), skinMat);
    handL.position.set(0.14, 0.32, 0.16);
    leftArmGroup.add(handL);

    // Golden Crochet Hook held between fingers
    const crochetHookGroup = new THREE.Group();
    crochetHookGroup.position.set(0.14, 0.32, 0.16);
    crochetHookGroup.rotation.set(0.3, -0.4, 0.6);

    const hookShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), goldMat);
    hookShaft.castShadow = true;
    crochetHookGroup.add(hookShaft);

    const hookTip = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.006, 6, 8, Math.PI * 0.9), goldMat);
    hookTip.position.set(0.01, 0.10, 0);
    crochetHookGroup.add(hookTip);

    leftArmGroup.add(crochetHookGroup);
    leolaGroup.add(leftArmGroup);

    // RIGHT ARM: Resting gracefully forward onto reception desk counter
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.26, seatHeight + 0.42, 0.0);

    const puffR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), blouseMat);
    puffR.scale.set(0.9, 1.2, 0.9);
    puffR.position.set(0, -0.06, 0.06);
    rightArmGroup.add(puffR);

    // Forearm extending forward onto desk surface
    const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.38, 8), skinMat);
    forearmR.position.set(-0.06, 0.02, 0.22);
    forearmR.rotation.set(1.15, -0.15, 0.25);
    forearmR.castShadow = true;
    rightArmGroup.add(forearmR);

    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), skinMat);
    handR.position.set(-0.12, 0.04, 0.42);
    rightArmGroup.add(handR);

    leolaGroup.add(rightArmGroup);

    // 7. DESK ACCESSORIES IN FRONT OF LEOLA (On curved counter top y = 1.48, z = -8.0 to -8.5)
    const deskPropsGroup = new THREE.Group();
    deskPropsGroup.position.set(0, 1.36, 0.85);

    // A. Ceramic Coffee Mug: "Good Projects Brighter People ♥"
    const mugTex = this.createMugTexture();
    const mugMat = new THREE.MeshStandardMaterial({ map: mugTex, roughness: 0.5 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.16, 16), mugMat);
    mug.position.set(0.42, 0.08, -0.05);
    mug.castShadow = true;
    deskPropsGroup.add(mug);

    const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 12, Math.PI * 1.1), mugMat);
    mugHandle.position.set(0.495, 0.08, -0.05);
    deskPropsGroup.add(mugHandle);

    // B. Stoneware Crock with Colorful Crochet Hooks
    const crockMat = this.clayMaterial(0xd7cdbe, 0.7);
    const crock = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.15, 14), crockMat);
    crock.position.set(-0.45, 0.075, 0.0);
    crock.castShadow = true;
    deskPropsGroup.add(crock);

    const hookColors = [0x2cbab2, 0xd4af37, 0xba3268, 0x8a3bd4, 0x3a78c4];
    hookColors.forEach((hc, idx) => {
      const hMat = this.clayMaterial(hc, 0.35, 0.8);
      const hCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 6), hMat);
      const hAngle = (idx / hookColors.length) * Math.PI * 2;
      hCylinder.position.set(-0.45 + Math.sin(hAngle) * 0.03, 0.16, Math.cos(hAngle) * 0.03);
      hCylinder.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
      deskPropsGroup.add(hCylinder);
    });

    // C. Apricot Yarn Ball with Golden Crochet Hook & Trailing Thread
    const yarnMat = this.clayMaterial(0xee7859, 0.95);
    const yarnBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), yarnMat);
    yarnBall.position.set(0.24, 0.09, 0.10);
    yarnBall.castShadow = true;
    deskPropsGroup.add(yarnBall);

    const yarnHook = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6), goldMat);
    yarnHook.position.set(0.24, 0.12, 0.10);
    yarnHook.rotation.set(0.4, 0.2, 0.8);
    deskPropsGroup.add(yarnHook);

    // Spiral yarn string
    const yarnString = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 6, 16, Math.PI * 1.5), yarnMat);
    yarnString.position.set(0.18, 0.005, 0.16);
    yarnString.rotation.x = Math.PI / 2;
    deskPropsGroup.add(yarnString);

    // D. Folded Granny Square Crochet Blanket Swatch
    const grannyTex = this.createGrannySquareTexture();
    const grannyMat = new THREE.MeshStandardMaterial({ map: grannyTex, roughness: 0.92 });
    const swatch = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.28), grannyMat);
    swatch.position.set(-0.22, 0.012, 0.08);
    swatch.rotation.y = 0.15;
    deskPropsGroup.add(swatch);

    // E. Carved Honey-Oak & Brass Desk Plaque: "Leola · Library Guide"
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: this.createDeskPlaqueTexture(),
      roughness: 0.65
    });
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.06), plaqueMat);
    plaque.position.set(0, 0.04, 0.22);
    plaque.rotation.x = -0.25;
    deskPropsGroup.add(plaque);

    leolaGroup.add(deskPropsGroup);

    // 8. INTERACTIVE SPEECH BILLBOARD & DIALOGUE
    const speechBillboard = this.initSeatedLeolaSpeechBillboard();
    speechBillboard.position.set(0, seatHeight + 1.45, 0);
    leolaGroup.add(speechBillboard);

    this.scene.add(leolaGroup);

    // Register interactive sensors
    headMesh.userData = {
      type: 'leola',
      name: 'Leola (Library Guide)',
      prompt: '✦ Talk to Leola (Library Guide)'
    };
    vest.userData = {
      type: 'leola',
      name: 'Leola (Library Guide)',
      prompt: '✦ Talk to Leola (Library Guide)'
    };
    plaque.userData = {
      type: 'leola',
      name: 'Leola (Library Guide)',
      prompt: '✦ Talk to Leola (Library Guide)'
    };
    this.interactiveObjects.push(headMesh);
    this.interactiveObjects.push(vest);
    this.interactiveObjects.push(plaque);

    // Set this.leola controller interface
    this.leola = {
      group: leolaGroup,
      headGroup,
      headMesh,
      torsoMesh: vest,
      crochetHookGroup,
      speechBillboard,
      baseHeadY: seatHeight + 0.88,
      baseTorsoY: seatHeight + 0.22,
      startDialogue: (text) => {
        this.updateSeatedSpeechCanvas(text);
        speechBillboard.visible = true;
        if (window.speechSynthesis) {
          try {
            const utter = new SpeechSynthesisUtterance(text);
            utter.pitch = 1.1;
            utter.rate = 1.0;
            window.speechSynthesis.speak(utter);
          } catch(e) {}
        }
      },
      hideDialogue: () => {
        speechBillboard.visible = false;
      },
      update: (dt, cameraPos) => {
        const time = performance.now() * 0.001;
        // Breathing oscillation
        const breathe = Math.sin(time * 2.2) * 0.008;
        headGroup.position.y = seatHeight + 0.88 + breathe * 1.2;
        torsoGroup.position.y = seatHeight + 0.22 + breathe;

        // Crochet hook micro-twinkle
        crochetHookGroup.rotation.z = 0.6 + Math.sin(time * 3.5) * 0.05;

        // Head tracking when player is near
        const dx = cameraPos.x - leolaGroup.position.x;
        const dz = cameraPos.z - leolaGroup.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 8.5) {
          const targetYaw = Math.atan2(dx, dz);
          headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetYaw * 0.65, dt * 4.0);
          headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, (cameraPos.y - (seatHeight + 0.88)) * 0.12, dt * 4.0);
        } else {
          headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0, dt * 2.0);
          headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0, dt * 2.0);
        }

        // Keep billboard facing camera
        if (speechBillboard.visible) {
          speechBillboard.quaternion.copy(this.camera.quaternion);
        }
      }
    };
  }

  createQuiltedVestTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const patches = [
      '#ba5d43', '#52796f', '#d4a373', '#f4ede2',
      '#264653', '#e76f51', '#e9c46a', '#84a59d',
      '#f28482', '#6b705c', '#cb997e', '#ddbea9',
      '#7f4f24', '#936639', '#a68a64', '#b6ad90'
    ];

    const size = 128;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = c * size;
        const y = r * size;
        ctx.fillStyle = patches[(r * 4 + c) % patches.length];
        ctx.fillRect(x, y, size, size);

        // Quilt diamond stitch lines
        ctx.strokeStyle = '#3a2012';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size / 2);
        ctx.lineTo(x + size / 2, y + size);
        ctx.lineTo(x, y + size / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Small floral center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  createMugTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, 512, 256);

    // Speckles
    ctx.fillStyle = '#bfa588';
    for (let i = 0; i < 60; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 3, 3);
    }

    ctx.fillStyle = '#8f3326';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Good Projects', 256, 105);
    ctx.fillText('Brighter People ♥', 256, 165);

    return new THREE.CanvasTexture(canvas);
  }

  createGrannySquareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#264653';
    ctx.fillRect(0, 0, 512, 512);

    const colors = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#fdf0d5'];
    for (let i = 0; i < colors.length; i++) {
      const inset = (i + 1) * 38;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.roundRect(inset, inset, 512 - inset * 2, 512 - inset * 2, 16);
      ctx.fill();
    }

    // Center floral star
    ctx.fillStyle = '#fdf0d5';
    ctx.beginPath();
    ctx.arc(256, 256, 28, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  createDeskPlaqueTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a2012';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 38px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('Leola · Library Guide', 256, 75);

    return new THREE.CanvasTexture(canvas);
  }

  initSeatedLeolaSpeechBillboard() {
    this.seatedSpeechCanvas = document.createElement('canvas');
    this.seatedSpeechCanvas.width = 512;
    this.seatedSpeechCanvas.height = 256;
    this.seatedSpeechCtx = this.seatedSpeechCanvas.getContext('2d');
    this.updateSeatedSpeechCanvas("Welcome to Leola's Library! ✨ Ask me anything!");

    this.seatedSpeechTexture = new THREE.CanvasTexture(this.seatedSpeechCanvas);
    const billboard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshBasicMaterial({ map: this.seatedSpeechTexture, transparent: true, side: THREE.DoubleSide })
    );
    billboard.visible = false;
    return billboard;
  }

  updateSeatedSpeechCanvas(text) {
    if (!this.seatedSpeechCtx) return;
    const ctx = this.seatedSpeechCtx;
    ctx.clearRect(0, 0, 512, 256);

    // Speech bubble background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 200, 24);
    ctx.fill();

    ctx.strokeStyle = '#e29578';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Bubble pointer tip
    ctx.beginPath();
    ctx.moveTo(236, 216);
    ctx.lineTo(256, 246);
    ctx.lineTo(276, 216);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

    // Text with word wrapping
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';

    const words = text.split(' ');
    let line = '';
    let y = 70;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 440 && n > 0) {
        ctx.fillText(line, 256, y);
        line = words[n] + ' ';
        y += 36;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 256, y);

    if (this.seatedSpeechTexture) {
      this.seatedSpeechTexture.needsUpdate = true;
    }
  }

  // ==========================================
  // SEATED PATRONS (ELENA, MARCUS, CHLOE)
  // ==========================================
  buildSeatedPatrons() {
    this.seatedPatrons = [];

    const elena = this.createArticulatedSeatedPatron({
      name: 'Elena',
      x: 6.2, y: 0, z: -12.75, rotY: 0,
      seatY: 0.70, legReach: 0.62, bookMode: 'table',
      skinColor: 0xa8714b, hairColor: 0x3e2316,
      sweaterColor: 0x782834, pantsColor: 0x243952, shoeColor: 0x4a2a16,
      hasGlasses: true, hasHairBun: true,
      bookTitle: 'Stories of Kindness', bookColor: 0x2b4c7e,
      prompt: 'âœ¦ Elena is reading with both hands on her open book.'
    });
    this.seatedPatrons.push(elena);

    const marcus = this.createArticulatedSeatedPatron({
      name: 'Marcus',
      x: -11.5, y: 0, z: -16.0, rotY: Math.PI / 2,
      seatY: 0.67, legReach: 0.86, bookMode: 'held',
      skinColor: 0x7a492c, hairColor: 0x1a120c,
      sweaterColor: 0xd49b43, pantsColor: 0x23374d, shoeColor: 0x5c381f,
      isFadeHair: true,
      bookTitle: 'Architects of Wonder', bookColor: 0x3d704d,
      prompt: 'âœ¦ Marcus is seated naturally with his book held above his lap.'
    });
    this.seatedPatrons.push(marcus);

    const chloe = this.createArticulatedSeatedPatron({
      name: 'Chloe',
      x: -11.0, y: 0, z: -34.9, rotY: Math.PI / 2,
      seatY: 0.58, legReach: 0.84, bookMode: 'held',
      skinColor: 0xb57c52, hairColor: 0x201510,
      sweaterColor: 0x9b82aa, pantsColor: 0x286367, shoeColor: 0xf0ede6,
      hasHeadband: true, headbandColor: 0xf1c40f, hasPonytail: true,
      bookTitle: 'Crochet Motifs', bookColor: 0xba3268,
      prompt: 'âœ¦ Chloe is seated by the globe with visible legs, feet, and book.'
    });
    this.seatedPatrons.push(chloe);
  }

  createArticulatedSeatedPatron(config) {
    const patronGroup = new THREE.Group();
    patronGroup.position.set(config.x, config.y, config.z);
    patronGroup.rotation.y = config.rotY;
    patronGroup.scale.setScalar(config.scale || 1.0);

    const skinMat = this.clayMaterial(config.skinColor, 0.85);
    const sweaterMat = this.clayMaterial(config.sweaterColor, 0.88);
    const pantsMat = this.clayMaterial(config.pantsColor, 0.86);
    const shoeMat = this.clayMaterial(config.shoeColor, 0.80);
    const hairMat = this.clayMaterial(config.hairColor, 0.92);
    const seatY = config.seatY || 0.65;
    const legReach = config.legReach || 0.76;

    const makeLimb = (a, b, radius, mat) => {
      const dir = new THREE.Vector3().subVectors(b, a);
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, dir.length(), 10), mat);
      limb.position.copy(a).add(b).multiplyScalar(0.5);
      limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      limb.castShadow = true;
      patronGroup.add(limb);
      return limb;
    };

    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.20, 0.34), pantsMat);
    hips.position.set(0, seatY + 0.08, -0.04);
    hips.castShadow = true;
    patronGroup.add(hips);

    // Fully visible thigh -> knee -> shin -> shoe chain.
    [-0.115, 0.115].forEach(lx => {
      const hip = new THREE.Vector3(lx, seatY + 0.08, 0.02);
      const knee = new THREE.Vector3(lx, seatY - 0.01, legReach * 0.56);
      const ankle = new THREE.Vector3(lx, 0.13, legReach);
      makeLimb(hip, knee, 0.075, pantsMat);
      makeLimb(knee, ankle, 0.067, pantsMat);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.23), shoeMat);
      shoe.position.set(lx, 0.075, legReach + 0.06);
      shoe.castShadow = true;
      patronGroup.add(shoe);
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.50, 0.28), sweaterMat);
    torso.position.set(0, seatY + 0.42, -0.015);
    torso.castShadow = true;
    patronGroup.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.10, 8), skinMat);
    neck.position.set(0, seatY + 0.70, -0.01);
    patronGroup.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, seatY + 0.84, 0.015);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    [-0.052, 0.052].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 6), this.clayMaterial(0x151515, 0.25));
      eye.position.set(ex, 0.025, 0.148);
      headGroup.add(eye);
    });

    if (config.hasHairBun) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
      cap.position.set(0, 0.02, -0.01);
      headGroup.add(cap);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), hairMat);
      bun.position.set(0, 0.03, -0.16);
      headGroup.add(bun);
    } else if (config.hasPonytail) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.168, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
      cap.position.set(0, 0.02, -0.01);
      headGroup.add(cap);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.30, 9), hairMat);
      tail.position.set(0, 0.06, -0.18);
      tail.rotation.x = -0.45;
      headGroup.add(tail);
    } else {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
      cap.position.set(0, 0.02, -0.01);
      headGroup.add(cap);
    }

    if (config.hasHeadband) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.157, 0.020, 7, 18),
        this.clayMaterial(config.headbandColor || 0xf1c40f, 0.72)
      );
      band.rotation.x = Math.PI * 0.42;
      band.position.set(0, 0.06, 0.025);
      headGroup.add(band);
    }

    if (config.hasGlasses) {
      const frameMat = this.clayMaterial(0xd4af37, 0.35, 0.7);
      [-0.052, 0.052].forEach(gx => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 6, 12), frameMat);
        rim.position.set(gx, 0.025, 0.158);
        headGroup.add(rim);
      });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.006), frameMat);
      bridge.position.set(0, 0.025, 0.162);
      headGroup.add(bridge);
    }

    headGroup.rotation.x = 0.18;
    patronGroup.add(headGroup);

    // Book is always above furniture and visibly gripped by both connected hands.
    const tableMode = config.bookMode === 'table';
    const bookY = tableMode ? 1.38 : seatY + 0.47;
    const bookZ = tableMode ? 0.53 : 0.48;
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, bookY, bookZ);
    bookGroup.rotation.x = tableMode ? -0.08 : -0.42;

    const bookMat = this.clayMaterial(config.bookColor || 0x2b4c7e, 0.85);
    const pageMat = this.clayMaterial(0xfffaec, 0.90);
    const leftCover = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.30), bookMat);
    leftCover.position.x = -0.115;
    leftCover.rotation.z = 0.10;
    bookGroup.add(leftCover);
    const rightCover = leftCover.clone();
    rightCover.position.x = 0.115;
    rightCover.rotation.z = -0.10;
    bookGroup.add(rightCover);

    const leftPages = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.018, 0.28), pageMat);
    leftPages.position.set(-0.108, 0.022, 0);
    leftPages.rotation.z = 0.09;
    bookGroup.add(leftPages);
    const rightPages = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.018, 0.28), pageMat);
    rightPages.position.set(0.108, 0.022, 0);
    rightPages.rotation.z = -0.09;
    bookGroup.add(rightPages);

    // One thin page actually turns while the reader breathes.
    const pageTurnPivot = new THREE.Group();
    pageTurnPivot.position.set(0, 0.038, 0);
    const turningPage = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.008, 0.275), pageMat);
    turningPage.position.x = 0.10;
    pageTurnPivot.add(turningPage);
    bookGroup.add(pageTurnPivot);
    patronGroup.add(bookGroup);

    [-1, 1].forEach(side => {
      const sx = side * 0.24;
      const shoulder = new THREE.Vector3(sx, seatY + 0.58, 0.015);
      const elbow = new THREE.Vector3(
        side * 0.27,
        tableMode ? 1.31 : seatY + 0.38,
        tableMode ? 0.27 : 0.25
      );
      const handPos = new THREE.Vector3(side * 0.16, bookY + 0.015, bookZ - 0.025);

      makeLimb(shoulder, elbow, 0.052, sweaterMat);
      makeLimb(elbow, handPos, 0.045, skinMat);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.047, 8, 8), skinMat);
      hand.position.copy(handPos);
      hand.castShadow = true;
      patronGroup.add(hand);
    });

    head.userData = { type: 'patron', name: config.name, prompt: config.prompt };
    torso.userData = head.userData;
    this.interactiveObjects.push(head);
    this.interactiveObjects.push(torso);
    this.scene.add(patronGroup);

    return {
      name: config.name,
      group: patronGroup,
      headGroup,
      torso,
      bookGroup,
      pageTurnPivot,
      baseTorsoY: seatY + 0.42,
      baseHeadY: seatY + 0.84,
      baseBookRotX: bookGroup.rotation.x
    };
  }

  initPathDotsSystem() {
    this.pathDotsGroup = new THREE.Group();
    this.scene.add(this.pathDotsGroup);

    this.maxDots = 30;
    this.dotPool = [];
    const dotGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.05, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xffd966,
      emissive: 0xffa500,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });

    for (let i = 0; i < this.maxDots; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat.clone());
      dot.visible = false;
      this.dotPool.push(dot);
      this.pathDotsGroup.add(dot);
    }
  }

  showNavigationDots(startPos, endPos) {
    const dist = startPos.distanceTo(endPos);
    const count = Math.min(this.maxDots, Math.max(3, Math.floor(dist / 0.8)));

    for (let i = 0; i < this.maxDots; i++) {
      const dot = this.dotPool[i];
      if (i < count) {
        const t = (i + 1) / (count + 1);
        dot.position.lerpVectors(startPos, endPos, t);
        dot.position.y = 0.08 + Math.sin(t * Math.PI) * 0.05;
        dot.visible = true;
      } else {
        dot.visible = false;
      }
    }
  }

  clearNavigationDots() {
    this.dotPool.forEach(dot => dot.visible = false);
  }

  initThirdPersonAvatar() {
    this.playerAvatar = new THREE.Group();
    this.playerAvatar.name = 'Player_Visitor_Avatar';

    // Stylized visitor with warm clay aesthetic
    const sweaterMat = this.clayMaterial(0xd49b43, 0.85); // Mustard yellow clay sweater
    const pantsMat = this.clayMaterial(0x27435f, 0.86);   // Navy clay trousers
    const skinMat = this.clayMaterial(0x8a5432, 0.82);    // Clay skin
    const beanieMat = this.clayMaterial(0x2d6a4f, 0.88);  // Forest green clay beanie
    const bootMat = this.clayMaterial(0x4a2813, 0.85);    // Brown clay boots

    // Hips & Torso
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.22, 12), pantsMat);
    hips.position.y = 0.95;
    this.playerAvatar.add(hips);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.52, 12), sweaterMat);
    torso.position.y = 1.30;
    torso.castShadow = true;
    this.playerAvatar.add(torso);

    // Head & Beanie
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head.position.y = 1.72;
    this.playerAvatar.add(head);

    const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), beanieMat);
    beanie.position.set(0, 1.76, -0.02);
    this.playerAvatar.add(beanie);

    const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), sweaterMat);
    pompom.position.set(0, 2.02, -0.02);
    this.playerAvatar.add(pompom);

    // Articulated legs for walking
    this.pLegL = new THREE.Group();
    this.pLegL.position.set(-0.13, 0.95, 0);
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 10), pantsMat);
    thighL.position.y = -0.21;
    this.pLegL.add(thighL);
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), bootMat);
    bootL.position.set(0, -0.46, 0.04);
    this.pLegL.add(bootL);
    this.playerAvatar.add(this.pLegL);

    this.pLegR = new THREE.Group();
    this.pLegR.position.set(0.13, 0.95, 0);
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 10), pantsMat);
    thighR.position.y = -0.21;
    this.pLegR.add(thighR);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), bootMat);
    bootR.position.set(0, -0.46, 0.04);
    this.pLegR.add(bootR);
    this.playerAvatar.add(this.pLegR);

    // Arms
    this.pArmL = new THREE.Group();
    this.pArmL.position.set(-0.30, 1.48, 0);
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.46, 10), sweaterMat);
    armLMesh.position.y = -0.23;
    this.pArmL.add(armLMesh);
    this.playerAvatar.add(this.pArmL);

    this.pArmR = new THREE.Group();
    this.pArmR.position.set(0.30, 1.48, 0);
    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.46, 10), sweaterMat);
    armRMesh.position.y = -0.23;
    this.pArmR.add(armRMesh);
    this.playerAvatar.add(this.pArmR);

    // Start with player at current camera location
    this.playerPos = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z);
    this.playerAvatar.position.copy(this.playerPos);

    this.playerAvatar.visible = (this.cameraMode === 'third_person');
    this.scene.add(this.playerAvatar);
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode === 'first_person') ? 'third_person' : 'first_person';
    if (this.playerAvatar) {
      this.playerAvatar.visible = (this.cameraMode === 'third_person');
    }
    this.dispatchEvent(new CustomEvent('cameramodechange', { detail: this.cameraMode }));
    return this.cameraMode;
  }

  setCameraMode(mode) {
    if (mode !== 'first_person' && mode !== 'third_person') return;
    this.cameraMode = mode;
    if (this.playerAvatar) {
      this.playerAvatar.visible = (this.cameraMode === 'third_person');
    }
    this.dispatchEvent(new CustomEvent('cameramodechange', { detail: this.cameraMode }));
    return this.cameraMode;
  }

  initAudio() {
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

  playFootstepSound() {
    this.ensureAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85 + Math.random() * 20, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.035, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.08);
  }

  playDoorSound() {
    this.ensureAudio();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.7);
    gain.gain.setValueAtTime(0.07, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.7);
  }

  initEvents() {
    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyV') {
        this.toggleCameraMode();
      }
      if (e.code === 'KeyE') {
        if (this.camera.position.distanceTo(this.leola.group.position) < 5.0) {
          this.triggerLeolaDialogue();
        }
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      // Immediately release any automated yaw tracking so user mouse-look is 100% responsive and never vibrates
      this.targetYaw = undefined;

      // Check if clicking directly on the grand globe sphere
      const raycaster = this.getRaycaster(e);
      if (this.grandGlobeSphere) {
        const hits = raycaster.intersectObject(this.grandGlobeSphere, true);
        if (hits.length > 0) {
          this.isDraggingGlobe = true;
          this.prevGlobePointerX = e.clientX;
          return;
        }
      }
      this.isDragging = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
      this.isDraggingGlobe = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDraggingGlobe && this.grandGlobeSphere) {
        const dx = e.clientX - this.prevGlobePointerX;
        this.globeSpinVelocity = dx * 0.008;
        this.grandGlobeSphere.rotation.y += dx * 0.008;
        this.prevGlobePointerX = e.clientX;
        return;
      }
      if (!this.isDragging) {
        this.checkHover(e);
        return;
      }
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      this.yaw -= dx * 0.0035;
      this.pitch -= dy * 0.0025;
      // Allow looking freely up into sky/clouds/sun (+1.22 rad / ~70 deg) and down (-0.95 rad)
      this.pitch = Math.max(-0.95, Math.min(1.22, this.pitch));
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  checkHover(e) {
    const raycaster = this.getRaycaster(e);
    const hits = raycaster.intersectObjects(this.interactiveObjects, true);

    const badge = document.getElementById('world-interaction-badge');
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData?.prompt && obj.parent) {
        obj = obj.parent;
      }
      if (obj?.userData?.prompt && badge) {
        badge.textContent = obj.userData.prompt;
        badge.style.opacity = '1';
        this.canvas.style.cursor = 'pointer';
        return;
      }
    }
    if (badge) badge.style.opacity = '0';
    this.canvas.style.cursor = 'default';
  }

  getRaycaster(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    return raycaster;
  }

  handleClick(e) {
    // If user was dragging mouse to turn/look around, do NOT trigger click navigation or interaction!
    const dragDist = Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY);
    if (dragDist > 7) {
      return;
    }

    const raycaster = this.getRaycaster(e);

    // 1. Interactive Object Clicks (doors, leola, seats, books, arcade, globe)
    const hits = raycaster.intersectObjects(this.interactiveObjects, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData?.type && obj.parent) {
        obj = obj.parent;
      }
      if (obj?.userData?.type) {
        this.handleObjectInteraction(obj.userData);
        return;
      }
    }

    // 2. Point on the floor and click to walk (100% reliable everywhere in world)
    let targetPoint = null;
    const floorHits = raycaster.intersectObjects(this.walkableSurfaces, true);
    if (floorHits.length > 0) {
      targetPoint = floorHits[0].point.clone();
    } else {
      // Infallible fallback: intersect with ground plane y = 0
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, pt)) {
        targetPoint = pt;
      }
    }

    if (targetPoint) {
      // Resolve against solid obstacles so destination is outside furniture
      const candidate = new THREE.Vector3(targetPoint.x, 1.8, targetPoint.z);
      const safeDest = this.resolveCollisions(candidate);
      this.startWalkingTo(safeDest);
    }
  }

  handleObjectInteraction(data) {
    if (data.type === 'doors') {
      this.openDoorsAndEnter();
      return;
    }

    if (data.type === 'leola') {
      this.triggerLeolaDialogue();
      return;
    }
    if (data.type === 'grand_globe') {
      this.dispatchEvent(new CustomEvent('inspect_globe'));
      return;
    }
    if (data.type === 'globe_bench') {
      this.sitDownAtReadingTable(data);
      return;
    }

    if (data.type === 'movie-booth-seat' || data.type === 'movie-booth-screen') {
      if (data.walkTo && this.camera.position.distanceTo(data.walkTo) > 3.0) {
        this.startWalkingTo(data.walkTo, () => {
          this.sitDownInMovieBooth(data);
        });
      } else {
        this.sitDownInMovieBooth(data);
      }
      return;
    }

    if (data.type === 'book-needle' || data.type === 'book-crochet' || data.type === 'donation' || data.type === 'video' || data.type === 'arcade') {
      this.dispatchEvent(new CustomEvent('interact', { detail: data }));
      return;
    }

    if (data.walkTo) {
      this.startWalkingTo(data.walkTo, () => {
        if (data.type === 'reading-table') {
          this.sitDownAtReadingTable(data);
        } else if (data.type === 'desk') {
          this.triggerLeolaOnboarding();
        } else {
          this.dispatchEvent(new CustomEvent('interact', { detail: data }));
        }
      });
    } else {
      this.dispatchEvent(new CustomEvent('interact', { detail: data }));
    }
  }

  triggerLeolaOnboarding() {
    this.phase = 'talking_leola';
    this.leola.startDialogue("Welcome to my desk! Let's get you set up with your library card ✦");
    this.dispatchEvent(new CustomEvent('onboarding_request'));
  }

  triggerLeolaDialogue() {
    this.phase = 'talking_leola';
    this.leola.startDialogue("Welcome to Leola's Library! Ask me anything!");

    const targetPos = new THREE.Vector3(
      this.leola.group.position.x + 0.3,
      1.8,
      this.leola.group.position.z + 2.6
    );
    this.startWalkingTo(targetPos, () => {
      this.yaw = 0;
      this.pitch = -0.05;
      this.dispatchEvent(new CustomEvent('talk_leola'));
    });
  }

  startWalkingTo(destPos, onArrive = null) {
    if (this.phase === 'seated') {
      this.standUp();
    }

    const safeTarget = this.resolveCollisions(destPos.clone());
    this.walkTarget = safeTarget;
    this.onArriveCallback = onArrive;
    this.isWalking = true;
    this.showNavigationDots(this.camera.position.clone(), safeTarget);

    const dx = safeTarget.x - this.camera.position.x;
    const dz = safeTarget.z - this.camera.position.z;
    if (Math.hypot(dx, dz) > 0.5) {
      this.targetYaw = Math.atan2(-dx, -dz);
    }
  }

  openDoorsAndEnter() {
    if (this.phase === 'doors-opening' || this.phase === 'inside') return;
    this.phase = 'doors-opening';
    this.playDoorSound();
    this.dispatchEvent(new CustomEvent('phasechange', { detail: 'doors-opening' }));

    this.startWalkingTo(new THREE.Vector3(0, 1.8, -2.8), () => {
      this.phase = 'inside';
      this.dispatchEvent(new CustomEvent('phasechange', { detail: 'inside' }));
    });
  }

  sitDownAtReadingTable(data) {
    this.phase = 'seated';
    this.isWalking = false;
    this.clearNavigationDots();

    const startPos = this.camera.position.clone();
    const endPos = data.seatPos || new THREE.Vector3(-8.5, 1.15, -14.8);
    const startLook = new THREE.Vector3(
      this.camera.position.x - Math.sin(this.yaw),
      this.camera.position.y + this.pitch,
      this.camera.position.z - Math.cos(this.yaw)
    );
    const endLook = data.seatLook || new THREE.Vector3(-8.5, 0.95, -16.2);

    let t = 0;
    const animateSeat = () => {
      t += 0.05;
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.camera.position.lerpVectors(startPos, endPos, easeT);
      const curLook = new THREE.Vector3().lerpVectors(startLook, endLook, easeT);
      this.camera.lookAt(curLook);

      if (t < 1.0) {
        requestAnimationFrame(animateSeat);
      } else {
        this.camera.position.copy(endPos);
        this.camera.lookAt(endLook);
        this.yaw = 0;
        this.pitch = -0.15;
        this.dispatchEvent(new CustomEvent('interact', { detail: { type: 'reading-table', seated: true } }));
      }
    };
    animateSeat();
  }

  sitDownInMovieBooth(data) {
    this.phase = 'seated';
    this.isWalking = false;
    this.clearNavigationDots();

    const startPos = this.camera.position.clone();
    // Sit comfortably on the navy blue bench on the left looking at the cinema TV screen
    const endPos = data.seatPos || new THREE.Vector3(-0.95, 1.25, -34.7);
    const startLook = new THREE.Vector3(
      this.camera.position.x - Math.sin(this.yaw),
      this.camera.position.y + this.pitch,
      this.camera.position.z - Math.cos(this.yaw)
    );
    // Look at the center of the Owl Cinema TV screen & counter props
    const endLook = data.seatLook || new THREE.Vector3(0.1, 2.5, -36.5);

    let t = 0;
    const animateSeat = () => {
      t += 0.05;
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.camera.position.lerpVectors(startPos, endPos, easeT);
      const curLook = new THREE.Vector3().lerpVectors(startLook, endLook, easeT);
      this.camera.lookAt(curLook);

      if (t < 1.0) {
        requestAnimationFrame(animateSeat);
      } else {
        this.camera.position.copy(endPos);
        this.camera.lookAt(endLook);
        const dx = endLook.x - endPos.x;
        const dy = endLook.y - endPos.y;
        const dz = endLook.z - endPos.z;
        this.yaw = Math.atan2(-dx, -dz);
        this.pitch = Math.atan2(dy, Math.hypot(dx, dz));
        if (this.playerPos) this.playerPos.set(endPos.x, 0, endPos.z);
        this.dispatchEvent(new CustomEvent('interact', { detail: { type: 'movie-booth', seated: true } }));
      }
    };
    animateSeat();
  }

  standUp() {
    if (this.phase !== 'seated') return;
    this.phase = 'inside';
    if (this.camera.position.z < -30.0 || (this.playerPos && this.playerPos.z < -30.0)) {
      this.camera.position.set(0, 1.8, -33.4);
      if (this.playerPos) this.playerPos.set(0, 0, -33.4);
      this.yaw = 0;
      this.pitch = 0;
    } else {
      this.camera.position.set(-8.5, 1.8, -13.8);
      if (this.playerPos) this.playerPos.set(-8.5, 0, -13.8);
      this.yaw = 0;
      this.pitch = 0;
    }
    this.dispatchEvent(new CustomEvent('standup'));
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
    const maxPR = isMobile ? 1.25 : 1.75;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPR));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateDoors(dt) {
    const playerZ = this.playerPos ? this.playerPos.z : this.camera.position.z;
    const playerX = this.playerPos ? this.playerPos.x : this.camera.position.x;

    // Automatic Proximity Trigger: player approaching doorway within 4.2m of center X and z in [1.8, 8.2]
    const inDoorProximity = (Math.abs(playerX) < 4.2 && playerZ >= 1.8 && playerZ <= 8.2);
    const shouldOpen = inDoorProximity || (this.phase === 'doors-opening');

    if (shouldOpen) {
      this.doorGroupL.position.x = THREE.MathUtils.lerp(this.doorGroupL.position.x, -3.8, dt * 3.5);
      this.doorGroupR.position.x = THREE.MathUtils.lerp(this.doorGroupR.position.x, 3.8, dt * 3.5);
    } else {
      // Smoothly slide shut behind player once they enter inside (z < 1.8) or step away outside (z > 8.2)
      this.doorGroupL.position.x = THREE.MathUtils.lerp(this.doorGroupL.position.x, 0, dt * 2.8);
      this.doorGroupR.position.x = THREE.MathUtils.lerp(this.doorGroupR.position.x, 0, dt * 2.8);
    }

    // Dynamic phase transitions
    if (playerZ < 4.6 && this.phase === 'outside') {
      this.phase = 'inside';
      this.dispatchEvent(new CustomEvent('phasechange', { detail: 'inside' }));
    } else if (playerZ > 5.4 && (this.phase === 'inside' || this.phase === 'doors-opening')) {
      this.phase = 'outside';
      this.dispatchEvent(new CustomEvent('phasechange', { detail: 'outside' }));
    }
  }

  updateMovement(dt) {
    if (this.phase === 'seated') return;

    if (!this.playerPos) {
      this.playerPos = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z);
    }

    const move = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) move.add(forward);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) move.sub(forward);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) move.add(right);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) move.sub(right);

    if (move.lengthSq() > 0.001) {
      this.isWalking = true;
      this.walkTarget = null;
      this.targetYaw = undefined;
      this.clearNavigationDots();
      move.normalize().multiplyScalar(this.walkSpeed * dt);
      const candidate = this.playerPos.clone().add(move);
      this.playerPos.copy(this.resolveCollisions(candidate));
    }

    if (this.walkTarget) {
      const cur = this.playerPos;
      const target = this.walkTarget;
      const dist = Math.hypot(target.x - cur.x, target.z - cur.z);

      if (dist > 0.35) {
        const step = Math.min(dist, this.walkSpeed * dt);
        const dirX = (target.x - cur.x) / dist;
        const dirZ = (target.z - cur.z) / dist;
        const candidate = new THREE.Vector3(cur.x + dirX * step, 0, cur.z + dirZ * step);
        const resolved = this.resolveCollisions(candidate);

        // Check if movement was completely blocked by a solid obstacle or boundary
        const progress = Math.hypot(resolved.x - cur.x, resolved.z - cur.z);
        if (progress < 0.001 && step > 0.01) {
          // Blocked by solid obstacle or standoff buffer: stop cleanly
          this.isWalking = false;
          this.walkTarget = null;
          this.targetYaw = undefined;
          this.clearNavigationDots();
          if (this.onArriveCallback) {
            this.onArriveCallback();
            this.onArriveCallback = null;
          }
        } else {
          cur.x = resolved.x;
          cur.z = resolved.z;

          if (this.targetYaw !== undefined) {
            let diff = this.targetYaw - this.yaw;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.yaw += diff * dt * 4.0;
            if (Math.abs(diff) < 0.04) {
              this.targetYaw = undefined;
            }
          }
        }
      } else {
        cur.x = target.x;
        cur.z = target.z;
        this.isWalking = false;
        this.walkTarget = null;
        this.targetYaw = undefined;
        this.clearNavigationDots();
        if (this.onArriveCallback) {
          this.onArriveCallback();
          this.onArriveCallback = null;
        }
      }
    }

    // Safety pass through solid collision resolver
    this.playerPos.copy(this.resolveCollisions(this.playerPos));

    // UPDATE CAMERA & AVATAR
    if (this.cameraMode === 'third_person') {
      if (this.playerAvatar) {
        this.playerAvatar.visible = true;
        this.playerAvatar.position.set(this.playerPos.x, 0, this.playerPos.z);
        this.playerAvatar.rotation.y = this.yaw + Math.PI;

        // Animate limbs while walking
        if (this.isWalking) {
          const stride = Math.sin(performance.now() * 0.01);
          if (this.pLegL) this.pLegL.rotation.x = stride * 0.55;
          if (this.pLegR) this.pLegR.rotation.x = -stride * 0.55;
          if (this.pArmL) this.pArmL.rotation.x = -stride * 0.45;
          if (this.pArmR) this.pArmR.rotation.x = stride * 0.45;
        } else {
          if (this.pLegL) this.pLegL.rotation.x = 0;
          if (this.pLegR) this.pLegR.rotation.x = 0;
          if (this.pArmL) this.pArmL.rotation.x = 0;
          if (this.pArmR) this.pArmR.rotation.x = 0;
        }
      }
      const camDist = 3.6;
      // Position camera behind the player and adjust height with pitch
      const camHeight = 2.2 - Math.sin(this.pitch) * 1.8;
      this.camera.position.set(
        this.playerPos.x + Math.sin(this.yaw) * camDist * Math.cos(this.pitch * 0.5),
        camHeight,
        this.playerPos.z + Math.cos(this.yaw) * camDist * Math.cos(this.pitch * 0.5)
      );
      this.playerAvatar.rotation.y = this.yaw;
      // Look at player chest and up/down into sky or ground with pitch
      const targetY = 1.45 + Math.sin(this.pitch) * 4.5;
      this.camera.lookAt(
        this.playerPos.x - Math.sin(this.yaw) * 4.0,
        targetY,
        this.playerPos.z - Math.cos(this.yaw) * 4.0
      );
    } else {
      // First Person: Camera at player's eye level (steady y = 1.8, zero shaking)
      if (this.playerAvatar) {
        this.playerAvatar.visible = false;
      }
      this.camera.position.set(this.playerPos.x, 1.8, this.playerPos.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }
  }

  teleportTo(loc) {
    this.isWalking = false;
    this.walkTarget = null;
    this.clearNavigationDots();

    if (loc === 'exterior') {
      this.phase = 'outside';
      this.camera.position.set(0, 1.8, 22); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(0, 0, 22);
      this.yaw = 0;
      this.pitch = -0.05;
    } else if (loc === 'desk') {
      this.phase = 'inside';
      this.doorGroupL.position.x = -3.8;
      this.doorGroupR.position.x = 3.8;
      this.camera.position.set(0, 1.8, -5.5); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(0, 0, -5.5);
      this.yaw = 0;
      this.pitch = -0.06;
    } else if (loc === 'bookshelves') {
      this.phase = 'inside';
      this.doorGroupL.position.x = -3.8;
      this.doorGroupR.position.x = 3.8;
      this.camera.position.set(-10.5, 1.8, -10.0); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(-10.5, 0, -10.0);
      this.yaw = -1.4;
      this.pitch = 0.05;
    } else if (loc === 'reading') {
      this.phase = 'inside';
      this.doorGroupL.position.x = -3.8;
      this.doorGroupR.position.x = 3.8;
      this.camera.position.set(-5.8, 1.8, -14.2); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(-5.8, 0, -14.2);
      this.yaw = 1.05;
      this.pitch = -0.15;
    } else if (loc === 'arcade') {
      this.phase = 'inside';
      this.doorGroupL.position.x = -3.8;
      this.doorGroupR.position.x = 3.8;
      this.camera.position.set(12.8, 1.8, -20.0); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(12.8, 0, -20.0);
      this.yaw = -Math.PI / 2;
      this.pitch = 0.05;
    } else if (loc === 'video') {
      this.phase = 'inside';
      this.doorGroupL.position.x = -3.8;
      this.doorGroupR.position.x = 3.8;
      this.camera.position.set(0, 1.8, -32.5); if (!this.playerPos) this.playerPos = new THREE.Vector3(); this.playerPos.set(0, 0, -32.5);
      this.yaw = 0;
      this.pitch = 0.05;
    } else if (loc === 'globe') {
      this.phase = 'inside';
      this.doorGroupL.position.x = -3.8;
      this.doorGroupR.position.x = 3.8;
      // Grand Globe Station on left-hand side back wall at (-9.2, 0, -33.6)
      this.camera.position.set(-9.2, 1.85, -29.4);
      if (!this.playerPos) this.playerPos = new THREE.Vector3();
      this.playerPos.set(-9.2, 0, -29.4);
      this.yaw = 0;
      this.pitch = -0.04;
    }
    this.dispatchEvent(new CustomEvent('phasechange', { detail: this.phase }));
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = performance.now() * 0.001;

    this.updateDoors(dt);
    this.updateMovement(dt);
    this.updatePromenadeNPCs(dt);
    this.updateSkyElements(dt, time);

    // Smoothly spin the Grand Earth Globe
    if (this.grandGlobeSphere && !this.isDraggingGlobe) {
      this.grandGlobeSphere.rotation.y += this.globeSpinVelocity;
      this.globeSpinVelocity *= 0.96;
      if (Math.abs(this.globeSpinVelocity) < 0.0005) {
        this.grandGlobeSphere.rotation.y += 0.0025; // Gentle continuous rotation
      }
    }

    // Animate Birds in the sky
    this.flyingBirds.forEach(bird => {
      const data = bird.userData;
      bird.position.x = data.baseX + Math.sin(time * data.speed + data.offset) * 12.0;
      bird.position.z = data.baseZ + Math.cos(time * data.speed + data.offset) * 8.0;
      const wingAngle = Math.sin(time * 12.0 + data.offset) * 0.5;
      data.wingL.rotation.z = wingAngle;
      data.wingR.rotation.z = -wingAngle;
    });

    if (this.librarianHelper) {
      this.librarianHelper.update(dt, this.camera.position);
    }

    if (this.leola) {
      this.leola.update(dt, this.camera.position);
    }

    if (this.seatedPatrons) {
      this.seatedPatrons.forEach((patron, idx) => {
        const breathe = Math.sin(time * 2.2 + idx * 1.5) * 0.008;
        if (patron.torso) patron.torso.position.y = patron.baseTorsoY + breathe;
        if (patron.headGroup) patron.headGroup.position.y = patron.baseHeadY + breathe * 1.2;
        if (patron.bookGroup) patron.bookGroup.rotation.x = patron.baseBookRotX + Math.sin(time * 0.8 + idx) * 0.02;
        if (patron.pageTurnPivot) patron.pageTurnPivot.rotation.y = -Math.max(0, Math.sin(time * 0.55 + idx * 2.1)) * Math.PI * 0.92;
      });
    }

    if (this.barnabySquirrel) {
      this.updateBarnabySquirrel(time);
    }

    if (this.pathDotsGroup) {
      this.dotPool.forEach((dot, idx) => {
        if (dot.visible) {
          dot.position.y = 0.08 + Math.sin(time * 5 + idx * 0.4) * 0.04;
          dot.rotation.y = time * 2;
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}
