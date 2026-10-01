import * as THREE from 'three';

// These local WebM copies preserve the existing MP4s' short, silent illustrated
// lesson previews, using VP9 for browser builds without an H264 decoder.
// Full narrated lessons may replace them after their media is approved.
export const WALL_VIDEO_LESSONS = Object.freeze([
  {src:'assets/decoded/lesson1.webm',title:'Holding Hook & Yarn'},
  {src:'assets/decoded/lesson2.webm',title:'Foundation Chains'},
  {src:'assets/decoded/lesson3.webm',title:'Single Crochet'}
]);

export function installWallVideoPlayer(world) {
  if(world.wallVideoPlayer)return world.wallVideoPlayer;
  let screen=world.movieBoothGroup?.getObjectByName('Movie_Booth_Live_Screen');
  if(!screen)world.movieBoothGroup?.traverse(o=>{
    if(o.isMesh && o.geometry?.type==='PlaneGeometry' && Math.abs(o.position.y-3.15)<.01 && Math.abs(o.position.z+36.49)<.01)screen=o;
  });
  if(!screen)throw new Error('Movie booth wall screen was not built.');
  screen.name='Movie_Booth_Live_Screen';
  // One centered viewing bench leaves the whole television in view. The old
  // alcove side cushions remain scenery and no longer trap viewers beside it.
  const bench=new THREE.Group();bench.name='Movie_Booth_Center_Bench';bench.position.set(0,0,-32.35);
  const oak=new THREE.MeshStandardMaterial({color:0x80502a,roughness:.78});
  const cushion=new THREE.MeshStandardMaterial({color:0x507956,roughness:.92});
  const brass=new THREE.MeshStandardMaterial({color:0xc6a15b,roughness:.55,metalness:.18});
  function benchPart(w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;bench.add(mesh);return mesh;}
  for(const x of [-1.08,1.08])for(const z of [-.32,.32])benchPart(.13,.59,.13,x,.345,z,oak);
  benchPart(2.58,.13,.96,0,.69,0,oak);
  const seatMesh=benchPart(2.46,.12,.84,0,.815,0,cushion);seatMesh.name='Movie_Booth_Center_Seat';
  for(const x of [-1.16,1.16])benchPart(.13,.89,.13,x,.955,.49,oak);
  for(const y of [1.08,1.31])benchPart(2.45,.16,.10,0,y,.49,oak);
  for(const x of [-1.21,1.21]){benchPart(.12,.3,.12,x,.90,0,oak);benchPart(.16,.10,.90,x,1.09,0,oak);}
  benchPart(.42,.13,.02,0,1.31,.555,brass);
  world.scene.add(bench);
  const seatData={type:'movie-booth-seat',name:'Center Movie Bench',prompt:'Sit here to watch the wall screen',walkTo:new THREE.Vector3(0,0,-30.8),seatPos:new THREE.Vector3(0,1.6,-32.35),seatLook:new THREE.Vector3(0,3.15,-36.49),standPos:new THREE.Vector3(0,0,-30.8)};
  const originalScreenData=screen.userData;
  const originalInteractions=world.interactiveObjects.filter(o=>o.userData?.type==='movie-booth-seat' || o.userData?.type==='movie-booth-screen');
  world.interactiveObjects=world.interactiveObjects.filter(o=>!originalInteractions.includes(o));
  seatMesh.userData={...seatData};world.interactiveObjects.push(seatMesh);
  screen.userData={...seatData,type:'movie-booth-screen',prompt:'Watch this wall screen from the center bench'};world.interactiveObjects.push(screen);
  bench.userData={seatData,collision:{minX:-1.4,maxX:1.4,minZ:-32.9,maxZ:-31.7}};
  const posterMaterial=screen.material;
  const video=document.createElement('video');video.id='wall-library-video';
  video.playsInline=true;video.preload='metadata';video.loop=true;video.hidden=true;
  video.setAttribute('aria-hidden','true');document.body.append(video);
  const texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
  const controls=document.createElement('section');controls.id='wall-video-controls';controls.hidden=true;
  controls.setAttribute('aria-label','Movie booth wall screen controls');
  controls.style.cssText='position:fixed;z-index:70;bottom:18px;left:50%;transform:translateX(-50%);width:min(560px,calc(100vw - 32px));box-sizing:border-box;padding:12px 15px;border:2px solid #b88a48;border-radius:16px;background:rgba(57,34,20,.96);color:#fff0ce;box-shadow:0 5px 20px #0005;font:15px Georgia,serif;';
  const heading=document.createElement('strong');heading.textContent='Movie booth · Playing on the wall';
  const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='margin:6px 0;font-size:13px';
  const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:7px';
  const select=document.createElement('select');select.setAttribute('aria-label','Choose wall-screen lesson');
  select.style.cssText='max-width:100%;padding:8px;background:#fff0d0;color:#422612;border-radius:8px';
  WALL_VIDEO_LESSONS.forEach((lesson,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`${index+1}. ${lesson.title}`;select.append(option);});
  function button(label,handler){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:8px 12px;border:1px solid #d1a866;border-radius:9px;background:#f4dfb1;color:#422612;font:inherit;cursor:pointer';b.addEventListener('click',handler);row.append(b);return b;}
  row.append(select);
  const toggle=button('Play',()=>{if(video.paused)play();else video.pause();});
  button('Stop',()=>{video.pause();try{video.currentTime=0;}catch{}status.textContent='Stopped. Choose Play to start the wall preview again.';});
  button('Hide controls',()=>{controls.hidden=true;reopen.hidden=false;});
  controls.append(heading,status,row);document.body.append(controls);
  const reopen=document.createElement('button');reopen.type='button';reopen.textContent='Wall video controls';reopen.hidden=true;
  reopen.style.cssText='position:fixed;z-index:70;right:18px;bottom:18px;padding:10px 16px;border:2px solid #b88a48;border-radius:18px;background:#4a2c19;color:#fff0ce;font:15px Georgia,serif;cursor:pointer';
  reopen.addEventListener('click',()=>{controls.hidden=false;reopen.hidden=true;});document.body.append(reopen);
  // Controls never steer the avatar or trigger click-to-walk behind the panel.
  for(const element of [controls,reopen])for(const type of ['pointerdown','pointerup','click','keydown','keyup','wheel'])element.addEventListener(type,event=>event.stopPropagation());
  let selected=0,disposed=false;
  function details(){return `${WALL_VIDEO_LESSONS[selected].title} · ${Number.isFinite(video.duration)?Math.round(video.duration)+'-second ':''}silent illustrated preview · loops on the wall while you explore.`;}
  function source(index){
    if(!Number.isInteger(index) || !WALL_VIDEO_LESSONS[index])throw new Error('Unknown wall-screen lesson.');
    selected=index;select.value=String(index);
    const url=new URL(WALL_VIDEO_LESSONS[index].src,document.baseURI);
    if(url.origin!==location.origin)throw new Error('Wall-screen lesson must use an approved local source.');
    video.src=url.href;video.load();status.textContent='Loading the local wall-screen preview…';
  }
  async function play(){
    if(disposed)return;
    if(!video.getAttribute('src'))source(selected);
    try{await video.play();status.textContent=details();}
    catch(error){status.textContent=error.name==='NotAllowedError'?'Press Play to start the video on the wall.':'This preview could not play. Choose another lesson or try again.';toggle.textContent='Play';}
  }
  video.addEventListener('loadeddata',()=>{screen.material=material;screen.userData.wallVideo=true;status.textContent=details();});
  video.addEventListener('play',()=>{toggle.textContent='Pause';status.textContent=details();});
  video.addEventListener('pause',()=>{toggle.textContent='Play';});
  video.addEventListener('error',()=>{status.textContent='This local preview is unavailable or could not be decoded. Choose another lesson.';screen.material=posterMaterial;toggle.textContent='Play';});
  select.addEventListener('change',()=>{source(Number(select.value));play();});
  const api={
    video,texture,screen,controls,bench,seat:seatMesh,seatData,
    open(){controls.hidden=false;reopen.hidden=true;return play();},
    play,
    pause(){video.pause();},
    stop(){video.pause();try{video.currentTime=0;}catch{}status.textContent='Stopped.';},
    select(index){source(index);return play();},
    hideControls(){controls.hidden=true;reopen.hidden=false;},
    dispose(){disposed=true;video.pause();video.removeAttribute('src');video.load();video.remove();controls.remove();reopen.remove();screen.material=posterMaterial;screen.userData=originalScreenData;world.interactiveObjects=world.interactiveObjects.filter(o=>o!==screen&&o!==seatMesh);world.interactiveObjects.push(...originalInteractions);bench.removeFromParent();bench.traverse(o=>o.geometry?.dispose());oak.dispose();cushion.dispose();brass.dispose();texture.dispose();material.dispose();delete world.wallVideoPlayer;}
  };
  world.wallVideoPlayer=api;
  return api;
}
