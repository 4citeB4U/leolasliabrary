import * as THREE from 'three';

/**
 * ClayCharacter: Rigged 3D Disney/Pixar-style Claymation NPC for Leola.
 * Faithfully matches character turnaround sheets in leola avatar/face front.png:
 * - Crown braid hairstyle encircling head with dark clay twists and back bun
 * - Warm bronze clay complexion, smiling eyes, sculpted brows, button nose, wide warm smile with white teeth
 * - Turquoise dangle drop earrings with bottom wooden/gold cube beads
 * - Delicate gold collar necklace
 * - Cream peasant blouse with ruffled puffed 3/4 sleeves
 * - Patchwork floral quilted corset vest with front leather lace ties and wooden toggle beads
 * - Loose terracotta clay trousers gathered into cuffs
 * - Chunky brown clay boots with round brass buttons
 * - Articulated 5-digit sculpted hands with distinct fingers and thumbs
 * - STRICT bookshelf-only shelving pathing along West and East grand bookshelves (no random table placement)
 */
export class ClayCharacter {
  constructor(scene) {
    this.scene = scene;
    this.state = 'walk'; // 'walk' | 'pick_book' | 'shelve_book' | 'walk_to_desk' | 'stand_at_desk' | 'talking'
    this.animTime = 0;
    this.stateTime = 0;
    this.walkSpeed = 1.6;
    this.currentWaypointIndex = 0;
    this.isPausedForPlayer = false;
    this.isAtDesk = false;

    // STRICT BOOKSHELF-ONLY PERIMETER TRAIL & 40-SECOND SHELVING CADENCE
    // Leola trails strictly along the West (x = -13.2) and East (x = 13.2) bookshelves only.
    // Shelving drop-offs occur strictly at bookshelf bays, spaced at 40-second intervals.
    this.shelvingTimer = 35.0; // Start near 40s so the first bookshelf encounter showcases a drop-off
    this.shelvingInterval = 40.0; // Strictly once every 40 seconds
    this.waypoints = [
      // --- WEST GRAND BOOKSHELF TRAIL (x = -13.2) ---
      { x: -13.2, z: -4.0, isBookshelf: true, targetYaw: -Math.PI / 2, shelfBay: 'West Bay 1 (Tier 3)', bookTitle: 'Crochet Masterclass' },
      { x: -13.2, z: -11.0, isBookshelf: true, targetYaw: -Math.PI / 2, shelfBay: 'West Bay 2 (Tier 2)', bookTitle: 'Color & Texture in Yarn' },
      { x: -13.2, z: -18.0, isBookshelf: true, targetYaw: -Math.PI / 2, shelfBay: 'West Bay 3 (Tier 4)', bookTitle: 'The Story of Needle & Yarn' },
      { x: -13.2, z: -25.0, isBookshelf: true, targetYaw: -Math.PI / 2, shelfBay: 'West Bay 4 (Tier 3)', bookTitle: 'Heirloom Stitches & Quilts' },

      // --- SOUTH REAR PERIMETER CONNECTOR (Behind study tables along south wall) ---
      { x: -13.2, z: -30.5, isBookshelf: false, targetYaw: -Math.PI },
      { x: 0.0, z: -30.5, isBookshelf: false, targetYaw: -Math.PI / 2 },
      { x: 13.2, z: -30.5, isBookshelf: false, targetYaw: 0 },

      // --- EAST GRAND BOOKSHELF TRAIL (x = 13.2) ---
      { x: 13.2, z: -26.0, isBookshelf: true, targetYaw: Math.PI / 2, shelfBay: 'East Bay 4 (Tier 3)', bookTitle: 'Disney Clay Art' },
      { x: 13.2, z: -14.0, isBookshelf: true, targetYaw: Math.PI / 2, shelfBay: 'East Bay 3 (Tier 2)', bookTitle: 'Crochet Masterclass' },
      { x: 13.2, z: -7.0, isBookshelf: true, targetYaw: Math.PI / 2, shelfBay: 'East Bay 2 (Tier 4)', bookTitle: 'Color & Texture in Yarn' },
      { x: 13.2, z: -1.0, isBookshelf: true, targetYaw: Math.PI / 2, shelfBay: 'East Bay 1 (Tier 3)', bookTitle: 'The Story of Needle & Yarn' },

      // --- NORTH FRONT PERIMETER CONNECTOR (Front aisle near entrance & Desk visit) ---
      { x: 13.2, z: -2.5, isBookshelf: false, targetYaw: 0 },
      { x: 2.4, z: -2.5, isBookshelf: false, targetYaw: -Math.PI / 2 },
      // Check in with Leola at the reception desk:
      { x: 2.4, z: -6.2, isBookshelf: false, isDeskVisit: true, targetYaw: -Math.PI, shelfBay: "Leola's Desk", bookTitle: "Shelving Report" },
      { x: 2.4, z: -2.5, isBookshelf: false, targetYaw: 0 },
      { x: -13.2, z: -2.5, isBookshelf: false, targetYaw: -Math.PI }
    ];

    // Waypoints for navigating around the 3/4 circle desk into receptionist space
    this.deskPathWaypoints = [];
    this.deskPathIndex = 0;

    this.clayBumpTexture = this.createClayBumpTexture();
    this.vestTexture = this.createQuiltedVestTexture();
    this.initMeshHierarchy();
    this.initBookCart();
    this.applyPushingPose();
  }

