import * as THREE from 'three';

/** Clickable reading chairs at the two actual study tables, separate from intake. */
export function installReadingSeats(world) {
  if(world.readingSeats)return world.readingSeats;
  const seats=[];
  const blue=new THREE.MeshStandardMaterial({color:0x219bff,emissive:0x086ce8,emissiveIntensity:.65,roughness:.45});
  world.studyGroup.children.forEach((table,index)=>{
    const chair=table.children.find(o=>o.isGroup&&Math.abs(o.position.x+1.4)<.01&&Math.abs(o.position.z-1.25)<.01);
    if(!chair)return;
    chair.position.z=2.15;chair.name=`Table_Reading_Chair_${index+1}`;
    const x=table.position.x+chair.position.x,z=table.position.z+chair.position.z;
    const approach=new THREE.Vector3(x,0,z+1.12);
    const data={type:'table-reading-seat',seatId:index,name:`Reading seat at table ${index+1}`,prompt:'Click the blue arrow or chair to sit and read'};
    const arrow=new THREE.Group();arrow.name=`Blue_Reading_Arrow_${index+1}`;arrow.position.set(x,2.65,z);arrow.visible=false;
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.35,.60,5),blue);tip.rotation.z=Math.PI;arrow.add(tip);
    const stem=new THREE.Mesh(new THREE.BoxGeometry(.21,.63,.21),blue);stem.position.y=.56;arrow.add(stem);world.scene.add(arrow);
    for(const group of [chair,arrow])group.traverse(o=>{if(o.isMesh){o.userData={...data};world.interactiveObjects.push(o);}});
    const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#095b9f';ctx.fillRect(0,0,512,128);ctx.fillStyle='#fff';ctx.font='bold 53px Georgia';ctx.textAlign='center';ctx.fillText('SIT & READ',256,84);
    const tex=new THREE.CanvasTexture(labelCanvas);tex.colorSpace=THREE.SRGBColorSpace;
    const label=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.35),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));label.position.set(0,1.04,0);label.userData={...data};arrow.add(label);world.interactiveObjects.push(label);
    world.solidObstacles.push({type:'box',minX:x-.4,maxX:x+.4,minZ:z-.4,maxZ:z+.4,name:chair.name});
    seats.push({id:index,chair,arrow,approach,eye:new THREE.Vector3(x,1.66,z),target:new THREE.Vector3(x,1.30,table.position.z),data});
  });
  const hint=document.createElement('p');hint.id='reading-seat-status';hint.setAttribute('role','status');hint.hidden=true;
  hint.style.cssText='position:fixed;left:50%;bottom:15px;transform:translateX(-50%);z-index:45;max-width:75vw;margin:0;padding:9px 14px;background:#07558fee;border:2px solid #73caff;border-radius:12px;color:white;font:14px Georgia;pointer-events:none';document.body.append(hint);
  function show(){const carrying=!!world.bookCarry?.selected;for(const seat of seats)seat.arrow.visible=carrying&&world.phase!=='seated';hint.hidden=!carrying||world.phase==='seated';if(!hint.hidden)hint.textContent='Look toward the study tables. Click either blue arrow to walk to a reading seat.';}
  function choose(id){const seat=seats.find(s=>s.id===id);if(!seat)return false;hint.hidden=false;hint.textContent='Walking to your reading chair…';const arrived=()=>{world.cancelWalking();world.seatStandPos=seat.approach.clone();world.playerPos.set(seat.eye.x,0,seat.eye.z);world.camera.position.copy(seat.eye);world.camera.lookAt(seat.target);world.yaw=world.camera.rotation.y;world.pitch=world.camera.rotation.x;world.phase='seated';world.playerAvatar.visible=false;for(const s of seats)s.arrow.visible=false;hint.textContent=world.bookCarry?.selected?'You are seated. Choose Open book to read. Press W or click the floor to stand.':'You are seated. Press W or click the floor to stand.';};
    if(world.playerPos.distanceTo(seat.approach)<.18){arrived();return true;}
    const started=world.startWalkingTo(seat.approach,arrived);if(!started)hint.textContent='The aisle is blocked. Move toward the blue arrow and click it again.';return started;
  }
  world.addEventListener('standup',()=>{hint.hidden=true;show();});
  world.readingSeats={seats,choose,show,hideHint(){hint.hidden=true;}};
  return world.readingSeats;
}
