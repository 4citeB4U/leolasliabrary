import * as THREE from 'three';

// Plan-view land extents are shared by the raised banks and their exposed rock edges.
// Coordinates are world X/Z; camera-left at the waterfront is positive X.
export function finishWaterfrontEdges(world) {
  const scene=world.scene;
  const landRects=[
    [-90,-20,-300,300],[-50,64,-56,27.1],[19,64,-66,30],
    [-21.42,29.42,51.752,68.152],[-22.5,4.5,68,71],[-90,56,74,220]
  ];
  const waterBounds=[-20,180,24.5,220];
  const waterRects=[waterBounds];
  const outerLake=scene.getObjectByName('Playground_Open_Lake');
  if(outerLake){
    const {width,height}=outerLake.geometry.parameters;
    waterRects.push([outerLake.position.x-width/2,outerLake.position.x+width/2,
      outerLake.position.z-height/2,outerLake.position.z+height/2]);
    outerLake.material.color.setHex(0x174862);
    outerLake.material.roughness=0.25;outerLake.material.metalness=0.38;
  }
  const slab=(name,x0,x1,z0,z1,color,top=0.12)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,0.55,z1-z0),world.clayMaterial(color,0.93));
    m.name=name;m.position.set((x0+x1)/2,top-0.275,(z0+z1)/2);m.receiveShadow=true;
    scene.add(m);return m;
  };
  // Close the exposed blue strip underneath the boardwalk and fill the lighthouse tip.
  slab('Continuous_Boardwalk_Land',-20,64,23.9,27.1,0x648e48,0.06);
  slab('Lighthouse_Raised_Land',19,64,-21,30,0x648e48,0.08);
  slab('Downtown_Raised_Land',-90,56,74,220,0x64834f);
  slab('City_Business_Paving',-55,-34,16,152,0xaaa598,0.07);
  slab('Downtown_Street',-31,56,108,116,0x34383b,0.15);
  slab('Downtown_Front_Sidewalk',-31,56,104.5,108,0xc8c3b8,0.17);
  slab('Downtown_Back_Sidewalk',-31,56,116,119.5,0xc8c3b8,0.17);
  const yellow=world.clayMaterial(0xe9c64c,0.8);
  for(let x=-28;x<54;x+=6){
    const dash=new THREE.Mesh(new THREE.BoxGeometry(3,0.025,0.13),yellow);
    dash.position.set(x,0.174,112);scene.add(dash);
  }
  const water=scene.getObjectByName('Lake_Michigan_Water');
  water.geometry.dispose();water.geometry=new THREE.PlaneGeometry(200,195.5);
  water.position.set(80,0.015,122.25);

  // Split every rectangle edge at intersections. Retain only edges with water on
  // one side and land on the other; internal grass/paving seams receive no rocks.
  const edges=[];
  const inside=(x,z)=>landRects.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d);
  const lake=(x,z)=>waterRects.some(([a,b,c,d])=>x>=a&&x<=b&&z>=c&&z<=d);
  const seen=new Set();
  for(const [x0,x1,z0,z1] of landRects){
    for(const [ax,az,bx,bz] of [[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]]){
      const horizontal=az===bz,lo=Math.min(horizontal?ax:az,horizontal?bx:bz),hi=Math.max(horizontal?ax:az,horizontal?bx:bz);
      const cuts=[lo,hi,...[...landRects,...waterRects].flatMap(r=>horizontal?[r[0],r[1]]:[r[2],r[3]])].filter(v=>v>=lo&&v<=hi).sort((a,b)=>a-b);
      for(let i=0;i<cuts.length-1;i++){
        const a=cuts[i],b=cuts[i+1];if(b-a<0.001)continue;
        const mid=(a+b)/2,x=horizontal?mid:ax,z=horizontal?az:mid;
        const sides=horizontal?[[x,z-0.01],[x,z+0.01]]:[[x-0.01,z],[x+0.01,z]];
        if(inside(...sides[0])===inside(...sides[1]))continue;
        const wet=sides.find(p=>!inside(...p));if(!lake(...wet))continue;
        const edge=horizontal?[a,az,b,az]:[ax,a,ax,b],key=edge.join(',');
        if(!seen.has(key)){seen.add(key);edges.push(edge);}
      }
    }
  }
  const rocks=new THREE.Group();rocks.name='Continuous_Shoreline_Riprap';
  const geometry=new THREE.DodecahedronGeometry(1,0);
  const mats=[0x988e7d,0xafa18c,0x827b70].map(c=>world.clayMaterial(c,0.96));
  let index=0;
  const batches=[[],[],[]],boulders=[];
  for(const [ax,az,bx,bz] of edges){
    const length=Math.hypot(bx-ax,bz-az),count=Math.ceil(length/0.85);
    const nx=-(bz-az)/length,nz=(bx-ax)/length;
    const wetSign=inside((ax+bx)/2+nx*0.01,(az+bz)/2+nz*0.01)?-1:1;
    // A narrow continuous soil/stone bank makes the land's elevation legible.
    const bank=new THREE.Mesh(new THREE.BoxGeometry(length,0.42,0.48),world.clayMaterial(0x776e5c,0.98));
    bank.position.set((ax+bx)/2,-0.09,(az+bz)/2);bank.rotation.y=-Math.atan2(bz-az,bx-ax);rocks.add(bank);
    for(let j=0;j<count;j++){
      const t=(j+0.5)/count,m=new THREE.Mesh(geometry,mats[index%3]);
      m.name='Shore_Boulder';m.position.set(ax+(bx-ax)*t+nx*wetSign*0.48,0.07,az+(bz-az)*t+nz*wetSign*0.48);
      m.scale.set(0.56+(index%3)*0.05,0.27+(index%4)*0.035,0.47+(index%2)*0.08);
      m.rotation.set(0.08*Math.sin(index),index*0.71,0.06*Math.cos(index));
      m.updateMatrix();batches[index%3].push(m.matrix.clone());
      boulders.push({x:m.position.x,z:m.position.z});index++;
    }
  }
  batches.forEach((matrices,i)=>{
    const instances=new THREE.InstancedMesh(geometry,mats[i],matrices.length);
    instances.name='Shore_Boulder_Batch_'+i;
    matrices.forEach((matrix,j)=>instances.setMatrixAt(j,matrix));
    instances.instanceMatrix.needsUpdate=true;instances.castShadow=true;instances.receiveShadow=true;
    rocks.add(instances);
  });
  rocks.userData.edges=edges;rocks.userData.landRects=landRects;rocks.userData.boulders=boulders;scene.add(rocks);

  const shops=[['Harbor Donuts',27,0xc97f69],['Lakefront Hot Dogs',54,0xd6b566],
    ['Bay Burgers',63,0x819d85],['Milwaukee Books',91,0x8d98b0],
    ['Cream City Cafe',104,0xcda784],['Corner Market',137,0x8dacb0]];
  shops.forEach(([label,z,color],index)=>{
    const g=new THREE.Group();g.name='Waterfront_Business_'+index;g.position.set(-40,0.08,z);
    const body=new THREE.Mesh(new THREE.BoxGeometry(10,4.8,7),world.clayMaterial(color,0.9));body.position.y=2.4;g.add(body);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(10.6,0.38,7.6),world.clayMaterial(0x665b50,0.9));roof.position.y=4.95;g.add(roof);
    const glass=world.clayMaterial(0x244552,0.4),cream=world.clayMaterial(0xf6e4be,0.85);
    [-2.1,2.1].forEach(wz=>{const w=new THREE.Mesh(new THREE.BoxGeometry(0.10,1.7,1.6),glass);w.position.set(5.06,2.15,wz);g.add(w);});
    const door=new THREE.Mesh(new THREE.BoxGeometry(0.12,2.6,1.2),glass);door.position.set(5.09,1.3,0);g.add(door);
    const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.18,6.5),cream);canopy.position.set(5.65,3.45,0);canopy.rotation.z=-0.1;g.add(canopy);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#50382c';ctx.fillRect(0,0,512,96);
    ctx.fillStyle='#fff3d6';ctx.font='bold 40px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,49,490);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.3,0.85),new THREE.MeshBasicMaterial({map:tex}));
    sign.position.set(5.12,4.15,0);sign.rotation.y=Math.PI/2;g.add(sign);
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);
  });
}
