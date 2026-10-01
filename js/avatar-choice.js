import * as THREE from 'three';
import { applyPlayerAppearance } from './player-appearance.js';
const STORAGE='leola-player-appearance-v1';
export function installAvatarChoice(world){
  const dialog=document.createElement('dialog');dialog.id='player-choice';dialog.setAttribute('aria-labelledby','player-choice-title');
  dialog.innerHTML='<h1 id="player-choice-title">Choose your library character</h1><p>Pick a character to explore, read, and play.</p><div class="navigation-quick-guide"><strong>Welcome to your 3D library</strong><p>Drag with your mouse or finger to look up, down, left, and right. Click or tap the ground where you want to walk. Explore the scenery. Carrying a book? Follow a blue arrow to a reading chair.</p></div><div class="player-preview"></div><div class="player-options" role="group" aria-label="Character"><button type="button" data-appearance="female">Female</button><button type="button" data-appearance="male">Male</button></div><button type="button" class="player-enter">Enter the library</button><p class="player-choice-note">You can change this later in Library tools.</p>';
  document.body.append(dialog);let selected='female',renderer=null,preview=null,scene=null,camera=null,frame=0,initial=true,lastFocus=null;
  const stage=dialog.querySelector('.player-preview'),enter=dialog.querySelector('.player-enter');
  function choose(value){selected=value;dialog.querySelectorAll('[data-appearance]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appearance===value)));if(preview)applyPlayerAppearance(preview,value);}
  function render(){if(!dialog.open)return;frame=requestAnimationFrame(render);if(preview)preview.playerAvatar.rotation.y=Math.sin(performance.now()*.00035)*.16;renderer?.render(scene,camera);}
  function createPreview(){
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(300,330);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.setAttribute('aria-label','Preview of your selected character');stage.append(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,300/330,.1,30);camera.position.set(0,1.25,-3.7);camera.lookAt(0,1,0);
    scene.add(new THREE.HemisphereLight(0xfff7e8,0x657585,2.4));const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(3,5,4);scene.add(key);
    preview={playerAvatar:new THREE.Group(),cameraMode:'third_person',clayMaterial:(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness})};scene.add(preview.playerAvatar);choose(selected);render();
  }
  function disposePreview(){cancelAnimationFrame(frame);scene?.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer?.dispose();renderer?.forceContextLoss();stage.replaceChildren();renderer=null;scene=null;preview=null;}
  function close(){dialog.close();disposePreview();lastFocus?.focus?.();}
  function show(){lastFocus=document.activeElement;world.cancelWalking();world.keys.clear();if(dialog.open)return;dialog.showModal();createPreview();dialog.querySelector(`[data-appearance="${selected}"]`).focus();}
  function commit(){applyPlayerAppearance(world,selected);try{localStorage.setItem(STORAGE,selected);}catch{}initial=false;close();}
  for(const b of dialog.querySelectorAll('[data-appearance]'))b.onclick=()=>choose(b.dataset.appearance);
  enter.onclick=commit;dialog.addEventListener('cancel',event=>{if(initial)event.preventDefault();else{event.preventDefault();close();}});
  for(const event of ['keydown','keyup','pointerdown','pointerup','click','wheel'])dialog.addEventListener(event,e=>e.stopPropagation());
  function attachMenu(){const tools=document.querySelector('#library-tools');if(!tools||tools.querySelector('.change-character'))return;const b=document.createElement('button');b.className='change-character';b.textContent='Change character';b.onclick=()=>{tools.open=false;show();};tools.append(b);}
  let saved;try{saved=localStorage.getItem(STORAGE);}catch{}if(['male','female'].includes(saved)){selected=saved;initial=false;applyPlayerAppearance(world,selected);}else{applyPlayerAppearance(world,selected);show();}
  world.avatarChoice={show,choose,commit,attachMenu,dialog,get selected(){return selected;}};return world.avatarChoice;
}