  // --- PROCEDURAL REFINED MATTE CLAY TEXTURE ---
  createClayBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 12 + Math.random() * 24;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const val = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      grad.addColorStop(0, val);
      grad.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const cx = 32 + (i % 3) * 80;
      const cy = 32 + Math.floor(i / 3) * 80;
      for (let r = 4; r < 36; r += 5) {
        ctx.arc(cx, cy, r, 0, Math.PI * 1.5);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  // --- PROCEDURAL QUILTED FLORAL CORSET VEST TEXTURE (IMAGE REFERENCE) ---
  createQuiltedVestTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Quilted diamond patchwork in navy, burgundy, and dusty blue
    const colors = ['#1e334a', '#6a2b37', '#25435e', '#7b3240'];
    const size = 64;

    for (let y = 0; y < 512; y += size) {
      for (let x = 0; x < 512; x += size) {
        const colIdx = ((x / size) + (y / size)) % colors.length;
        ctx.fillStyle = colors[colIdx];
        ctx.fillRect(x, y, size, size);

        // Quilted border stitching
        ctx.strokeStyle = 'rgba(220, 190, 130, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

        // Floral blossom motif in center of patch
        ctx.fillStyle = 'rgba(235, 185, 175, 0.7)';
        const cx = x + size / 2;
        const cy = y + size / 2;
        for (let a = 0; a < 5; a++) {
          const ang = (a * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * 9, cy + Math.sin(ang) * 9, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Flower center
        ctx.fillStyle = '#f0c05a';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Front center lacing line (down middle)
    ctx.strokeStyle = '#3e2312';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    // Criss-cross leather laces and wooden toggle beads
    ctx.strokeStyle = '#5a351a';
    ctx.lineWidth = 4;
    for (let ly = 40; ly < 480; ly += 60) {
      ctx.beginPath();
      ctx.moveTo(230, ly);
      ctx.lineTo(282, ly + 30);
      ctx.moveTo(282, ly);
      ctx.lineTo(230, ly + 30);
      ctx.stroke();

      // Wooden toggle bead
      ctx.fillStyle = '#8a5229';
      ctx.beginPath();
      ctx.arc(256, ly + 15, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1.5, 1.0);
    return tex;
  }

  clayMat(color, roughness = 0.88, metalness = 0.02) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: roughness,
      metalness: metalness,
      bumpMap: this.clayBumpTexture,
      bumpScale: 0.008
    });
  }

  // --- FULL TRUE AVATAR MESH HIERARCHY ---
  initMeshHierarchy() {
    this.group = new THREE.Group();
    this.group.name = 'Leola_NPC';
    this.group.position.set(-7.5, 0, -8.0);

    // Warm, beautiful claymation palette matching face front.png:
    const skinMat = this.clayMat(0x8d5524, 0.85); // Warm bronze/tan modeling clay skin
    const hairMat = this.clayMat(0x1a120e, 0.95); // Rich dark sculpted clay hair
    const blouseMat = this.clayMat(0xf5ede2, 0.88); // Soft cream peasant blouse
    const pantsMat = this.clayMat(0x6e4332, 0.88); // Loose terracotta clay trousers
    const bootMat = this.clayMat(0x4a2916, 0.85); // Warm brown leather clay boots
    const goldMat = this.clayMat(0xebb854, 0.35, 0.6); // Gold necklace & buttons
    const turquoiseMat = this.clayMat(0x2bb6a4, 0.45, 0.1); // Turquoise drop earrings
    const lipMat = this.clayMat(0xb2493b, 0.7); // Warm terracotta-rose lips

    // Vest material with authentic quilted patchwork & front laces
    const vestMat = new THREE.MeshStandardMaterial({
      map: this.vestTexture,
      roughness: 0.82,
      metalness: 0.04,
      bumpMap: this.clayBumpTexture,
      bumpScale: 0.008
    });

    // ROOT HIPS
    this.hips = new THREE.Group();
    this.hips.position.y = 1.15;
    this.group.add(this.hips);

    // Pelvis & Lower Vest Peplum (feminine hourglass silhouette)
    const pelvisGeo = new THREE.CylinderGeometry(0.20, 0.24, 0.20, 18);
    this.pelvisMesh = new THREE.Mesh(pelvisGeo, vestMat);
    this.pelvisMesh.castShadow = true;
    this.hips.add(this.pelvisMesh);

    // Flared peplum trim over hips
    const peplum = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.18, 20, 1, true), vestMat);
    peplum.position.y = -0.08;
    peplum.rotation.x = Math.PI;
    this.hips.add(peplum);

    // TORSO
    this.torso = new THREE.Group();
    this.torso.position.y = 0.16;
    this.hips.add(this.torso);

    // Corset Vest over Peasant Blouse (natural feminine taper)
    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.185, 0.44, 18);
    this.torsoMesh = new THREE.Mesh(torsoGeo, vestMat);
    this.torsoMesh.position.y = 0.22;
    this.torsoMesh.castShadow = true;
    this.torso.add(this.torsoMesh);

