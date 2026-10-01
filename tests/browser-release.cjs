/* REGION: LEOLA.VERIFICATION | TAG: 3D.LIBRARY.ACCEPTANCE.V2
WHAT: native browser proof for the current 3D library, illustrated reader, training, and Game House.
WHO: LeeWay. WHY: release claims require runtime evidence. WHERE: local/CI Chromium.
WHEN: 2026-09-29. HOW: Playwright + deterministic local HTTP server. LICENSE: MIT.
No payment submission, audible voice-quality, cloud membership, or physical-crochet claim. */
const { chromium }=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-evidence'); fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[]; let browser,server;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.b64':'text/plain; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
function check(name,value){checks.push({name,pass:Boolean(value)});assert.ok(value,name)}
async function checkVoicePill(page,label){const state=await page.evaluate(()=>{const pill=document.querySelector('#btn-toggle-voice'),r=pill.getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {inside:r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:pill===hit||pill.contains(hit),separate:r.top>=h.bottom||r.bottom<=h.top||r.left>=h.right||r.right<=h.left};});check(label+' voice control is visible, clickable and clear of header',state.inside&&state.hit&&state.separate);}
function start(){return new Promise(ok=>{server=http.createServer((req,res)=>{try{const n=decodeURIComponent(new URL(req.url,'http://x').pathname),p=path.resolve(root,n==='/'?'index.html':n.slice(1));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(p).pipe(res)}catch{res.writeHead(500);res.end('Read failed')}}).listen(0,'127.0.0.1',()=>ok('http://127.0.0.1:'+server.address().port+'/'))})}
(async()=>{const base=process.env.LEOLA_TEST_URL||await start();
browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
const p=await ctx.newPage();if(process.env.LEOLA_FAST_CHECK==='1')p.screenshot=async()=>Buffer.alloc(0);p.on('pageerror',e=>errors.push(e.message));
await p.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
check('Correct library identity',(await p.title()).includes("Leola's Learning Library"));
await p.waitForFunction(()=>window.__world3D?.sailboats?.length===9,{timeout:60000});
check('3D world canvas present',await p.locator('#clay-game-world-canvas').count()===1);
if(await p.locator('#onboarding-modal.active').count())await p.locator('#btn-onboarding-cancel').click();
await checkVoicePill(p,'Desktop');
const desktopCanvas=await p.locator('#clay-game-world-canvas').screenshot();
check('Desktop WebGL canvas screenshot is nonblank',desktopCanvas.length>5000&&new Set(desktopCanvas).size>100);
const scene=await p.evaluate(()=>({museum:!!window.__world3D.scene.getObjectByName('Milwaukee_Waterfront_Museum_3D'),panorama:!!window.__world3D.scene.getObjectByName('Milwaukee_Clay_Panorama'),buildings:[1,2,3,4,5].map(i=>!!window.__world3D.scene.getObjectByName('Milwaukee_Background_Building_'+i)),boats:window.__world3D.sailboats.map(b=>({x:b.position.x,z:b.position.z}))}));
check('3D waterfront museum present',scene.museum);check('Static panorama absent',!scene.panorama);check('Five 3D background buildings present',scene.buildings.every(Boolean));
await p.waitForTimeout(2600);const later=await p.evaluate(()=>window.__world3D.sailboats.map(b=>({x:b.position.x,z:b.position.z})));
check('All nine harbor and playground sailboats move',scene.boats.every((b,i)=>Math.hypot(later[i].x-b.x,later[i].z-b.z)>0.05));
const shore=await p.evaluate(()=>{const w=window.__world3D,g=w.scene.getObjectByName('Continuous_Shoreline_Riprap');return {edges:g.userData.edges,rocks:g.userData.boulders,shops:w.scene.children.filter(o=>o.name.startsWith('Waterfront_Business_')).length,land:!!w.scene.getObjectByName('Downtown_Raised_Land'),street:!!w.scene.getObjectByName('Downtown_Street'),boats:w.sailboats.filter(b=>!b.name.startsWith('Playground_Sailboat_')).map(b=>b.userData.harborMotion)};});
check('Six boats remain beyond the museum in camera-left open water',shore.boats.length>=6&&shore.boats.every(b=>b.baseX-b.radiusX>64)&&shore.boats.filter(b=>b.baseZ-b.radiusZ>71).length>=6);
check('Downtown buildings have raised land, streets and six businesses',shore.land&&shore.street&&shore.shops===6);
check('Boulders trace exposed shoreline only',shore.edges.length>10&&shore.rocks.length>100&&shore.rocks.every(p=>shore.edges.some(([ax,az,bx,bz])=>{const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.z-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-ax-dx*t,p.z-az-dz*t)<0.50;})));
await p.waitForFunction(()=>window.__world3D?.trafficCars?.length===8,{timeout:60000});
const trafficStart=await p.evaluate(()=>{const all=[];window.__world3D.scene.traverse(o=>{if(o.name?.startsWith('Street_Car_'))all.push(o.name)});return {cars:window.__world3D.trafficCars.map(car=>({x:car.position.x,z:car.position.z,rotation:car.rotation.y,direction:car.userData.streetTraffic.direction,distance:car.userData.streetTraffic.routeDistance,span:window.__world3D.cityStreetRoute.length,scale:car.scale.x,name:car.name})),all};});
check('All eight cars are registered street traffic',trafficStart.cars.length===8&&trafficStart.all.length===8&&trafficStart.cars.every(car=>car.name.startsWith('Street_Car_')));
check('Cars stay in the two curved street lanes',await p.evaluate(()=>{const w=window.__world3D,r=w.cityStreetRoute;return w.trafficCars.every(c=>{const t=c.userData.streetTraffic,q=r.sample(t.routeDistance,t.direction*r.sample(t.routeDistance).halfWidth*0.5);return Math.hypot(c.position.x-q.x,c.position.z-q.z)<0.001;});}));
check('Street cars are scaled for the panoramic scene',trafficStart.cars.every(car=>car.scale<=0.7));
await p.waitForTimeout(2000);
const trafficLater=await p.evaluate(()=>window.__world3D.trafficCars.map(car=>({x:car.position.x,z:car.position.z,rotation:car.rotation.y,distance:car.userData.streetTraffic.routeDistance})));
check('Opposing traffic passes through without reversing',new Set(trafficStart.cars.map(c=>c.direction)).size===2&&trafficStart.cars.every((car,i)=>{let dz=trafficLater[i].distance-car.distance;if(Math.abs(dz)>car.span/2)dz-=Math.sign(dz)*car.span;return dz*car.direction>0.2;}));
const groundAndTree=await p.evaluate(()=>({
  grass:!!window.__world3D.scene.getObjectByName('Milwaukee_West_Grass'),
  street:!!window.__world3D.scene.getObjectByName('Milwaukee_City_Street'),
  streetLength:window.__world3D.cityStreetRoute.length,
  sidewalk:!!window.__world3D.scene.getObjectByName('Milwaukee_City_Sidewalk'),
  outerSidewalk:!!window.__world3D.scene.getObjectByName('Milwaukee_West_Outer_Sidewalk'),
  eastStreet:!!window.__world3D.scene.getObjectByName('Milwaukee_East_City_Street'),
  eastParkSidewalk:!!window.__world3D.scene.getObjectByName('Milwaukee_East_Park_Sidewalk'),
  eastGrass:!!window.__world3D.scene.getObjectByName('Milwaukee_East_Grass'),
  westConnector:!!window.__world3D.scene.getObjectByName('West_Boardwalk_Sidewalk_Connector'),
  eastConnector:!!window.__world3D.scene.getObjectByName('East_Boardwalk_Sidewalk_Connector'),
  boardwalkWidth:window.__world3D.scene.getObjectByName('Harbor_Boardwalk_Deck')?.geometry?.parameters?.width,
  eastPanorama:[1,2,3].some(i=>!!window.__world3D.scene.getObjectByName('Milwaukee_East_Panoramic_Building_'+i)),
  lighthouse:!!window.__world3D.scene.getObjectByName('Milwaukee_Lighthouse'),
  lighthouseTrees:[1,2,3,4,5,6].filter(i=>window.__world3D.scene.getObjectByName('Lighthouse_Landscape_Tree_'+i)).length,
  tree:!!window.__world3D.scene.getObjectByName('Courtyard_Shade_Tree'),
  treeSolid:window.__world3D.solidObstacles.some(o=>o.name==='Courtyard Shade Tree'),
  mallX:window.__world3D.scene.getObjectByName('The_Avenue_Mall')?.position.x,
  oldBridge:!!window.__world3D.scene.getObjectByName('West_Grass_Garden_Bridge'),
  climbX:window.__world3D.barnabySquirrel.climbFace.x,
  climbZ:window.__world3D.barnabySquirrel.climbFace.z,
  treeX:window.__world3D.scene.getObjectByName('Courtyard_Shade_Tree').position.x
}));
check('Grass, street and sidewalk are separate surfaces',groundAndTree.grass&&groundAndTree.street&&groundAndTree.sidewalk);
check('Single street extends through the full city corridor',groundAndTree.outerSidewalk&&!groundAndTree.eastStreet&&groundAndTree.streetLength>600);
check('Lighthouse side stays grass with a concrete walking path',groundAndTree.eastParkSidewalk&&groundAndTree.eastGrass);
check('Boardwalk terminates at concrete side connectors',groundAndTree.westConnector&&groundAndTree.eastConnector&&groundAndTree.boardwalkWidth<=34.1);
check('Lighthouse stands among trees without rectangular side blocks',!groundAndTree.eastPanorama&&groundAndTree.lighthouse&&groundAndTree.lighthouseTrees>=3);
check('Mall replaces old wooden bridge west of the street',groundAndTree.mallX<-34&&!groundAndTree.oldBridge);
check('Shade tree is visible and solid',groundAndTree.tree&&groundAndTree.treeSolid);
check('Squirrel climbs on the bark surface, not trunk center',Math.hypot(groundAndTree.climbX-groundAndTree.treeX,groundAndTree.climbZ-17)>1.2);
const barnabyFade=await p.evaluate(()=>{window.__world3D.updateBarnabySquirrel(13.5);return {y:window.__world3D.barnabySquirrel.group.position.y,opacity:window.__world3D.barnabySquirrel.fadeMaterials[0].opacity};});
check('Squirrel reaches branches before fading',barnabyFade.y>4&&barnabyFade.opacity<0.75);
const walkerRoute=await p.evaluate(()=>{const w=window.__world3D,samples=[];for(let step=0;step<600;step++){w.updatePromenadeNPCs(0.5);w.promenadeNPCs.filter(n=>n.routeType!=='museum').forEach(n=>samples.push({x:n.group.position.x,z:n.group.position.z,visible:n.group.visible}));}return samples;});
check('Walkers remain visible on boardwalk and concrete perimeter',walkerRoute.every(({x,z,visible})=>visible&&((z>=24.2&&z<=27.1&&Math.abs(x)<=17.1)||(z>=22&&z<=25.8&&Math.abs(x)>=16.3&&Math.abs(x)<=18.7)||(Math.abs(Math.abs(x)-18.5)<=1.7&&z>=-39.2&&z<=24.2)||(Math.abs(z+39)<=0.3&&Math.abs(x)<=18.7))));
const visitors=await p.evaluate(()=>{const w=window.__world3D,samples=[],city=[];for(let step=0;step<600;step++){w.updatePromenadeNPCs(0.5);w.promenadeNPCs.filter(n=>n.routeType==='museum').forEach(n=>samples.push({x:n.group.position.x,z:n.group.position.z,visible:n.group.visible}));w.citySidewalkNPCs.forEach(n=>city.push({routeError:Math.hypot(n.group.position.x-w.cityStreetRoute.sample(n.streetDistance,-w.cityStreetRoute.sample(n.streetDistance).halfWidth-w.cityStreetRoute.sample(n.streetDistance).sidewalkWidth/2).x,n.group.position.z-w.cityStreetRoute.sample(n.streetDistance,-w.cityStreetRoute.sample(n.streetDistance).halfWidth-w.cityStreetRoute.sample(n.streetDistance).sidewalkWidth/2).z),x:n.group.position.x,z:n.group.position.z,scale:n.group.scale.x,visible:n.group.visible}));}return {samples,city};});
check('Museum visitors follow sidewalk, quay and boathouse entry',visitors.samples.length>0&&visitors.samples.every(({x,z,visible})=>visible&&((x>=-23&&x<=-20&&z>=25&&z<=71)||(x>=-22.5&&x<=4.5&&z>=68&&z<=71)||(x>=2.5&&x<=5.5&&z>=62.5&&z<=70.5)))&&visitors.samples.some(n=>n.x>3&&n.z<65));
check('Distant city walkers stay smaller on the outer sidewalk',visitors.city.length>0&&visitors.city.every(n=>n.visible&&n.routeError<0.001&&n.scale<0.8&&Math.abs(n.z)<=240));
const sky=await p.evaluate(()=>{const w=window.__world3D;w.updateSkyElements(0,0);const first=w.skyClouds.map(c=>c.position.clone());w.updateSkyElements(0,30);return {drifts:w.skyClouds.map((c,i)=>c.position.distanceTo(first[i])),birds:w.flyingBirds.map(b=>({flock:b.userData.flock,y:b.position.y,pivots:b.children.filter(c=>['Left_Wing','Right_Wing'].includes(c.name)).length,connected:b.userData.wingL.parent===b&&b.userData.wingR.parent===b&&b.userData.wingL.children.length===2&&b.userData.wingR.children.length===2}))};});
check('Twenty-two clouds drift across the waterfront and library',sky.drifts.length===22&&sky.drifts.every(d=>d>0.05&&d<10));
check('Ten birds have exactly two connected wing pivots',sky.birds.length===10&&sky.birds.every(b=>b.pivots===2&&b.connected));
check('Individual birds fly lower than the distant flock',sky.birds.filter(b=>!b.flock).length===4&&sky.birds.filter(b=>b.flock).length===6&&Math.max(...sky.birds.filter(b=>!b.flock).map(b=>b.y))<Math.min(...sky.birds.filter(b=>b.flock).map(b=>b.y)));
const worldSource=fs.readFileSync(path.join(root,'js/world-3d.js'),'utf8');
check('One animation owner updates the sky each frame',(worldSource.match(/this\.updateSkyElements\(dt,\s*time\)/g)||[]).length===1&&(worldSource.match(/this\.flyingBirds\??\.forEach/g)||[]).length===1);
const orientation=await p.evaluate(()=>{const w=window.__world3D;window.__testOriginalMovement=w.updateMovement;w.setCameraMode('first_person');w.updateMovement=()=>{};w.camera.position.set(0,1.8,22);w.camera.rotation.set(-0.05,Math.PI,0,'YXZ');w.camera.updateMatrixWorld(true);const point=w.camera.position.clone().set(-27,0.055,90).project(w.camera),water=w.scene.getObjectByName('Lake_Michigan_Water');return {right:point.x,depth:point.z,waterLeft:water.position.x-water.geometry.parameters.width/2};});
check('Starting waterfront view places the continuous road on screen right',orientation.right>0&&orientation.right<1&&orientation.depth>-1&&orientation.depth<1);
check('Lake stops before the city sidewalk and street',orientation.waterLeft>=-20);
const playground=await p.evaluate(()=>{const w=window.__world3D,park=w.scene.getObjectByName('Lighthouse_Childrens_Park'),sand=w.scene.getObjectByName('Playground_Contained_Sand_Border'),land=w.scene.getObjectByName('Milwaukee_East_Grass_Base'),water=w.scene.getObjectByName('Playground_Open_Lake'),approach=w.scene.getObjectByName('Playground_Approach');w.scene.updateMatrixWorld(true);const names=['Playground_Two_Swings','Playground_Blue_Roof_Slide','Playground_Seesaw','Playground_Climbing_Arch'],equipment=names.map(n=>w.scene.getObjectByName(n)),vertices=[];equipment.forEach(g=>g?.traverse(o=>{const attr=o.geometry?.attributes?.position;if(attr)for(let i=0;i<attr.count;i++){const v=w.camera.position.clone().fromBufferAttribute(attr,i);o.localToWorld(v);park.worldToLocal(v);vertices.push(v.x*v.x/(9.5*9.5)+v.z*v.z/(6.1*6.1));}}));const footprint=[];const attr=sand.geometry.attributes.position;for(let i=0;i<attr.count;i++){const v=w.camera.position.clone().fromBufferAttribute(attr,i);sand.localToWorld(v);footprint.push({x:v.x,z:v.z});}const hx=land.geometry.parameters.width/2,hz=land.geometry.parameters.height/2,whx=water.geometry.parameters.width/2,whz=water.geometry.parameters.height/2;return {equipment:equipment.every(Boolean),vertexCount:vertices.length,equipmentContained:vertices.every(v=>v<=1.01),grounded:footprint.every(v=>Math.abs(v.x-land.position.x)<=hx&&Math.abs(v.z-land.position.z)<=hz),approachJoins:approach.position.x+approach.geometry.parameters.width/2>=Math.min(...footprint.map(v=>v.x)),boats:w.sailboats.filter(b=>b.name.startsWith('Playground_Sailboat_')).map(b=>{const m=b.userData.harborMotion;return Math.abs(m.baseX-water.position.x)+m.radiusX+3<whx&&Math.abs(m.baseZ-water.position.z)+m.radiusZ+3<whz;}),swings:w.parkSwings.map(s=>s.rotation.x)};});
check('Reference playground contains swings, slide, seesaw and climbing arch',playground.equipment&&playground.vertexCount>100);
check('Play equipment stays inside sand border on grass',playground.equipmentContained&&playground.grounded);
check('Playground concrete approach joins the sand border',playground.approachJoins);
check('Three playground boats stay within the open lake backdrop',playground.boats.length===3&&playground.boats.every(Boolean));
const swingFrames=[playground.swings];for(let frame=0;frame<8;frame++){await p.waitForTimeout(300);swingFrames.push(await p.evaluate(()=>window.__world3D.parkSwings.map(s=>s.rotation.x)));}
check('Both playground swings move gently',swingFrames.every(f=>f.length===2&&f.every(a=>Math.abs(a)<=0.141))&&[0,1].every(i=>Math.max(...swingFrames.map(f=>f[i]))-Math.min(...swingFrames.map(f=>f[i]))>0.01));
await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'waterfront-spawn.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.rotation.set(-0.05,2.3,0,'YXZ');});
await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'city-side-player-view.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(-7,5,29);w.camera.lookAt(-27,2,85);});
await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'right-through-street.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(15,5,9);w.camera.lookAt(43,7,17);});
await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'lighthouse-landscape.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(26,3.2,-4);w.camera.lookAt(43,1.4,-4);});
await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'lighthouse-playground.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(30,4,17);w.camera.lookAt(43,1.4,-4);});
await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'playground-from-lighthouse.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.setCameraMode('first_person');w.updateMovement=()=>{};w.camera.position.set(-8,9,29);w.camera.lookAt(-27,0,-6);});
await p.waitForTimeout(500);await p.screenshot({path:path.join(out,'street-traffic.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(0,34,39);w.camera.lookAt(0,0,-6);});
await p.waitForTimeout(300);await p.screenshot({path:path.join(out,'sidewalk-route.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(0,8,35);w.camera.lookAt(0,0,6);});
await p.waitForTimeout(300);await p.screenshot({path:path.join(out,'boardwalk-transition.png'),fullPage:false});
const squirrelFrame=await p.evaluate(()=>{const w=window.__world3D;w.updateBarnabySquirrel(11.8);w.updateBarnabySquirrel=()=>{};w.updateMovement=()=>{};w.camera.position.set(-6.5,2.2,11.5);w.camera.lookAt(w.barnabySquirrel.group.position);w.camera.updateMatrixWorld(true);const ndc=w.barnabySquirrel.group.position.clone().project(w.camera);return {visible:w.barnabySquirrel.group.visible,x:ndc.x,y:ndc.y};});
check('Squirrel is visibly framed outside the tree',squirrelFrame.visible&&Math.abs(squirrelFrame.x)<0.8&&Math.abs(squirrelFrame.y)<0.8);
await p.waitForTimeout(300);
await p.screenshot({path:path.join(out,'squirrel-climb.png'),fullPage:false});
await p.evaluate(()=>{const w=window.__world3D;w.camera.position.set(0,1.8,22);w.camera.lookAt(0,1.2,4);});
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
await checkVoicePill(p,'Mobile');
const mobileCanvas=await p.locator('#clay-game-world-canvas').screenshot();
check('Mobile WebGL canvas screenshot is nonblank',mobileCanvas.length>5000&&new Set(mobileCanvas).size>100);await p.screenshot({path:path.join(out,'mobile-library.png'),fullPage:false});
await p.setViewportSize({width:1440,height:960});
await p.evaluate(()=>{window.__world3D.updateMovement=window.__testOriginalMovement;});
// The obsolete teleport buttons are removed; visitors use floor navigation and doors.
check('Obsolete park and exit shortcut buttons are absent',await p.locator('[data-teleport="playground"],.exit-library-button').count()===0);
const doorTrips=await p.evaluate(()=>{
 const w=window.__world3D;w.keys.clear();w.phase='inside';w.playerPos.set(0,0,-2.8);w.camera.position.set(0,1.8,-2.8);
 const trips=[];
 for(let trip=0;trip<4;trip++){
  w.handleObjectInteraction({type:'doors'});
  for(let i=0;i<100;i++){w.updateDoors(0.05);w.updateMovement(0.05);}
  trips.push({phase:w.phase,z:w.playerPos.z});
 }
 return trips;
});
check('Door clicks repeatedly exit and re-enter the library',doorTrips.every((s,i)=>i%2===0?s.phase==='outside'&&s.z>8:s.phase==='inside'&&s.z<0));
const seatedExit=await p.evaluate(async()=>{const w=window.__world3D,T=await import('three');w.sitDownInMovieBooth();w.wallVideoPlayer.pause();let oldCallback=false;w.onArriveCallback=()=>{oldCallback=true;};w.startWalkingTo(new T.Vector3(0,0,10));for(let i=0;i<1800&&w.walkTarget;i++){w.updateMovement(.05);w.updateDoors(.05);}return {phase:w.phase,z:w.playerPos.z,pending:!!w.walkTarget||!!w.onArriveCallback,oldCallback};});
check('Natural walking leaves cinema seat through library doors and cancels old callback',seatedExit.phase==='outside'&&seatedExit.z>8&&!seatedExit.pending&&!seatedExit.oldCallback);
await p.locator('#btn-camera-third').click({noWaitAfter:true,timeout:60000});check('Third-person camera switches',await p.evaluate(()=>window.__world3D.cameraMode==='third_person'));
await p.locator('#btn-camera-first').click({noWaitAfter:true,timeout:60000});check('First-person camera switches',await p.evaluate(()=>window.__world3D.cameraMode==='first_person'));
await p.evaluate(()=>window.openBookReader('needle-and-yarn'));
await p.waitForFunction(()=>window.__world3D.illustratedBookReader?.isOpen&&window.__world3D.illustratedBookReader.manifest?.pages.length===33);
check('Needle & Yarn uses33illustrated pages and six chapter markers',await p.evaluate(()=>{const m=window.__world3D.illustratedBookReader.manifest;return m.pages.length===33&&m.chapters.length===6&&m.cover.endsWith('/cover.jpg')&&m.chapters[5].pageIndex===28;}));
check('Illustrated book opens at cover',await p.evaluate(()=>window.__world3D.illustratedBookReader.pageIndex===0));
await p.evaluate(()=>window.__world3D.illustratedBookReader.next());
check('Reader turns to first interior page',await p.evaluate(()=>window.__world3D.illustratedBookReader.pageIndex===1));
await p.screenshot({path:path.join(out,'waterfront-library.png'),fullPage:false});
await p.goto(base+'training.html',{waitUntil:'domcontentloaded'});check('Training route identifies video lessons',(await p.title()).includes('Video Lessons'));check('Training presents current lesson archive state',await p.locator('.video-placeholder').count()===1);
await p.goto(base+'game-house.html',{waitUntil:'domcontentloaded',timeout:60000});
check('Game House route identity',(await p.title()).includes('3D Game House'));
check('Game House catalogs five game rooms',await p.locator('.game-card-clay').count()===5);
check('All five game rooms expose launch links',await p.locator('.game-card-clay a.clay-btn.primary').count()===5);
for(const [file,hash] of [['d6jq33mv39.html','179c68e5b75ebbaa0e224c3f9dca3d0a06b17f4a9934517ab09bf5ea275aa839'],['0lbzci75tc.html','996b0027e53e2fda92457cc9df901504ee602da52d1050bcc5bf459f878552b5']])check(file+' canonical bytes unchanged',crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')===hash);
check('No uncaught browser errors',errors.length===0);
const result={at:new Date().toISOString(),base,checks,errors,scope:'3D waterfront, screen-right through street, fixed-direction traffic, museum and city sidewalk visitors, lighthouse landscape, moving clouds, two-wing birds, boardwalk transitions, solid shade tree, squirrel climb-and-fade, camera modes, illustrated reader, training and Game House',staticPanorama:'ABSENT',waterfront:'3D_GEOMETRY',voiceQuality:'NOT_VERIFIED'};
fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{fs.writeFileSync(path.join(out,'browser-failure.json'),JSON.stringify({checks,errors,error:e.stack},null,2));console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
