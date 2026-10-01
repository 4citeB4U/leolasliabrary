import * as THREE from 'three';
import { PublishingCatalog } from './publishing-catalog.js';

export async function installBookCarry(world) {
  const books=await new PublishingCatalog().books();
  const titles=new Map(books.map(b=>[b.id,b]));
  const aliases={needle:'needle-and-yarn',crochet:'crochet-mastery','book-needle':'needle-and-yarn','book-crochet':'crochet-mastery'};
  const textureLoader=new THREE.TextureLoader(), textures=new Map(), deskBooks=new Map();
  const cream=new THREE.MeshStandardMaterial({color:0xfff8e6,roughness:.86});
  const binding=new THREE.MeshStandardMaterial({color:0x704324,roughness:.7});
  const tray=document.createElement('section');tray.id='carried-book';tray.hidden=true;tray.setAttribute('aria-label','Your carried book');
  const cover=document.createElement('img');cover.alt='';
  const title=document.createElement('span');title.className='carried-book-title';title.setAttribute('aria-live','polite');
  const openButton=document.createElement('button');openButton.textContent='Open book';
  const returnButton=document.createElement('button');returnButton.textContent='Return';
  tray.append(cover,title,openButton,returnButton);document.body.append(tray);
  let selected=null,held=null,pickedAt=0;
  if(!world.camera.parent)world.scene.add(world.camera);
  function model(book){
    const g=new THREE.Group();g.name='Book_Model_'+book.id;
    const tex=textures.get(book.id),image=tex?.image,aspect=image?.width/image?.height||.7,h=.85,w=h*aspect;
    const pages=new THREE.Mesh(new THREE.BoxGeometry(w-.024,h-.024,.055),cream);g.add(pages);
    for(const z of [-.035,.035]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.012),binding);m.position.z=z;g.add(m);}
    const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.74}));face.position.z=.042;face.name='Book_Cover_'+book.id;g.add(face);
    const spine=new THREE.Mesh(new THREE.BoxGeometry(.016,h,.08),binding);spine.position.x=-w/2;g.add(spine);
    g.userData.bookId=book.id;return g;
  }
  for(const book of books.filter(b=>['needle-and-yarn','crochet-mastery'].includes(b.id))){
    try{const tex=await textureLoader.loadAsync(book.cover.front);tex.colorSpace=THREE.SRGBColorSpace;textures.set(book.id,tex);}catch(e){console.error('Book cover unavailable',book.id,e);continue;}
    const type=book.id==='needle-and-yarn'?'book-needle':'book-crochet';
    const old=world.interactiveObjects.find(o=>o.userData.type===type)?.parent;
    if(old){
      const descendants=new Set();old.traverse(o=>descendants.add(o));world.interactiveObjects=world.interactiveObjects.filter(o=>!descendants.has(o));
      old.clear();const object=model(book);object.rotation.x=-Math.PI/2;old.add(object);deskBooks.set(book.id,old);
      object.traverse(o=>{if(o.isMesh){o.userData={type,bookId:book.id,prompt:'Pick up '+book.title};world.interactiveObjects.push(o);}});
    }
  }
  function returnBook(){
    if(selected)deskBooks.get(selected.id)?.traverse(o=>{o.visible=true;});
    if(held){held.removeFromParent();held.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==cream&&o.material!==binding)o.material.dispose();});held=null;}
    selected=null;tray.hidden=true;world.readingSeats?.show();world.authorLibrary?.arrows.forEach(a=>{a.visible=!!world.authorIntakePending;});
  }
  function pickup(id){
    id=aliases[id]||id;const book=titles.get(id);if(!book||!textures.has(id))return false;
    if(selected?.id===id)return true;
    world.librarianConversations?.close();world.cancelWalking();returnBook();selected=book;
    const original=deskBooks.get(id);if(original)original.visible=false;
    held=model(book);held.name='Carried_Book_'+id;world.camera.add(held);pickedAt=performance.now();
    cover.src=book.cover.front;cover.alt=book.title+' cover';title.textContent=book.title;tray.hidden=false;
    world.authorLibrary?.arrows.forEach(a=>{a.visible=!!world.authorIntakePending;});world.readingSeats?.show();update();return true;
  }
  function update(){
    if(!held)return;
    const third=world.cameraMode==='third_person',parent=third?world.playerAvatar:world.camera;
    if(held.parent!==parent)parent.add(held);
    if(third){held.scale.setScalar(.58);held.position.set(.32,1.0,-.3);held.rotation.set(-.2,Math.PI,-.12);}
    else{const progress=Math.min(1,(performance.now()-pickedAt)/300);held.scale.setScalar(.28);held.position.set(.27,-.20-(1-progress)*.18,-.57);held.rotation.set(-.12,-.24,-.1);}
    held.visible=!document.querySelector('#reader-modal-backdrop.active, dialog.illustrated-book-dialog[open]');
  }
  openButton.onclick=()=>{if(selected)window.openBookReader(selected.id);};
  returnButton.onclick=returnBook;
  world.bookCarry={pickup,returnBook,update,deskBooks,get selected(){return selected;},get held(){return held;},tray};
  return world.bookCarry;
}
