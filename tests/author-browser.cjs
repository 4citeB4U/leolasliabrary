/* Isolated local author-intake acceptance. No email, submission, or real author data. */
const { chromium }=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-evidence');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],requests=[];let browser;
const check=(name,value)=>{checks.push({name,pass:!!value});assert.ok(value,name);console.log('PASS '+name);};
const fixture=Buffer.from('Author acceptance fixture\nOriginal text stays unchanged.\n','utf8');
function zipEntries(buf){const entries={};let off=0;while(buf.readUInt32LE(off)===0x04034b50){assert.equal(buf.readUInt16LE(off+8),0);const size=buf.readUInt32LE(off+18),nl=buf.readUInt16LE(off+26),el=buf.readUInt16LE(off+28),name=buf.subarray(off+30,off+30+nl).toString();const start=off+30+nl+el;entries[name]=buf.subarray(start,start+size);off=start+size;}return entries;}
(async()=>{
browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:1200,height:900},acceptDownloads:true,reducedMotion:'reduce'}),p=await ctx.newPage();p.setDefaultTimeout(30000);
p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()!=='GET')requests.push({method:r.method(),url:r.url()});});
await p.goto(process.env.LEOLA_TEST_URL||'http://127.0.0.1:4174/',{waitUntil:'domcontentloaded',timeout:90000});
await p.waitForFunction(()=>window.__world3D?.authorLibrary&&window.__world3D?.bookCarry?.deskBooks.size===2,{}, {timeout:90000});
if(await p.locator('#onboarding-modal.active').count())await p.locator('#btn-onboarding-cancel').click();
const scene=await p.evaluate(async()=>{const w=window.__world3D,T=await import('three'),lamps=[],walls=[];w.scene.traverse(o=>{if(o.name==='Library_Lamppost_Banner')lamps.push(o);if(o.name.startsWith('Author_Wall_Banner_'))walls.push(o);});const a=w.arcadeGroup,box=new T.Box3().setFromObject(a);return {lamps:lamps.length,allLampsInteractive:lamps.every(o=>o.userData.type==='author-invitation'&&w.interactiveObjects.includes(o)),walls:walls.length,allWallsInteractive:walls.every(g=>g.children.some(o=>o.userData.type==='author-invitation'&&w.interactiveObjects.includes(o))),easels:w.interactiveObjects.filter(o=>o.userData.type==='premiere-book').map(o=>({id:o.userData.bookId,src:o.material.map.image?.src||'',parent:o.parent.name})),arcadeMinY:box.min.y,arcadeFloor:a.userData.floorHeight};});
check('Every lamp banner is registered as an author invitation',scene.lamps>0&&scene.allLampsInteractive);check('Both facade wall banners are interactive',scene.walls===2&&scene.allWallsInteractive);
check('Both original premiere covers are bound',scene.easels.length===2&&scene.easels.some(e=>e.id==='needle-and-yarn'&&e.src.endsWith('assets/books/needle-and-yarn/cover.jpg'))&&scene.easels.some(e=>e.id==='crochet-mastery'&&e.src.endsWith('jva31043ou.png')));
check('Arcade rests at floor height .05',Math.abs(scene.arcadeMinY-.05)<.015&&scene.arcadeFloor===.05);
// Aim an isolated test camera at each physical easel, then exercise its canvas raycast with a real pointer click.
for(const id of ['needle-and-yarn','crochet-mastery']){
  await p.evaluate(async id=>{const w=window.__world3D,T=await import('three'),o=w.interactiveObjects.find(o=>o.userData.type==='premiere-book'&&o.userData.bookId===id),v=o.getWorldPosition(new T.Vector3());w.phase='seated';w.cancelWalking();w.camera.position.set(v.x,v.y,v.z+5);w.camera.lookAt(v);w.yaw=w.camera.rotation.y;w.pitch=w.camera.rotation.x;w.camera.updateMatrixWorld();w.renderer.render(w.scene,w.camera);},id);
  await p.mouse.click(600,450);await p.waitForFunction(id=>window.__world3D.bookCarry.selected?.id===id,id);
  check(id+' easel picks up its book without opening a reader',await p.evaluate(()=>!document.querySelector('#reader-modal-backdrop.active')&&!window.__world3D.illustratedBookReader?.isOpen));
  await p.locator('#carried-book button').filter({hasText:/^Open book$/}).click();
  if(id==='needle-and-yarn'){
    await p.waitForFunction(()=>window.__world3D.illustratedBookReader?.isOpen);
    check('Needle illustrated edition has33pages and6chapter markers',await p.evaluate(()=>{const m=window.__world3D.illustratedBookReader.manifest;return m.pages.length===33&&m.chapters.length===6;}));
    await p.evaluate(()=>window.__world3D.illustratedBookReader.close());
  }else{
    await p.waitForFunction(()=>document.querySelectorAll('#reader-chapter-tabs button').length===6);
    await p.locator('#reader-chapter-tabs button').nth(5).click();const actual=await p.locator('#reader-book-body').innerText();
    check('Crochet chapter six contains full original instructions',actual.includes('Thread the yarn tail onto a tapestry needle.')&&actual.includes('Mattress Stitch:')&&actual.includes('Steam Blocking:'));
    await p.locator('#btn-close-reader-modal').click();
  }
  await p.locator('#carried-book button').filter({hasText:/^Return$/}).click();
}
await p.evaluate(()=>{const w=window.__world3D;w.handleObjectInteraction(w.interactiveObjects.find(o=>o.userData.type==='author-invitation').userData);});
check('Invitation explains author permissions and review',await p.locator('#author-library-dialog').innerText().then(t=>t.includes('Open for all writers')||t.includes('OPEN FOR ALL WRITERS')));
await p.locator('#author-meet').click();check('Librarian hands off clipboard',await p.locator('#author-take').isVisible());await p.locator('#author-take').click();
check('Both seat arrows and clipboard are shown',await p.evaluate(()=>{const a=window.__world3D.authorLibrary;return a.arrows.length===2&&a.arrows.every(a=>a.visible)&&a.clipboard.visible;}));
await p.locator('#author-seat-left').click();check('Left writing seat opens application',await p.evaluate(()=>window.__world3D.phase==='seated'&&window.__world3D.playerPos.x<0));
await p.getByRole('button',{name:'Close author application'}).click();await p.evaluate(async()=>{const w=window.__world3D,T=await import('three');w.startWalkingTo(new T.Vector3(0,0,10));for(let i=0;i<1400&&w.walkTarget;i++){w.updateMovement(.05);w.updateDoors(.05);}});check('Visitor can leave while seated with application closed',await p.evaluate(()=>window.__world3D.phase!=='seated'&&window.__world3D.playerPos.z>5));
await p.locator('#library-tools summary').click();await p.locator('#author-entry-button').click();await p.locator('#author-meet').click();await p.locator('#author-take').click();await p.locator('#author-seat-right').click();check('Right writing seat opens application',await p.evaluate(()=>window.__world3D.phase==='seated'&&window.__world3D.playerPos.x>0));
for(const [name,value] of Object.entries({title:'Acceptance Fixture Book',author:'Test Author',email:'test@example.com',description:'A test-only unpublished text fixture.',language:'English'}))await p.locator(`[name="${name}"]`).fill(value);
await p.getByRole('button',{name:'Continue',exact:true}).click();await p.locator('[name=ebook]').setInputFiles({name:'acceptance-book.txt',mimeType:'text/plain',buffer:fixture});await p.waitForFunction(()=>document.querySelector('#author-file-state').textContent.includes('TXT'));
await p.getByRole('button',{name:'Continue',exact:true}).click();
check('Permissions required before review',await p.locator('[name=rightsConfirmed]').evaluate(e=>e.required));for(const name of ['rightsConfirmed','reviewPermission','termsAcknowledged'])await p.locator(`[name=${name}]`).check();await p.locator('[name=drmDeclaration]').selectOption('none');await p.getByRole('button',{name:'Continue',exact:true}).click();await p.getByRole('button',{name:'Save application & prepare email'}).click();await p.locator('#author-download').waitFor();
const record=await p.evaluate(async()=>{const a=window.__world3D.authorLibrary.application;return {id:a.id,status:a.status,approved:a.rights.publicDisplayApproved,original:await a.original.text(),sha:a.book.sha256};});
check('Application saved locally with public approval false',record.status==='saved-locally-not-sent'&&record.approved===false);check('Original upload and SHA-256 preserved',record.original===fixture.toString()&&record.sha===crypto.createHash('sha256').update(fixture).digest('hex'));
check('Email is an explicit mailto link',(await p.locator('#author-email').getAttribute('href')).startsWith('mailto:'));
const pending=p.waitForEvent('download');await p.locator('#author-download').click();const download=await pending;const entries=zipEntries(fs.readFileSync(await download.path()));check('Downloaded ZIP preserves exact original bytes',entries['original/acceptance-book.txt'].equals(fixture));const manifest=JSON.parse(entries['application.json']);check('ZIP manifest records unapproved unsent application',manifest.id===record.id&&manifest.rights.publicDisplayApproved===false&&manifest.status==='saved-locally-not-sent');
await p.reload({waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>window.__world3D?.authorLibrary&&window.__world3D?.bookCarry?.deskBooks.size===2,{}, {timeout:90000});if(await p.locator('#onboarding-modal.active').count())await p.locator('#btn-onboarding-cancel').click();await p.locator('#library-tools summary').click();await p.locator('#author-entry-button').click();await p.getByRole('button',{name:'Reopen my last saved application'}).click();await p.locator('#author-download').waitFor();check('Saved application survives reload',await p.evaluate(id=>window.__world3D.authorLibrary.application.id===id,record.id));
check('No automatic submission or email network request',requests.length===0);check('No browser JavaScript errors',errors.length===0);
})().catch(e=>{errors.push(e.stack||String(e));process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'author-browser-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks,errors,requests},null,2));await browser?.close();});
