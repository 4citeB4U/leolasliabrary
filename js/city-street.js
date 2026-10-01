import * as THREE from 'three';

// One measured route drives pavement, markings, vehicles and pedestrians.
export function curveCityStreet(world) {
  const curve = new THREE.CatmullRomCurve3([
    [-27,-300],[-27,30],[-27,55],[-28,68],[-30,74],
    [-34,81.5],[-41,83.8],[-55,83.8],[-64,88],[-66,105],[-66,300]
  ].map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  curve.arcLengthDivisions=3000;
  const length=curve.getLength();
  const sample=(distance,offset=0)=>{
    const u=THREE.MathUtils.clamp(distance/length,0,1);
    const p=curve.getPointAt(u),t=curve.getTangentAt(u);
    const taper=THREE.MathUtils.smoothstep(distance,350,375);
    const halfWidth=4-1.9*taper;
    p.x+=t.z*offset;p.z-=t.x*offset;
    return {x:p.x,z:p.z,heading:Math.atan2(t.x,t.z),halfWidth,sidewalkWidth:3-2.25*taper};
  };
  world.cityStreetRoute={sample,length};
  const old=[];world.scene.traverse(o=>{
    if(['Milwaukee_City_Street','Milwaukee_City_Sidewalk','Milwaukee_West_Outer_Sidewalk','Street_Centerline'].includes(o.name))old.push(o);
  });
  old.forEach(o=>o.removeFromParent());
  world.walkableSurfaces=world.walkableSurfaces.filter(o=>!old.includes(o));
  const strip=(name,side,color,y)=>{
    const vertices=[],indices=[];
    for(let i=0;i<=1600;i++){
      const d=length*i/1600,h=sample(d).halfWidth,sw=sample(d).sidewalkWidth;
      const offsets=side===0?[-h,h]:side<0?[-h-sw,-h]:[h,h+sw];
      for(const offset of offsets){const p=sample(d,offset);vertices.push(p.x,y,p.z);}
      if(i<1600){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,world.clayMaterial(color,0.92));mesh.name=name;mesh.receiveShadow=true;world.scene.add(mesh);
    if(side){mesh.userData.walkable=true;world.walkableSurfaces.push(mesh);}
  };
  strip('Milwaukee_City_Street',0,0x34383b,0.19);
  strip('Milwaukee_City_Sidewalk',1,0xc8c3b8,0.205);
  strip('Milwaukee_West_Outer_Sidewalk',-1,0xc8c3b8,0.205);
  const lineMat=world.clayMaterial(0xe9c64c,0.72);
  for(let d=2;d<length-2;d+=6){const p=sample(d);const dash=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.02,2.7),lineMat);dash.name='Street_Centerline';dash.position.set(p.x,0.21,p.z);dash.rotation.y=p.heading;world.scene.add(dash);}
}
