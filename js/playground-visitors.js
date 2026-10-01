import * as THREE from 'three';
const visitorSets = new WeakMap();

// All coordinates below are local to the existing playground or swing pivot.
export function addPlaygroundVisitors(world) {
  const park = world.scene.getObjectByName('Lighthouse_Childrens_Park');
  if (!park) return null;
  if (visitorSets.has(park)) return visitorSets.get(park);
  const material = color => world.clayMaterial(color, 0.9);
  const eyes = material(0x242222), shoes = material(0x343c51);
  const sphere = (parent, name, radius, position, mat, scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
    mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const limb = (parent, name, from, to, radius, mat) => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const delta = b.clone().sub(a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), mat);
    mesh.name = name; mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  function child(name, skinColor, shirtColor, hairColor, seated) {
    const figure = new THREE.Group(); figure.name = name;
    const skin = material(skinColor), shirt = material(shirtColor), trousers = material(0x334e77);
    const hipY = seated ? 0.10 : 0.52;
    sphere(figure, 'Trousers', 0.21, [0, hipY, 0], trousers, [1, 0.67, 0.72]);
    sphere(figure, 'Shirt', 0.25, [0, hipY + 0.26, 0], shirt, [0.9, 1.18, 0.66]);
    sphere(figure, 'Head', 0.20, [0, hipY + 0.69, 0], skin);
    sphere(figure, 'Hair', 0.205, [0, hipY + 0.76, -0.035], material(hairColor), [1, 0.76, 0.96]);
    [-1, 1].forEach(side => {
      sphere(figure, 'Eye', 0.021, [side * 0.07, hipY + 0.71, 0.186], eyes);
      const x = side * 0.115;
      const knee = seated ? [x, 0.08, 0.32] : [x, 0.28, 0.015];
      const ankle = seated ? [x, -0.30, 0.35] : [x, 0.07, 0.025];
      limb(figure, 'Trouser_thigh', [x, hipY, 0], knee, 0.082, trousers);
      limb(figure, 'Trouser_shin', knee, ankle, 0.071, trousers);
      sphere(figure, 'Shoe', 0.10, [x, ankle[1] - 0.015, ankle[2] + 0.055], shoes, [0.8, 0.60, 1.3]);
    });
    const arms = [-1, 1].map(side => {
      const arm = new THREE.Group(); arm.name = side < 0 ? 'Left_arm' : 'Right_arm';
      arm.position.set(side * 0.21, hipY + 0.39, 0); figure.add(arm);
      if (seated) {
        // Hands reach the ropes at x +/-0.36 while sharing the seat's pivot.
        limb(arm, 'Sleeve', [0, 0, 0], [side * 0.08, -0.05, 0.03], 0.082, shirt);
        limb(arm, 'Forearm', [side * 0.08, -0.05, 0.03], [side * 0.15, 0.18, 0], 0.054, skin);
        sphere(arm, 'Hand', 0.067, [side * 0.15, 0.18, 0], skin);
      } else {
        limb(arm, 'Sleeve', [0, 0, 0], [0, -0.18, 0.08], 0.08, shirt);
        limb(arm, 'Forearm', [0, -0.18, 0.08], [-side * 0.10, -0.08, 0.34], 0.054, skin);
        sphere(arm, 'Hand', 0.065, [-side * 0.10, -0.08, 0.34], skin);
      }
      return arm;
    });
    figure.userData.child = true;
    return { figure, arms };
  }
  const swingChildren = [];
  (world.parkSwings || []).slice(0, 2).forEach((pivot, index) => {
    const kid = child(`Playground_Swing_Child_${index + 1}`, index ? 0xdca477 : 0x8e5437,
      index ? 0x48a7ad : 0xe9a33f, index ? 0x69442a : 0x302820, true);
    kid.figure.position.y = -2.435; // top face of the existing 0.13-thick seat
    pivot.add(kid.figure); swingChildren.push(kid.figure);
  });

  // Beyond the back edge of the sand island, away from the western approach path.
  const lawn = new THREE.Group(); lawn.name = 'Playground_Grass_Catch'; park.add(lawn);
  const players = [
    child('Playground_Catch_Child_1', 0xba7b53, 0xc86880, 0x2c241e, false),
    child('Playground_Catch_Child_2', 0xf0c09c, 0x6c91cf, 0x76502e, false)
  ];
  players.forEach((kid, index) => {
    kid.figure.position.set(index ? 2.2 : -2.2, 0, -8.4);
    kid.figure.rotation.y = index ? -Math.PI / 2 : Math.PI / 2;
    lawn.add(kid.figure);
  });
  const ball = sphere(lawn, 'Playground_Gentle_Football', 0.14, [0, 0.84, -8.4], material(0x9d532e), [1.5, 0.8, 0.8]);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.025), material(0xfff3d8));
  stripe.position.y = 0.114; ball.add(stripe);
  const releaseA = new THREE.Vector3(-1.86, 0.83, -8.4);
  const releaseB = new THREE.Vector3(1.86, 0.83, -8.4);
  const update = time => {
    const turn = Math.floor(time / 3.6), phase = (time % 3.6) / 3.6;
    const flight = THREE.MathUtils.clamp((phase - 0.22) / 0.60, 0, 1);
    const from = turn % 2 ? releaseB : releaseA, to = turn % 2 ? releaseA : releaseB;
    ball.position.lerpVectors(from, to, flight);
    ball.position.y += Math.sin(flight * Math.PI) * 1.25;
    ball.rotation.x = flight * Math.PI * 4;
    players.forEach((kid, index) => {
      const throwing = index === turn % 2;
      const lift = throwing ? Math.sin(Math.min(phase / 0.32, 1) * Math.PI) * 0.34 : Math.sin(flight * Math.PI) * 0.16;
      kid.arms.forEach(arm => { arm.rotation.x = -lift; });
    });
  };
  update(0);
  const result = { update, swingChildren, players: players.map(k => k.figure), ball, lawn };
  visitorSets.set(park, result);
  return result;
}
