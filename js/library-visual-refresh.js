import * as THREE from 'three';

// Deterministic, meter-scale clay geometry. Owns only the entrance ornament and arcade.
export function refreshLibraryVisuals(world) {
  if (world.scene.getObjectByName('Library_Visual_Refresh')) return;
  const root = new THREE.Group();
  root.name = 'Library_Visual_Refresh';
  world.scene.add(root);
  const mat = color => world.clayMaterial(color, 0.78);
  const oak = mat(0x794321), dark = mat(0x422513), gold = mat(0xd8aa57);
  const cream = mat(0xf0d69c), green = mat(0x477335), red = mat(0xc94e42);
  const teal = mat(0x137f7a);
  function box(parent, w, h, d, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function tube(parent, points, radius, material) {
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 24, radius, 6, false), material);
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function leaf(parent, x, y, z, scale = 1, angle = 0) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), green);
    mesh.scale.set(.10 * scale, .23 * scale, .055 * scale);
    mesh.position.set(x, y, z); mesh.rotation.z = angle; mesh.castShadow = true; parent.add(mesh);
    return mesh;
  }
  function heart(parent, x, y, z, scale = 1) {
    const shape = new THREE.Shape();
    shape.moveTo(0,-.15); shape.bezierCurveTo(-.32,.04,-.20,.26,0,.13);
    shape.bezierCurveTo(.20,.26,.32,.04,0,-.15);
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth:.05,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.02,bevelThickness:.02}), red);
    mesh.position.set(x,y,z); mesh.scale.setScalar(scale); parent.add(mesh);
  }
  function book(parent, x, y, z, scale = 1) {
    const group = new THREE.Group(); group.position.set(x,y,z); group.scale.setScalar(scale); parent.add(group);
    for(const side of [-1,1]) {
      const cover = box(group,.58,.46,.065,side*.27,0,0,gold); cover.rotation.y=side*.18;
      const pages = box(group,.51,.39,.075,side*.26,.012,.055,cream); pages.rotation.y=side*.18;
      for(let i=0;i<4;i++) box(group,.38,.01,.008,side*.26,.12-i*.065,.114, gold);
    }
    return group;
  }
  function panel(parent, text, x, y, z, w, h, options = {}) {
    const canvas = document.createElement('canvas'); canvas.width=1536;canvas.height=384;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=options.background || '#693819';ctx.fillRect(0,0,1536,384);
    // Fine horizontal grain rather than a flat, featureless panel.
    for(let i=0;i<38;i++){ctx.strokeStyle=`rgba(35,13,4,${.035+(i%4)*.012})`;ctx.lineWidth=1+(i%3);ctx.beginPath();ctx.moveTo(0,i*11);ctx.bezierCurveTo(420,i*11+5,900,i*11-6,1536,i*11+2);ctx.stroke();}
    ctx.strokeStyle=options.border || '#d8ad61';ctx.lineWidth=8;ctx.strokeRect(18,18,1500,348);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`bold ${options.fontSize || 115}px Georgia, serif`;
    ctx.fillStyle=options.color || '#ffdf94';ctx.shadowColor='#321806';ctx.shadowBlur=2;ctx.shadowOffsetY=5;
    const lines=text.split('\n');lines.forEach((line,i)=>ctx.fillText(line,768,192+(i-(lines.length-1)/2)*130,1430));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.8}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }

  // Remove only the known original facade text plane. The supporting arch remains.
  const originalHeader=world.scene.children.find(o => o.isMesh && o.geometry?.type==='PlaneGeometry' && Math.abs(o.position.x)<.001 && Math.abs(o.position.y-9.6)<.001 && Math.abs(o.position.z-5.7)<.001);
  if(originalHeader) originalHeader.visible=false;
  const entrance=new THREE.Group();entrance.name='Carved_Learning_Library_Entrance';entrance.position.set(0,9.6,5.76);root.add(entrance);
  entrance.position.y = 10.2;
  box(entrance,9.30,2.15,.22,0,-.24,0,dark);
  const entranceTexture = new THREE.TextureLoader().load('assets/images/leola-entrance-ornate.png');
  entranceTexture.colorSpace = THREE.SRGBColorSpace;
  const entranceArt = new THREE.Mesh(new THREE.PlaneGeometry(10.2,3.4), new THREE.MeshBasicMaterial({map:entranceTexture,transparent:true,alphaTest:.04}));
  entranceArt.name='Original_Reference_Entrance_Artwork';entranceArt.position.set(0,0,.24);entrance.add(entranceArt);
  const hanging=new THREE.Group();hanging.name='Stories_Learning_Play_Plaque';hanging.position.set(0,-2.10,.02);entrance.add(hanging);
  box(hanging,5.45,.82,.17,0,0,0,oak);
  panel(hanging,'Stories · Learning · Play\nA Brighter Tomorrow',0,0,.095,5.27,.69,{fontSize:81});
  for(const x of [-2.1,2.1])tube(entrance,[[x,-1.45,0],[x,-1.78,0]],.038,gold);

  // Replace the floating wall mount, preserving the existing arcade interaction type.
  const old=world.arcadeGroup;
  if(old) {
    const removed=new Set();old.traverse(o=>removed.add(o));
    world.interactiveObjects=world.interactiveObjects.filter(o=>!removed.has(o));
    world.scene.remove(old);
  }
  const arcade=new THREE.Group();arcade.name='Learning_Library_Arcade';arcade.position.set(16.1,.05,-20);arcade.rotation.y=-Math.PI/2;root.add(arcade);world.arcadeGroup=arcade;
  // Bottom of plinth exactly meets interior floor at y=.05.
  const base=box(arcade,2.15,.16,1.42,0,.08,.25,dark);base.name='Arcade_Grounded_Plinth';
  const body=box(arcade,1.96,3.35,1.20,0,1.805,.17,oak);
  box(arcade,1.77,1.50,.08,0,2.39,.80,dark);
  const screen=panel(arcade,'INSERT TOKEN\nOR CLICK TO PLAY',0,2.46,.85,1.56,1.20,{background:'#16213c',border:'#c29a62',fontSize:110,color:'#fff4db'});
  screen.material.emissive=new THREE.Color(0x485b94);screen.material.emissiveMap=screen.material.map;screen.material.emissiveIntensity=.35;
  book(arcade,0,2.03,.91,.48);
  box(arcade,2.04,.53,.19,0,3.30,.80,cream);
  panel(arcade,'Leola’s\nLibrary',0,3.30,.908,1.87,.45,{background:'#ebd29d',color:'#087b79',border:'#b58142',fontSize:116});
  const deck=box(arcade,2.04,.20,.65,0,1.68,1.02,cream);deck.rotation.x=.12;
  for(const side of [-1,1]) {
    box(arcade,.13,3.40,1.37,side*1.01,1.86,.23,oak);
    tube(arcade,[[side*1.04,.18,.99],[side*1.04,1.5,1.02],[side*1.04,1.8,1.30],[side*1.04,2.25,.95],[side*1.04,3.48,.96]],.055,gold);
    for(let i=0;i<17;i++) {
      leaf(arcade,side*(1.03+(i%2?.025:-.025)),.34+i*.177,1.025,.48,side*(i%2?.65:-.65));
    }
    heart(arcade,side*.74,3.31,.935,.40);
  }
  box(arcade,1.75,1.21,.10,0,.85,.81,cream);
  book(arcade,0,1.03,.90,1.0);heart(arcade,0,1.035,1.035,.85);
  box(arcade,.68,.64,.10,0,.49,.95,dark);
  for(const x of [-.16,.16])box(arcade,.09,.13,.035,x,.59,1.02,gold);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.20,10),gold);shaft.position.set(-.59,1.90,1.11);arcade.add(shaft);
  const joystick=new THREE.Mesh(new THREE.SphereGeometry(.115,12,10),red);joystick.position.set(-.59,2.015,1.11);arcade.add(joystick);
  [red,gold,green,teal].forEach((material,i)=>{
    const button=new THREE.Mesh(new THREE.CylinderGeometry(.09,.105,.05,12),material);button.position.set(-.1+i*.255,1.818,1.15);arcade.add(button);
  });
  // A fitted wooden alcove, with actual book spines, echoes the supplied arcade reference.
  for(const side of [-1,1]) {
    const x=side*1.54;
    box(arcade,.72,3.95,.75,x,1.975,-.03,dark);
    for(let row=0;row<4;row++) {
      box(arcade,.78,.07,.90,x,.13+row*.91,.08,oak);
      for(let j=0;j<4;j++) {
        const color=[teal,red,gold,green][(j+row)%4];const bx=x-.25+j*.165;
        box(arcade,.13,.59+(j%2)*.10,.28,bx,.47+row*.91,.42,color);
        box(arcade,.10,.025,.015,bx,.67+row*.91,.568,cream);
      }
    }
  }
  box(arcade,3.88,.53,.88,0,4.03,.07,oak);
  panel(arcade,'Leola’s Learning Library',0,4.12,.52,3.64,.31,{background:'#ebd29d',color:'#126f65',fontSize:102});
  panel(arcade,'EXPLORE  ♥  PLAY  ♥  READ  ♥  BELONG',0,3.88,.521,3.64,.16,{background:'#ebd29d',color:'#68371f',fontSize:67});
  const data={type:'arcade',name:'Leola’s Learning Library Arcade',prompt:'Click to play',walkTo:new THREE.Vector3(13.2,1.8,-20)};
  // All surfaces of the cabinet are actionable, without invisible hit planes.
  arcade.traverse(o=>{if(o.isMesh){o.userData={...data};world.interactiveObjects.push(o);}});
  arcade.userData.floorHeight=.05;
  root.userData.version=1;
  return root;
}
