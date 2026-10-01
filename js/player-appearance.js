import * as THREE from 'three';

export const PLAYER_APPEARANCE_OPTIONS = Object.freeze([
  {id:'male',label:'Male',description:'Textured short hair, a navy overshirt, cream tee, chinos and sneakers.'},
  {id:'female',label:'Female',description:'Shoulder-length curls, a teal jacket, cream blouse, indigo trousers and ankle boots.'}
]);

/** Rebuild only the visitor's appearance; retain the avatar group and carried book. */
export function applyPlayerAppearance(world,choice='female') {
  if(!['male','female'].includes(choice))throw new Error('Choose male or female.');
  const avatar=world.playerAvatar;
  if(!avatar)throw new Error('Player avatar group is required.');
  for(const child of [...avatar.children]) {
    if(child.name.startsWith('Carried_Book_'))continue;
    avatar.remove(child);
    if(child.name==='PlayerAppearanceRoot')child.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();});
  }
  const female=choice==='female',root=new THREE.Group();root.name='PlayerAppearanceRoot';avatar.add(root);
  const material=color=>world.clayMaterial?world.clayMaterial(color,.78):new THREE.MeshStandardMaterial({color,roughness:.78});
  const skin=material(female?0x996444:0xa67450),earInside=material(0x80513e),hair=material(0x28201e),jacket=material(female?0x246d69:0x304d70),shirt=material(0xf5e6cb),pants=material(female?0x344763:0xb0916c),shoe=material(female?0x57372c:0xede9db),sole=material(0x303237),white=material(0xfff6e7),iris=material(0x644431),black=material(0x1d1715),lip=material(0x643b32),metal=material(0xc9a75d);
  const mesh=(parent,name,geometry,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geometry,mat);m.name=name;m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const ball=(p,n,mat,x,y,z,sx,sy,sz)=>mesh(p,n,new THREE.SphereGeometry(1,20,16),mat,x,y,z,sx,sy,sz);
  const box=(p,n,mat,x,y,z,w,h,d)=>mesh(p,n,new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const tube=(p,n,mat,points,r)=>mesh(p,n,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),20,r,8,false),mat,0,0,0);
  mesh(root,'Trousers_Waist',new THREE.CylinderGeometry(.18,.18,.16,18),pants,0,.86,0);
  mesh(root,'Jacket_Torso',new THREE.CylinderGeometry(female?.215:.245,.185,.51,20,1,false,Math.PI+.43,Math.PI*2-.86),jacket,0,1.175,0);
  mesh(root,'Cream_Shirt',new THREE.CylinderGeometry(female?.207:.237,.176,.49,20),shirt,0,1.175,0);
  for(const side of [-1,1]) {
    const lapel=box(root,'Jacket_Lapel_'+side,jacket,side*.102,1.295,female?-.193:-.218,.052,.23,.025);lapel.rotation.z=side*.17;
    const collar=box(root,'Shirt_Collar_'+side,shirt,side*.052,1.428,-.142,.09,.085,.025);collar.rotation.z=side*.45;
    box(root,'Jacket_Pocket_'+side,jacket,side*.15,1.075,-.164,.093,.084,.038);
  }
  for(const y of [1.12,1.24,1.36])ball(root,'Shirt_Button',metal,0,y,-(.176+(y-.93)/.49*((female?.207:.237)-.176))-.007,.012,.012,.006);
  box(root,'Belt',sole,0,.887,-.16,.32,.05,.04);box(root,'Belt_Buckle',metal,0,.887,-.187,.058,.038,.013);
  mesh(root,'Neck',new THREE.CylinderGeometry(.075,.08,.16,16),skin,0,1.49,0);
  ball(root,'Head',skin,0,1.695,-.005,.185,.235,.174);
  for(const side of [-1,1]) {
    ball(root,'Ear_'+side,skin,side*.185,1.686,0,.043,.067,.036);
    ball(root,'Ear_Inner_'+side,earInside,side*.207,1.686,-.018,.018,.036,.016);
    ball(root,'Eye_White_'+side,white,side*.073,1.718,-.164,.044,.027,.018);
    ball(root,'Iris_'+side,iris,side*.073,1.718,-.180,.020,.022,.006);
    ball(root,'Pupil_'+side,black,side*.073,1.718,-.186,.010,.013,.004);
    ball(root,'Eye_Highlight_'+side,white,side*.073-.006,1.726,-.191,.005,.006,.003);
    tube(root,'Eyebrow_'+side,hair,[[side*.038,1.767,-.16],[side*.075,1.781,-.157],[side*.11,1.77,-.145]],.010);
    ball(root,'Cheek_'+side,skin,side*.104,1.654,-.134,.046,.035,.012);
    if(female)ball(root,'Earring_'+side,metal,side*.20,1.619,-.005,.022,.026,.015);
  }
  ball(root,'Nose_Bridge',skin,0,1.687,-.174,.025,.050,.029);
  ball(root,'Nose_Tip',skin,0,1.668,-.194,.032,.022,.024);
  tube(root,'Smile',lip,[[-.051,1.622,-.158],[0,1.611,-.178],[.051,1.622,-.158]],.009);
  ball(root,'Lower_Lip',skin,0,1.599,-.163,.032,.009,.010);
  // Hair wraps the crown and sides, leaving both eyes and the mouth unobstructed.
  mesh(root,'Hair_Crown',new THREE.SphereGeometry(1,22,16,0,Math.PI*2,0,Math.PI*.50),hair,0,1.728,.012,.194,.205,.185);
  for(let i=0;i<(female?18:14);i++) {
    const a=i/(female?18:14)*Math.PI*2,x=Math.sin(a)*.166,z=Math.cos(a)*.152;
    ball(root,'Crown_Curl_'+i,hair,x,1.855+(i%3)*.012,z,.051,.049,.051);
  }
  if(female) {
    for(let side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<2;col++)
      ball(root,'Side_Curl_'+side+'_'+row+'_'+col,hair,side*(.173+Math.sin(row)*.018),1.78-row*.068,.035+col*.072,.055,.063,.058);
  } else {
    for(const side of [-1,1])ball(root,'Sideburn_'+side,hair,side*.166,1.754,.023,.027,.081,.088);
  }
  for(const [side,key] of [[-1,'L'],[1,'R']]) {
    const leg=new THREE.Group();leg.name='Player_Leg_'+key;leg.position.set(side*.108,.88,0);root.add(leg);world['pLeg'+key]=leg;
    mesh(leg,'Trouser_Leg_'+key,new THREE.CylinderGeometry(.083,.069,.69,16),pants,0,-.345,0);
    ball(leg,'Shoe_'+key,shoe,0,-.762,-.047,.088,.080,.156);
    box(leg,'Sole_'+key,sole,0,-.843,-.047,.17,.035,.286);
    if(!female)for(let i=0;i<3;i++)box(leg,'Lace_'+key+'_'+i,white,0,-.729,-.102-i*.022,.113,.011,.013);
    else mesh(leg,'Boot_Ankle_'+key,new THREE.CylinderGeometry(.075,.083,.12,14),shoe,0,-.663,0);
    const arm=new THREE.Group();arm.name='Player_Arm_'+key;arm.position.set(side*(female?.245:.275),1.414,0);root.add(arm);world['pArm'+key]=arm;
    mesh(arm,'Jacket_Sleeve_'+key,new THREE.CylinderGeometry(.075,.056,.38,16),jacket,0,-.19,0);
    mesh(arm,'Cuff_'+key,new THREE.CylinderGeometry(.058,.058,.055,14),shirt,0,-.387,0);
    ball(arm,'Hand_'+key,skin,0,-.465,-.006,.055,.071,.046);
    ball(arm,'Thumb_'+key,skin,-side*.044,-.449,-.025,.023,.037,.027);
  }
  root.userData.appearance=choice;avatar.userData.appearance=choice;world.playerAppearance=choice;
  return root;
}