    // Blouse scooped neckline insert
    const scoopGeo = new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI);
    const scoop = new THREE.Mesh(scoopGeo, blouseMat);
    scoop.position.set(0, 0.38, 0.12);
    scoop.rotation.x = Math.PI * 0.4;
    this.torso.add(scoop);

    // Delicate Gold Collar Necklace
    const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.016, 8, 20), goldMat);
    necklace.rotation.x = Math.PI / 2;
    necklace.position.set(0, 0.48, 0.02);
    this.torso.add(necklace);

    // NECK & HEAD
    this.neck = new THREE.Group();
    this.neck.position.y = 0.50;
    this.torso.add(this.neck);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.14, 14), skinMat);
    neckMesh.position.y = 0.06;
    this.neck.add(neckMesh);

    this.head = new THREE.Group();
    this.head.position.y = 0.14;
    this.neck.add(this.head);

    // Sculpted Head Sphere (beautiful facial proportions)
    const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
    headGeo.scale(0.92, 1.05, 0.96);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.castShadow = true;
    this.head.add(this.headMesh);

    // Sculpted button nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), skinMat);
    nose.scale.set(0.85, 0.75, 1.15);
    nose.position.set(0, -0.01, 0.235);
    this.head.add(nose);

    // Warm sculpted Disney/Pixar smile matching face front.png
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.08, 0.225);

    // Graceful upper lip curve
    const upperLip = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.012, 8, 16, Math.PI * 0.70), lipMat);
    upperLip.rotation.z = Math.PI * 0.15;
    upperLip.position.y = 0.012;
    mouthGroup.add(upperLip);

    // Warm white curved smile teeth row
    const teethRow = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.010, 6, 16, Math.PI * 0.65), this.clayMat(0xffffff, 0.4));
    teethRow.rotation.z = Math.PI * 0.175;
    teethRow.position.set(0, 0.004, -0.005);
    mouthGroup.add(teethRow);

    // Graceful lower lip contour
    const lowerLip = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.013, 8, 16, Math.PI * 0.60), lipMat);
    lowerLip.rotation.z = Math.PI * 0.20;
    lowerLip.position.y = -0.012;
    mouthGroup.add(lowerLip);

    this.head.add(mouthGroup);

    // Rosy cheeks
    [-0.12, 0.12].forEach(xOff => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), this.clayMat(0xa84e40, 0.9));
      cheek.scale.set(1.0, 0.6, 0.2);
      cheek.position.set(xOff, -0.03, 0.20);
      this.head.add(cheek);
    });

    // Expressive clay eyes with warm brown irises and pupils
    const eyeWhiteMat = this.clayMat(0xffffff, 0.4);
    const irisMat = this.clayMat(0x3a2012, 0.3);
    const pupilMat = this.clayMat(0x0e0805, 0.2);

    [-0.075, 0.075].forEach(xOff => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 12), eyeWhiteMat);
      eye.position.set(xOff, 0.04, 0.21);
      eye.scale.set(1, 0.85, 0.45);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), irisMat);
      iris.position.set(xOff, 0.04, 0.225);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 10), pupilMat);
      pupil.position.set(xOff, 0.04, 0.233);

      // Sculpted eyebrow
      const brow = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI * 0.6), hairMat);
      brow.position.set(xOff, 0.09, 0.20);
      brow.rotation.z = xOff > 0 ? -0.2 : 0.2;

      this.head.add(eye);
      this.head.add(iris);
      this.head.add(pupil);
      this.head.add(brow);
    });

    // --- CROWN BRAID HAIRSTYLE (IMAGE REFERENCE) ---
    // Hair base dome
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), hairMat);
    hairBase.position.set(0, 0.05, -0.04);
    this.head.add(hairBase);

    // Crown Braid encircling head like a tiara of clay twists (Image Reference)
    const crownBraid = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.058, 14, 28), hairMat);
    crownBraid.position.set(0, 0.14, 0.01);
    crownBraid.rotation.x = Math.PI * 0.30;
    this.head.add(crownBraid);

    // Twisted coil segments along the braid
    for (let a = 0; a < 18; a++) {
      const ang = (a / 18) * Math.PI * 2;
      const twist = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), hairMat);
      twist.scale.set(0.8, 1.15, 0.8);
      twist.position.set(
        Math.cos(ang) * 0.25,
        0.14 + Math.sin(ang) * 0.06,
        Math.sin(ang) * 0.22
      );
      this.head.add(twist);
    }

    // Low Braided Back Bun
    const backBun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), hairMat);
    backBun.scale.set(1.15, 0.85, 0.85);
    backBun.position.set(0, 0.04, -0.25);
    this.head.add(backBun);

    // --- TURQUOISE DANGLE DROP EARRINGS (IMAGE REFERENCE) ---
    [-0.23, 0.23].forEach(x => {
      const earringGroup = new THREE.Group();
      earringGroup.position.set(x, -0.02, 0.02);

      // Gold stud
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), goldMat);
      earringGroup.add(stud);

      // Turquoise round bead
      const dropBead = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), turquoiseMat);
      dropBead.position.y = -0.05;
      earringGroup.add(dropBead);

      // Gold spacer
      const spacer = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.015, 8), goldMat);
      spacer.position.y = -0.09;
      earringGroup.add(spacer);

      // Wooden / Gold Cube Bead at bottom
      const cubeBead = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.028), goldMat);
      cubeBead.position.y = -0.12;
      earringGroup.add(cubeBead);

      this.head.add(earringGroup);
    });

    // --- ARTICULATED PUFFED SLEEVE ARMS ---
    this.armL = this.createArticulatedArm(-1, blouseMat, skinMat);
    this.armR = this.createArticulatedArm(1, blouseMat, skinMat);
    this.torso.add(this.armL.shoulder);
    this.torso.add(this.armR.shoulder);

    // --- ARTICULATED TERRACOTTA TROUSER LEGS ---
    this.legL = this.createArticulatedLeg(-1, pantsMat, bootMat, goldMat);
    this.legR = this.createArticulatedLeg(1, pantsMat, bootMat, goldMat);
    this.hips.add(this.legL.hipJoint);
    this.hips.add(this.legR.hipJoint);

    // Held book (appears in right hand during shelving)
    const bookGeo = new THREE.BoxGeometry(0.22, 0.32, 0.07);
    this.heldBook = new THREE.Mesh(bookGeo, this.clayMat(0xc0392b, 0.8));
    this.heldBook.position.set(0, -0.15, 0.12);
    this.heldBook.rotation.set(0.3, 0, 0);
    this.heldBook.castShadow = true;
    this.heldBook.visible = false;
    this.armR.handGroup.add(this.heldBook);

    this.initSpeechBillboard();
    this.scene.add(this.group);
  }

  // --- ARTICULATED ARM WITH PUFFED SLEEVE, ELBOW, WRIST, AND 5-DIGIT CLAY HAND ---
  createArticulatedArm(side, sleeveMat, skinMat) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.23, 0.38, 0.01);

    // Puffed sleeve shoulder pouf (Image Reference)
    const sleevePouf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), sleeveMat);
    sleevePouf.scale.set(1.05, 1.15, 1.05);
    sleevePouf.position.set(0, -0.05, 0);
    shoulder.add(sleevePouf);

    // Upper Arm
    const upperArm = new THREE.Group();
    shoulder.add(upperArm);

    const upperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.26, 14), sleeveMat);
    upperArmMesh.position.y = -0.13;
    upperArmMesh.castShadow = true;
    upperArm.add(upperArmMesh);

    // Blouse gathered ruffle at elbow
    const elbowRuffle = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.02, 8, 16), sleeveMat);
    elbowRuffle.position.y = -0.26;
    elbowRuffle.rotation.x = Math.PI / 2;
    upperArm.add(elbowRuffle);

    // Elbow Joint
    const elbow = new THREE.Group();
    elbow.position.y = -0.27;
    const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), skinMat);
    elbow.add(elbowBall);
    upperArm.add(elbow);

    // Forearm (exposed clay skin, feminine slender proportion)
    const forearm = new THREE.Group();
    const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.040, 0.26, 12), skinMat);
    forearmMesh.position.y = -0.13;
    forearmMesh.castShadow = true;
    forearm.add(forearmMesh);
    elbow.add(forearm);

    // Wrist Joint
    const wrist = new THREE.Group();
    wrist.position.y = -0.26;
    forearm.add(wrist);

    // 5-Digit Sculpted Clay Hand with Curled Grip Geometry
    const handGroup = new THREE.Group();
    wrist.add(handGroup);

    // Palm
    const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.08, 0.034), skinMat);
    palmMesh.position.set(0, -0.04, 0);
    palmMesh.castShadow = true;
    handGroup.add(palmMesh);

    // 4 Sculpted Fingers wrapping forward around the handlebar
    for (let f = 0; f < 4; f++) {
      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(-0.025 + f * 0.016, -0.08, 0);
      fingerGroup.rotation.x = 0.55; // Natural curl around the handlebar
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.06, 8), skinMat);
      finger.position.set(0, -0.028, 0.015);
      finger.castShadow = true;
      fingerGroup.add(finger);
      handGroup.add(fingerGroup);
    }

    // Opposable Sculpted Thumb tucked securely underneath
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.008, 0.048, 8), skinMat);
    thumb.position.set(side * -0.038, -0.04, -0.01);
    thumb.rotation.z = side * 0.45;
    thumb.rotation.x = -0.3;
    thumb.castShadow = true;
    handGroup.add(thumb);

    return { shoulder, upperArm, elbow, forearm, wrist, handGroup };
  }

  // --- ARTICULATED LEG WITH LOOSE TERRACOTTA TROUSERS & BUTTON BOOTS ---
  createArticulatedLeg(side, pantsMat, bootMat, goldMat) {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.14, -0.12, 0);

    // Thigh (Loose clay trousers / bloomers)
    const thigh = new THREE.Group();
    const thighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.38, 14), pantsMat);
    thighMesh.position.y = -0.19;
    thighMesh.castShadow = true;
    thigh.add(thighMesh);
    hipJoint.add(thigh);

    // Knee joint
    const knee = new THREE.Group();
    knee.position.y = -0.38;
    const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), pantsMat);
    knee.add(kneeBall);
    thigh.add(knee);

    // Shin / Calf (Gathered trouser leg)
    const shin = new THREE.Group();
    const shinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.078, 0.38, 14), pantsMat);
    shinMesh.position.y = -0.19;
    shinMesh.castShadow = true;
    shin.add(shinMesh);

    // Trouser ankle cuff
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.022, 8, 16), pantsMat);
    cuff.position.y = -0.36;
    cuff.rotation.x = Math.PI / 2;
    shin.add(cuff);

    knee.add(shin);

    // Ankle joint
    const ankle = new THREE.Group();
    ankle.position.y = -0.38;
    shin.add(ankle);

    // Sculpted Clay Boot with round brass buttons (Image Reference)
    const bootGroup = new THREE.Group();
    ankle.add(bootGroup);

    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.076, 0.14, 14), bootMat);
    bootShaft.position.y = 0.04;
    bootGroup.add(bootShaft);

    // Round brass button on outer boot shaft
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 10), goldMat);
    button.rotation.z = Math.PI / 2;
    button.position.set(side * 0.075, 0.05, 0);
    bootGroup.add(button);

    const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.24), bootMat);
    bootFoot.position.set(0, -0.06, 0.04);
    bootFoot.castShadow = true;
    bootGroup.add(bootFoot);

    const bootToe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), bootMat);
    bootToe.scale.set(1.0, 0.8, 1.25);
    bootToe.position.set(0, -0.06, 0.13);
    bootGroup.add(bootToe);

    return { hipJoint, thigh, knee, shin, ankle, bootGroup };
  }

  // --- 2-TIER ROLLING BOOK CART WITH 4 WHEELS & 5 TITLED BOOKS ---
  initBookCart() {
    this.cart = new THREE.Group();
    this.cart.name = 'Leola_Book_Cart';

    const oakMat = this.clayMat(0x6e4528, 0.82);
    const metalMat = this.clayMat(0x8a705a, 0.5, 0.5);
    const brassMat = this.clayMat(0xd4af37, 0.35, 0.7);

    const cWidth = 0.82;
    const cLength = 1.05;
    const shelfThick = 0.055;

    // Bottom Shelf
    const shelfBottom = new THREE.Mesh(new THREE.BoxGeometry(cWidth, shelfThick, cLength), oakMat);
    shelfBottom.position.y = 0.26;
    shelfBottom.castShadow = true;
    this.cart.add(shelfBottom);

    // Top Shelf
    const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(cWidth, shelfThick, cLength), oakMat);
    shelfTop.position.y = 0.76;
    shelfTop.castShadow = true;
    this.cart.add(shelfTop);

    // 4 Corner Metal Posts
    const postGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.78, 12);
    [[-0.37, -0.48], [0.37, -0.48], [-0.37, 0.48], [0.37, 0.48]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, metalMat);
      post.position.set(px, 0.52, pz);
      this.cart.add(post);
    });

    // Cart Handlebar: perfectly aligned with Leola's hands at waist height
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, cWidth + 0.08, 14), brassMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.18, -0.42);
    handleBar.castShadow = true;
    this.cart.add(handleBar);

    // Handlebar support riser posts
    [[-0.36, -0.42], [0.36, -0.42]].forEach(([rx, rz]) => {
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 10), brassMat);
      riser.position.set(rx, 1.02, rz);
      this.cart.add(riser);
    });

    // 4 Rolling Brass Caster Wheels
    this.wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.045, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    [[-0.35, -0.42], [0.35, -0.42], [-0.35, 0.42], [0.35, 0.42]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, brassMat);
      wheel.position.set(wx, 0.10, wz);
      wheel.castShadow = true;
      this.cart.add(wheel);
      this.wheels.push(wheel);
    });

    // 5 Titled Books on Top Shelf
    this.cartBooks = [];
    const bookColors = [0xb83b2e, 0x2e6b9e, 0x2e7d32, 0x8e44ad, 0xd4ac0d];
    const titles = [
      'Crochet Masterclass',
      'The Story of Needle & Yarn',
      'Color & Texture in Yarn',
      'Heirloom Stitches & Quilts',
      'Disney Clay Art'
    ];

    for (let i = 0; i < 5; i++) {
      const bHeight = 0.28 + (i % 2) * 0.04;
      const bThick = 0.05 + (i % 3) * 0.02;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(bThick, bHeight, 0.24),
        this.clayMat(bookColors[i], 0.8)
      );
      book.position.set(-0.25 + i * 0.125, 0.76 + shelfThick * 0.5 + bHeight * 0.5, 0.04);
      book.castShadow = true;
      book.userData = { title: titles[i], index: i };
      this.cart.add(book);
      this.cartBooks.push(book);
    }

    this.cart.position.set(0, 0, 0.70);
    this.group.add(this.cart);
  }

  // --- 3D SPEECH BILLBOARD ---
  initSpeechBillboard() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    this.speechCtx = canvas.getContext('2d');
    this.speechTexture = new THREE.CanvasTexture(canvas);

    this.speechBillboard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 0.6),
      new THREE.MeshBasicMaterial({ map: this.speechTexture, transparent: true })
    );
    this.speechBillboard.position.set(0, 2.35, 0);
    this.group.add(this.speechBillboard);

    this.updateSpeechCanvas("Hello! Ask me about crocheting & our library ✦");
  }

  updateSpeechCanvas(text) {
    const ctx = this.speechCtx;
    ctx.clearRect(0, 0, 512, 160);

    ctx.fillStyle = '#fff8ee';
    ctx.strokeStyle = '#c48a56';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 115, 24);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(240, 131);
    ctx.lineTo(256, 152);
    ctx.lineTo(272, 131);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a2813';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 73);

    this.speechTexture.needsUpdate = true;
  }

  // --- POSES ---
  applyPushingPose() {
    // Both arms extend forward and bend naturally forward at the elbow,
    // placing both sculpted clay hands directly onto the brass cart handlebar.
    this.armL.shoulder.rotation.set(-0.48, 0.08, 0.05);
    this.armL.elbow.rotation.set(-0.28, 0, 0); // Bends forward naturally towards handlebar
    this.armL.wrist.rotation.set(0.12, 0, 0);

    this.armR.shoulder.rotation.set(-0.48, -0.08, -0.05);
    this.armR.elbow.rotation.set(-0.28, 0, 0); // Bends forward naturally towards handlebar
    this.armR.wrist.rotation.set(0.12, 0, 0);

    this.heldBook.visible = false;
  }

  applyStandingDeskPose() {
    this.armL.shoulder.rotation.set(0.25, 0.15, -0.1);
    this.armL.elbow.rotation.set(-0.35, 0, 0);
    this.armL.wrist.rotation.set(0, 0, 0);

    this.armR.shoulder.rotation.set(0.45, -0.3, 0.2);
    this.armR.elbow.rotation.set(-0.7, 0, 0);
    this.armR.wrist.rotation.set(0, 0, 0);

    this.legL.thigh.rotation.set(0, 0, 0);
    this.legL.knee.rotation.set(0, 0, 0);
    this.legR.thigh.rotation.set(0, 0, 0);
    this.legR.knee.rotation.set(0, 0, 0);

    this.heldBook.visible = false;
    this.updateSpeechCanvas("Welcome to my desk! Ask me anything ✦");
  }

  // --- ONBOARDING GUIDE TO DESK ---
  guideToDesk(onArrival) {
    this.state = 'walk_to_desk';
    this.stateTime = 0;
    this.onArrivedAtDesk = onArrival;
    this.updateSpeechCanvas("Follow me to the reception desk! ✦");

    const curX = this.group.position.x;
    const curZ = this.group.position.z;

    this.deskPathWaypoints = [];
    if (curX <= 0) {
      this.deskPathWaypoints.push({ x: -4.2, z: Math.min(curZ, -6.0) });
      this.deskPathWaypoints.push({ x: -4.2, z: -12.8 });
      this.deskPathWaypoints.push({ x: 0.0, z: -12.8 });
      this.deskPathWaypoints.push({ x: 0.0, z: -8.6 });
    } else {
      this.deskPathWaypoints.push({ x: 4.2, z: Math.min(curZ, -6.0) });
      this.deskPathWaypoints.push({ x: 4.2, z: -12.8 });
      this.deskPathWaypoints.push({ x: 0.0, z: -12.8 });
      this.deskPathWaypoints.push({ x: 0.0, z: -8.6 });
    }
    this.deskPathIndex = 0;
  }

  updateWalkToDesk(delta) {
    if (this.deskPathIndex >= this.deskPathWaypoints.length) {
      this.group.position.set(0, 0, -8.6);
      this.group.rotation.y = 0;
      this.state = 'stand_at_desk';
      this.stateTime = 0;
      this.isAtDesk = true;
      this.applyStandingDeskPose();
      if (this.onArrivedAtDesk) {
        this.onArrivedAtDesk();
        this.onArrivedAtDesk = null;
      }
      return;
    }

    const target = this.deskPathWaypoints[this.deskPathIndex];
    const dx = target.x - this.group.position.x;
    const dz = target.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.28) {
      this.deskPathIndex++;
      return;
    }

    const targetYaw = Math.atan2(dx, dz);
    let diff = targetYaw - this.group.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.group.rotation.y += diff * 5.0 * delta;

    const step = Math.min(dist, (this.walkSpeed * 1.3) * delta);
    this.group.position.x += Math.sin(this.group.rotation.y) * step;
    this.group.position.z += Math.cos(this.group.rotation.y) * step;

    const stride = Math.sin(this.animTime * 8.5);
    this.legL.thigh.rotation.x = stride * 0.45;
    this.legR.thigh.rotation.x = -stride * 0.45;
    this.legL.knee.rotation.x = Math.max(0, -stride * 0.55);
    this.legR.knee.rotation.x = Math.max(0, stride * 0.55);

    this.wheels.forEach(w => {
      w.rotation.x += step * 8.0;
    });

    this.applyPushingPose();
  }

  // --- STATE MACHINE UPDATE ---
  update(delta, playerPos) {
    this.animTime += delta;
    this.stateTime += delta;

    if (playerPos) {
      const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
      const angle = Math.atan2(toPlayer.x, toPlayer.z) - this.group.rotation.y;
      this.speechBillboard.rotation.y = angle;
    }

    if (this.state === 'walk_to_desk') {
      this.updateWalkToDesk(delta);
      return;
    }

    if (this.state === 'stand_at_desk') {
      const breath = Math.sin(this.animTime * 2.0) * 0.02;
      this.torso.position.y = 0.16 + breath;
      this.head.rotation.y = Math.sin(this.animTime * 0.8) * 0.1;
      return;
    }

    if (this.state === 'walk') {
      this.updateWalk(delta);
    } else if (this.state === 'pick_book') {
      this.updatePickBook(delta);
    } else if (this.state === 'shelve_book') {
      this.updateShelveBook(delta);
    } else if (this.state === 'desk_visit') {
      this.updateDeskVisit(delta);
    }
  }

  updateWalk(delta) {
    this.shelvingTimer += delta;
    const wp = this.waypoints[this.currentWaypointIndex];
    const dx = wp.x - this.group.position.x;
    const dz = wp.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.35) {
      // Check if this waypoint is a bookshelf bay and 40 seconds has elapsed since last shelving
      if (wp.isBookshelf && this.shelvingTimer >= this.shelvingInterval) {
        this.state = 'pick_book';
        this.stateTime = 0;
        this.currentShelvingInfo = wp;
        this.updateSpeechCanvas(`Picking up '${wp.bookTitle}' from cart 📖`);
        return;
      } else if (wp.isDeskVisit) {
        this.state = 'desk_visit';
        this.stateTime = 0;
        this.updateSpeechCanvas("All books shelved in section B, Leola! ✨");
        return;
      } else {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        return;
      }
    }

    const targetYaw = Math.atan2(dx, dz);
    let diff = targetYaw - this.group.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.group.rotation.y += diff * 4.0 * delta;

    const step = Math.min(dist, this.walkSpeed * delta);
    this.group.position.x += Math.sin(this.group.rotation.y) * step;
    this.group.position.z += Math.cos(this.group.rotation.y) * step;

    const stride = Math.sin(this.animTime * 8.0);
    this.legL.thigh.rotation.x = stride * 0.45;
    this.legR.thigh.rotation.x = -stride * 0.45;
    this.legL.knee.rotation.x = Math.max(0, -stride * 0.55);
    this.legR.knee.rotation.x = Math.max(0, stride * 0.55);

    this.wheels.forEach(w => {
      w.rotation.x += step * 8.0;
    });

    // Both hands clasp the handlebar firmly during cart pushing
    this.applyPushingPose();
  }

  updatePickBook(delta) {
    const t = Math.min(this.stateTime / 1.5, 1.0);

    // Turn smoothly towards the bookshelf bay
    if (this.currentShelvingInfo && this.currentShelvingInfo.targetYaw !== undefined) {
      let diff = this.currentShelvingInfo.targetYaw - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * 3.0 * delta;
    }

    // Left hand remains firmly clasped around the cart handlebar
    this.armL.shoulder.rotation.set(-0.48, 0.08, 0.05);
    this.armL.elbow.rotation.set(-0.28, 0, 0);
    this.armL.wrist.rotation.set(0.12, 0, 0);

    // Right arm lifts from handlebar, reaches down to top shelf of the cart to grab a book
    const liftT = Math.sin(t * Math.PI * 0.5);
    this.armR.shoulder.rotation.set(-0.48 - liftT * 0.35, -0.15, 0.08);
    this.armR.elbow.rotation.set(-0.28 - liftT * 0.25, 0, 0); // Natural forward bend towards book
    this.armR.wrist.rotation.set(0.12 + liftT * 0.25, 0, 0);

    this.head.rotation.x = t * 0.22;

    if (t >= 1.0 && this.stateTime > 1.6) {
      this.heldBook.visible = true;
      if (this.cartBooks[0]) this.cartBooks[0].visible = false;
      this.state = 'shelve_book';
      this.stateTime = 0;
      const bay = this.currentShelvingInfo ? this.currentShelvingInfo.shelfBay : 'Bookshelf Bay';
      const title = this.currentShelvingInfo ? this.currentShelvingInfo.bookTitle : 'Volume';
      this.updateSpeechCanvas(`Placing '${title}' into ${bay} 📖`);
    }
  }

  updateShelveBook(delta) {
    const t = Math.min(this.stateTime / 2.0, 1.0);

    // Keep facing the bookshelf directly
    if (this.currentShelvingInfo && this.currentShelvingInfo.targetYaw !== undefined) {
      let diff = this.currentShelvingInfo.targetYaw - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * 4.0 * delta;
    }

    // Left hand remains firmly clasped around the cart handlebar
    this.armL.shoulder.rotation.set(-0.48, 0.08, 0.05);
    this.armL.elbow.rotation.set(-0.28, 0, 0);
    this.armL.wrist.rotation.set(0.12, 0, 0);

    if (t < 0.5) {
      // Reaching up and forward towards the bookshelf slot
      const p = t / 0.5;
      this.armR.shoulder.rotation.set(-0.85 - p * 0.55, -0.18, 0.08);
      this.armR.elbow.rotation.set(-0.45 + p * 0.25, 0, 0); // Forward reach
      this.armR.wrist.rotation.set(0.35 - p * 0.25, 0, 0);
      this.head.rotation.x = -0.18 * p;
    } else {
      // Pushing the book smoothly into the bookshelf slot
      const p = (t - 0.5) / 0.5;
      this.armR.shoulder.rotation.set(-1.40, -0.18, 0.08);
      this.armR.elbow.rotation.set(-0.20 - p * 0.15, 0, 0);
      this.heldBook.position.z = 0.12 + p * 0.32; // Slide book smoothly into bookshelf slot
    }

    if (t >= 1.0 && this.stateTime > 2.6) {
      // Book is securely shelved in the bookshelf!
      this.heldBook.visible = false;
      this.heldBook.position.set(0, -0.15, 0.12);
      if (this.cartBooks[0]) this.cartBooks[0].visible = true;

      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      this.state = 'walk';
      this.stateTime = 0;
      this.shelvingTimer = 0; // Reset 40-second interval timer!
      this.updateSpeechCanvas("Shelved cleanly! Onto next shelf ✦");
      // Right arm returns to cart handlebar and firmly clasps it
      this.applyPushingPose();
    }
  }

  updateDeskVisit(delta) {
    // Friendly greeting wave towards Leola seated at the reception desk
    const wave = Math.sin(this.stateTime * 4.5);
    this.armL.shoulder.rotation.set(-0.48, 0.08, 0.05);
    this.armL.elbow.rotation.set(-0.28, 0, 0);

    this.armR.shoulder.rotation.set(-1.1 + wave * 0.15, -0.15, 0.35 + wave * 0.25);
    this.armR.elbow.rotation.set(-0.65 + wave * 0.2, 0, 0);
    this.head.rotation.y = 0.2 + Math.sin(this.stateTime * 2.0) * 0.08;

    if (this.stateTime > 7.0) {
      this.state = 'walk';
      this.stateTime = 0;
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      this.updateSpeechCanvas("Back to shelving books on shelves ✦");
      this.applyPushingPose();
    }
  }

  startDialogue(greetingText) {
    this.state = 'talking';
    this.updateSpeechCanvas(greetingText || "Hello! Click to ask me anything ✦");
  }
}
