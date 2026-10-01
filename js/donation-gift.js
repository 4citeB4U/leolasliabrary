import * as THREE from 'three';

/** Compact desk-top gift box, preserving the existing donation interaction. */
export function replaceDonationGift(world) {
  const existing=world.scene.getObjectByName('Library_Donation_Gift');
  if(existing)return existing;
  const oldTarget=world.interactiveObjects.find(o=>o.userData?.type==='donation');
  if(!oldTarget)return null;
  const oldGroup=oldTarget.parent;
  if(!oldGroup || oldGroup===world.scene)return null;
  const gift=new THREE.Group();gift.name='Library_Donation_Gift';
  gift.position.copy(oldGroup.position);gift.rotation.copy(oldGroup.rotation);
  // Original chest extends .22 below its center, touching the counter. Preserve
  // that surface while reducing the body to .36 m high and a .68 x .48 m footprint.
  gift.position.y-=.04;
  const woodCanvas=document.createElement('canvas');woodCanvas.width=256;woodCanvas.height=256;
  const ctx=woodCanvas.getContext('2d');ctx.fillStyle='#9e2926';ctx.fillRect(0,0,256,256);
  for(let i=0;i<45;i++){ctx.strokeStyle=i%2?'rgba(69,12,9,.13)':'rgba(255,174,120,.08)';ctx.beginPath();ctx.moveTo(0,i*6);ctx.bezierCurveTo(80,i*6+3,180,i*6-3,256,i*6);ctx.stroke();}
  const texture=new THREE.CanvasTexture(woodCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  const redWood=new THREE.MeshStandardMaterial({map:texture,roughness:.76});
  const ribbon=world.clayMaterial(0xe7bf70,.5),dark=world.clayMaterial(0x72211d,.85);
  function box(w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;gift.add(mesh);return mesh;}
  const body=box(.68,.36,.48,0,0,0,redWood);body.name='Donation_Gift_Red_Wood_Body';
  box(.715,.065,.515,0,.188,0,redWood);
  box(.695,.018,.49,0,.151,0,dark);
  // Ribbon wraps across lid and down the two side faces, leaving text clear.
  box(.075,.012,.524,0,.227,0,ribbon);
  box(.722,.012,.073,0,.229,0,ribbon);
  for(const side of [-1,1])box(.012,.357,.073,side*.346,-.006,0,ribbon);
  for(const side of [-1,1])box(.075,.357,.012,0,-.006,side*.246,ribbon);
  for(const side of [-1,1]){
    const curve=new THREE.CatmullRomCurve3([[0,.245,0],[side*.13,.335,-.045],[side*.21,.32,.01],[side*.13,.25,.065],[0,.245,0]].map(p=>new THREE.Vector3(...p)));
    const loop=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.024,7,false),ribbon);loop.castShadow=true;gift.add(loop);
  }
  const knot=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),ribbon);knot.scale.set(1,.65,1);knot.position.set(0,.257,0);gift.add(knot);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=1024;labelCanvas.height=320;
  const label=labelCanvas.getContext('2d');label.fillStyle='#fff0cb';label.fillRect(0,0,1024,320);label.strokeStyle='#d4a654';label.lineWidth=12;label.strokeRect(8,8,1008,304);
  label.textAlign='center';label.fillStyle='#752521';label.font='bold 103px Georgia, serif';label.fillText('DONATIONS',512,132);
  label.font='54px Georgia, serif';label.fillText('Support your local library',512,235);
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.60,.188),new THREE.MeshStandardMaterial({map:labelTexture,roughness:.8}));plaque.position.set(0,-.012,.255);plaque.name='Donation_Gift_Message';gift.add(plaque);
  const oldObjects=new Set();oldGroup.traverse(o=>oldObjects.add(o));
  world.interactiveObjects=world.interactiveObjects.filter(o=>!oldObjects.has(o));
  world.scene.remove(oldGroup);world.scene.add(gift);
  const data={type:'donation',name:'Library donations',prompt:'Support your local library'};
  gift.traverse(o=>{if(o.isMesh){o.userData={...data};world.interactiveObjects.push(o);}});
  gift.userData={footprint:{width:.722,depth:.524},message:'DONATIONS / Support your local library'};
  return gift;
}
