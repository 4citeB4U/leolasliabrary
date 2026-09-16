import * as THREE from 'three';

export { THREE };

export function makeRenderer(sceneColor=0x120f18){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  document.querySelector('#game').appendChild(renderer.domElement);
  const scene=new THREE.Scene(); scene.background=new THREE.Color(sceneColor); scene.fog=new THREE.Fog(sceneColor,35,110);
  const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,250);
  addLights(scene);
  addResize(renderer,camera);
  return {renderer,scene,camera};
}

export function addLights(scene){
  scene.add(new THREE.HemisphereLight(0xfff1d8,0x23192e,2.0));
  const key=new THREE.DirectionalLight(0xffffff,2.7); key.position.set(8,14,10); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key);
  const fill=new THREE.PointLight(0xff7bc4,12,45); fill.position.set(-10,6,4); scene.add(fill);
}

export function floor(scene, size=120){
  const g=new THREE.PlaneGeometry(size,size,24,24); const m=new THREE.MeshStandardMaterial({color:0x4a3023,roughness:.9,metalness:.05});
  const p=new THREE.Mesh(g,m); p.rotation.x=-Math.PI/2; p.receiveShadow=true; scene.add(p);
  const grid=new THREE.GridHelper(size,24,0xc99b4a,0x6e4d37); grid.position.y=.01; scene.add(grid); return p;
}

export function hook(color=0xd9dbe7){
  const pts=[new THREE.Vector3(0,-1.9,0),new THREE.Vector3(0,1.4,0),new THREE.Vector3(.15,2.1,0),new THREE.Vector3(.72,2.45,0),new THREE.Vector3(1.05,2.05,0),new THREE.Vector3(.72,1.66,0)];
  const curve=new THREE.CatmullRomCurve3(pts); const geo=new THREE.TubeGeometry(curve,42,.16,12,false); const mat=new THREE.MeshStandardMaterial({color,metalness:.72,roughness:.22}); const mesh=new THREE.Mesh(geo,mat); mesh.castShadow=true;
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,2.2,18),new THREE.MeshStandardMaterial({color:0x7a3f68,roughness:.55})); grip.position.y=-.55; grip.castShadow=true; mesh.add(grip); return mesh;
}

export function yarnBall(color=0xff6f91, r=.75){
  const group=new THREE.Group(); const base=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),new THREE.MeshStandardMaterial({color,roughness:.83})); base.castShadow=true; group.add(base);
  const lineMat=new THREE.MeshStandardMaterial({color:new THREE.Color(color).offsetHSL(0,0,.14),roughness:.6});
  for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(r*.78,.035,6,48),lineMat);t.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);group.add(t)}
  return group;
}

export function ring(color=0x68f5c1,r=1){ const m=new THREE.Mesh(new THREE.TorusGeometry(r,.13,12,40),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.45,metalness:.2}));m.castShadow=true;return m; }

export function knot(color=0x33212f){ const g=new THREE.Group(); for(let i=0;i<3;i++){const t=new THREE.Mesh(new THREE.TorusKnotGeometry(.72,.22,64,10,2,3),new THREE.MeshStandardMaterial({color,roughness:.75}));t.scale.set(.7,.7,.7);t.rotation.set(i,1.2*i,.4*i);g.add(t)} return g; }

export function labelSprite(text, opts={}){
  const c=document.createElement('canvas'),x=c.getContext('2d'); c.width=512;c.height=160; x.clearRect(0,0,c.width,c.height); x.fillStyle=opts.bg||'rgba(28,18,34,.88)'; x.roundRect(8,8,496,144,28);x.fill(); x.strokeStyle=opts.border||'#e6bd70';x.lineWidth=6;x.stroke(); x.fillStyle=opts.color||'#fff8e8';x.font='700 48px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,82);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));s.scale.set(4.8,1.5,1);return s;
}

export function input(){
  const keys=new Set(); addEventListener('keydown',e=>{keys.add(e.code); if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()}); addEventListener('keyup',e=>keys.delete(e.code));
  document.querySelectorAll('[data-key]').forEach(b=>{const code=b.dataset.key; const on=e=>{e.preventDefault();keys.add(code);b.classList.add('on')},off=e=>{e.preventDefault();keys.delete(code);b.classList.remove('on')}; b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
  return {down:(...codes)=>codes.some(c=>keys.has(c)),consume(code){const v=keys.has(code);keys.delete(code);return v},keys};
}

export function hud({title,objective}){
  document.querySelector('#title').textContent=title; document.querySelector('#objective').textContent=objective;
  return {score(v){document.querySelector('#score').textContent=v},status(v){document.querySelector('#status').textContent=v},objective(v){document.querySelector('#objective').textContent=v}};
}

export function pulse(mesh,t,s=.08){ const k=1+Math.sin(t*4)*s; mesh.scale.setScalar(k); }
export function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
export function distXZ(a,b){const dx=a.x-b.x,dz=a.z-b.z;return Math.hypot(dx,dz)}
export function save(game,data){try{localStorage.setItem('leola3d:'+game,JSON.stringify({...data,savedAt:Date.now()}))}catch{}}

function addResize(renderer,camera){addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})}
