import * as THREE from 'three';

// Modeled interpretation of the supplied Avenue reference; no image billboard.
export function buildAvenueMall(world) {
  const mall=new THREE.Group();mall.name='The_Avenue_Mall';
  mall.position.set(-42,0.12,8);mall.rotation.y=Math.PI/2;world.scene.add(mall);
  const mat=c=>world.clayMaterial(c,0.83);
  const stone=mat(0xd8c09a),dark=mat(0x282f32),glass=new THREE.MeshStandardMaterial({color:0x365568,roughness:0.24,metalness:0.35});
  const brickCanvas=document.createElement('canvas');brickCanvas.width=256;brickCanvas.height=256;
  const ctx=brickCanvas.getContext('2d');ctx.fillStyle='#9c6245';ctx.fillRect(0,0,256,256);
  for(let row=0;row<16;row++)for(let col=-1;col<9;col++){
    ctx.fillStyle=['#b77c57','#ae704e','#bb805e','#b47755'][(row*7+col+12)%4];
    ctx.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);
  }
  const tex=new THREE.CanvasTexture(brickCanvas);tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,2);
  const brick=new THREE.MeshStandardMaterial({map:tex,roughness:0.93});
  const box=(w,h,d,x,y,z,m,parent=mall)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const sign=(text,w,h,x,y,z,font=48,parent=mall)=>{
    const c=document.createElement('canvas');c.width=1024;c.height=256;
    const p=c.getContext('2d');p.fillStyle='#252a2c';p.fillRect(0,0,1024,256);
    p.fillStyle='#fff2d5';p.textAlign='center';p.textBaseline='middle';p.font=`600 ${font*2}px Georgia`;
    p.fillText(text,512,130,980);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  };
  // Two brick wings preserve an open, taller central glass atrium.
  [-1,1].forEach(side=>{
    const cx=side*7.1;box(8.8,11.3,8,cx,5.65,0,brick);
    [0.4,3.2,7.0,10.6,11.4].forEach(y=>box(9.1,0.28,8.3,cx,y,0,stone));
    [-4.2,4.2].forEach(dx=>{box(0.45,11.8,8.4,cx+dx,5.9,0,stone);box(0.7,0.6,0.7,cx+dx,12.1,4.1,stone);});
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const x=cx+(col-1)*2.5,y=3.65+row*3.7;
      const arch=new THREE.Shape();arch.moveTo(-0.78,0);arch.lineTo(0.78,0);arch.lineTo(0.78,1.65);
      arch.absarc(0,1.65,0.78,0,Math.PI,false);arch.lineTo(-0.78,0);
      const pane=new THREE.Mesh(new THREE.ShapeGeometry(arch,16),glass);pane.position.set(x,y,4.025);pane.name='Mall_Arched_Window';mall.add(pane);
      const points=[new THREE.Vector3(x-0.9,y,4.07),new THREE.Vector3(x-0.9,y+1.65,4.07)];
      for(let i=0;i<=16;i++){const a=Math.PI-i/16*Math.PI;points.push(new THREE.Vector3(x+Math.cos(a)*0.9,y+1.65+Math.sin(a)*0.9,4.07));}
      points.push(new THREE.Vector3(x+0.9,y,4.07));
      mall.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,0.105,6,false),stone));
      box(0.06,2.2,0.1,x,y+1.1,4.08,dark);box(1.55,0.065,0.1,x,y+1.4,4.08,dark);
    }
    for(let col=0;col<3;col++){
      const x=cx+(col-1)*2.7;box(2.15,2.5,0.12,x,1.4,4.08,glass);
      box(0.06,2.5,0.16,x,1.4,4.17,stone);
      const awning=box(2.4,0.16,1.3,x,2.95,4.5,dark);awning.rotation.x=0.15;
      sign(['SHOP','DINE','EXPLORE'][col],2.1,0.37,x,2.84,5.1,30);
    }
    for(let i=0;i<12;i++)box(0.25,0.38,0.2,cx-4+i*0.72,10.05,4.06,stone);
  });
  box(5.6,11.7,8.5,0,5.85,0.1,glass);
  [-2.9,-1.45,0,1.45,2.9].forEach(x=>box(0.13,12,0.2,x,6,4.45,dark));
  [0.2,3.2,6.2,9.2,12].forEach(y=>box(6,0.15,0.2,0,y,4.45,dark));
  box(6.4,0.35,9,0,12.1,0,dark);
  sign('THE AVENUE',5.2,1.05,0,7.35,4.59,45);
  sign('MILWAUKEE',3.5,0.5,0,6.5,4.59,36);
  box(7.2,0.45,2,0,3.25,4.85,dark);
  sign('3RD STREET MARKET HALL',7,0.5,0,3.24,5.87,31);
  [-1,1].forEach(x=>box(1.8,2.75,0.1,x,1.4,4.57,glass));
  [-7.5,7.5].forEach(x=>{
    box(2.3,0.65,1.15,x,0.35,6.05,dark);
    for(let i=0;i<5;i++){
      const shrub=new THREE.Mesh(new THREE.SphereGeometry(0.45,10,8),mat(0x4d783d));
      shrub.position.set(x-0.8+i*0.4,0.85,6.05);mall.add(shrub);
    }
  });
  const lawn=new THREE.Mesh(new THREE.PlaneGeometry(21,30),mat(0x658849));
  lawn.name='Mall_Grass_Setback';lawn.rotation.x=-Math.PI/2;lawn.position.set(-44.5,0.09,8);world.scene.add(lawn);
  const approach=new THREE.Mesh(new THREE.PlaneGeometry(4,5.5),mat(0xc8c3b8));
  approach.name='Mall_Sidewalk_Approach';approach.rotation.x=-Math.PI/2;approach.position.set(-35.7,0.22,8);world.scene.add(approach);
  mall.userData.footprint={minX:-46.5,maxX:-36,minZ:-3.5,maxZ:19.5};
  return mall;
}
