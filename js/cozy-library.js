import {hydrateAssets,assetUrl} from './asset-loader.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
await hydrateAssets();
const body=document.body,arrival=$('#arrival'),openDoorsButton=$('#open-doors'),onboarding=$('#onboarding'),resources=$('#resources'),speech=$('#speech'),speechCopy=$('#speech-copy'),walkNav=$('#walk-nav');
const cardDialog=$('#card-dialog'),bookDialog=$('#book-dialog'),readingSeat=$('#reading-seat'),readerFrame=$('#reader-frame');
const memberKey='leola.learning.library.member.v2';let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,soundEnabled=true,member=loadMember(),selectedBook=null,voiceManifest=null,audio=null,walkTimer=null;
const wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(ms,30):ms));
function loadMember(){try{const m=JSON.parse(localStorage.getItem(memberKey)||'null');return m?.version===2&&m.name&&m.card?m:null}catch{return null}}
function saveMember(m){try{localStorage.setItem(memberKey,JSON.stringify(m));return true}catch{return false}}
function phase(v){body.dataset.phase=v}
function view(v){body.dataset.view=v;$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)))}
function caption(t){$('#world-caption').textContent=t}
function safeDialogClose(d){if(d?.open)d.close()}
function stopVoice(){if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}}
async function loadVoice(){try{const r=await fetch('content/leola-voice.json',{cache:'no-store'});if(r.ok)voiceManifest=await r.json()}catch{}}
async function say(id,text){stopVoice();speechCopy.textContent=text;speech.hidden=false;const clip=voiceManifest?.status==='VERIFIED'?voiceManifest?.clips?.[id]:null;if(soundEnabled&&clip?.url&&/^((?!:).)*$/.test(clip.url)){try{audio=new Audio(new URL(clip.url,document.baseURI));await audio.play()}catch{audio=null}}}
function hideSpeech(){stopVoice();speech.hidden=true}
class LibrarySound{
 constructor(){this.ctx=null}
 async activate(){if(!soundEnabled)return;this.ctx??=new AudioContext();if(this.ctx.state==='suspended')await this.ctx.resume()}
 tone(freq=180,d=.09,g=.035,type='sine'){if(!soundEnabled||!this.ctx)return;const o=this.ctx.createOscillator(),v=this.ctx.createGain();o.type=type;o.frequency.value=freq;v.gain.setValueAtTime(g,this.ctx.currentTime);v.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+d);o.connect(v).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+d)}
 step(){this.tone(85,.08,.055,'triangle')}
 door(){this.tone(155,.45,.035,'sawtooth');setTimeout(()=>this.tone(105,.35,.025,'triangle'),220)}
 magic(){for(let i=0;i<5;i++)setTimeout(()=>this.tone(440+i*75,.22,.025,'sine'),i*75)}
 page(){this.tone(260,.11,.02,'triangle')}
}
const sfx=new LibrarySound();
async function footsteps(n=6){clearInterval(walkTimer);let i=0;return new Promise(resolve=>{walkTimer=setInterval(()=>{sfx.step();i++;if(i>=n){clearInterval(walkTimer);resolve()}},reduced?10:330)})}
async function approach(){if(body.dataset.phase!=='outside')return;await sfx.activate();phase('approaching');arrival.hidden=true;caption('Walking up the garden path…');await Promise.all([wait(2100),footsteps(6)]);openDoorsButton.hidden=false;caption('You reached the glass doors.')}
async function openDoors(){if(!['approaching','outside'].includes(body.dataset.phase))return;await sfx.activate();openDoorsButton.hidden=true;phase('doors-opening');sfx.door();caption('The glass doors slide open.');await wait(1750);phase('inside');view('desk');caption('Inside the library. Sista Lee is waiting at the desk.');await wait(650);await greet()}
async function enterReduced(){reduced=true;arrival.hidden=true;openDoorsButton.hidden=true;await sfx.activate();phase('doors-opening');sfx.door();await wait(40);phase('inside');view('desk');await greet()}
async function greet(){const text=member?`Welcome back, ${member.name}. Your library card and your saved visit are right here.`:"Hi there! I'm Sista Lee, your librarian, reader, crochet teacher, and game coach. Let's get your library card ready, then we'll explore together.";await say(member?'welcome-back':'welcome',text);if(member){populateCard();resources.hidden=false;walkNav.hidden=false;phase('exploring');caption('Choose a clay book, a lesson, a game, or look around the library.')}else{await wait(900);onboarding.hidden=false;$('#member-name').focus();caption('Sista Lee has placed a registration card on the desk.')}}
function makeCardId(){return 'LLL-'+crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase()}
function populateCard(){if(!member)return;$('#card-name').textContent=member.name;$('#card-number').textContent=member.card;$('#card-date').textContent=new Date(member.issuedAt).toLocaleDateString();$('#card-open').hidden=false;$('#member-note').textContent=member.name+' · guest card saved on this device'}
function presentCard(){populateCard();onboarding.hidden=true;phase('card');sfx.magic();$('#card-status').textContent=member.saved?'Guest card saved on this device.':'Temporary guest card; this browser could not save it.';cardDialog.showModal();say('card-ready',`Here you are, ${member.name}. A little card, a world of wonder. Take it, then choose where you'd like to go.`)}
function acceptCard(){safeDialogClose(cardDialog);resources.hidden=false;walkNav.hidden=false;phase('exploring');view('desk');caption('Your library is open. You can look around before choosing something.');say('explore','Your library is open. I can hand you either book, and the video lessons and Game House are ready below.')}
function chooseView(v){if(!['inside','exploring','card'].includes(body.dataset.phase))return;view(v);const text={desk:"You're near Sista Lee's desk.",books:'You walk toward the book shelves.',seat:'You walk to a quiet reading table.'}[v];caption(text);sfx.step();if(v==='seat'&&selectedBook)setTimeout(openReading,reduced?30:850)}
function offerBook(kind){if(!member){onboarding.hidden=false;onboarding.scrollIntoView({block:'center'});caption('Get your library card first, then Sista Lee can hand you a book.');return}selectedBook=kind;const story=kind==='story';$('#book-name').textContent=story?'Needle & Yarn':'Crochet Mastery';$('#book-subtitle').textContent=story?'A Love Stitched in Time':'A Complete Guide';$('#floating-book').classList.toggle('instruction',!story);$('#book-title').textContent=story?'Sista Lee offers Needle & Yarn.':'Sista Lee offers Crochet Mastery.';bookDialog.showModal();sfx.magic();say('book-'+kind,story?'Here is Needle and Yarn. Take it with you, look around if you like, and choose the reading table when you are ready.':'Here is Crochet Mastery. Take it with you, then choose a reading table and we can learn together.')}
function takeBook(){safeDialogClose(bookDialog);view('books');caption('You are carrying the clay book. Explore, or choose Reading table when you are ready.');walkNav.hidden=false}
function openReading(){if(!selectedBook)return;safeDialogClose(bookDialog);readingSeat.hidden=false;readerFrame.src='reader.html?book='+selectedBook+'&clay=1&embedded=1';$('#reading-title').textContent=(selectedBook==='story'?'Needle & Yarn':'Crochet Mastery')+' · reading with Sista Lee';sfx.page();caption('You take a seat and open the book.')}
function leaveReading(){readerFrame.src='about:blank';readingSeat.hidden=true;view('seat');caption('You stood up. Your book stays with you for this visit.')}
$('#approach').addEventListener('click',approach);$('#skip-walk').addEventListener('click',enterReduced);openDoorsButton.addEventListener('click',openDoors);
$('#sound-toggle').addEventListener('click',async()=>{soundEnabled=!soundEnabled;$('#sound-toggle').textContent=soundEnabled?'Sound on':'Sound off';$('#sound-toggle').setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)await sfx.activate();else stopVoice()});
$('#motion-toggle').addEventListener('click',()=>{reduced=!reduced;$('#motion-toggle').textContent=reduced?'Motion reduced':'Gentle motion';$('#motion-toggle').setAttribute('aria-pressed',String(reduced));body.classList.toggle('reduced-motion',reduced)});
$('#repeat').addEventListener('click',()=>say('replay',speechCopy.textContent));$('#stop-speech').addEventListener('click',hideSpeech);
$('#join-form').addEventListener('submit',e=>{e.preventDefault();const name=$('#member-name').value.trim(),email=$('#member-email').value.trim();if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){$('#join-error').textContent='Enter your name and a valid email address.';return}$('#join-error').textContent='';member={version:2,name,email,card:makeCardId(),issuedAt:new Date().toISOString(),saved:false};member.saved=saveMember({...member,saved:true});presentCard()});
$('#card-open').addEventListener('click',()=>{populateCard();cardDialog.showModal()});$('#card-dialog .close').addEventListener('click',()=>safeDialogClose(cardDialog));$('#accept-card').addEventListener('click',acceptCard);
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>chooseView(b.dataset.view)));$$('[data-book]').forEach(b=>b.addEventListener('click',()=>offerBook(b.dataset.book)));
$('#book-dialog .close').addEventListener('click',()=>safeDialogClose(bookDialog));$('#take-book').addEventListener('click',takeBook);$('#open-now').addEventListener('click',openReading);$('#leave-seat').addEventListener('click',leaveReading);
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||body.dataset.phase!=='exploring')return;const order=['desk','books','seat'];let i=order.indexOf(body.dataset.view);if(['ArrowRight','d','D'].includes(e.key))chooseView(order[Math.min(2,i+1)]);if(['ArrowLeft','a','A'].includes(e.key))chooseView(order[Math.max(0,i-1)])});
addEventListener('pagehide',()=>{clearInterval(walkTimer);stopVoice();if(sfx.ctx)sfx.ctx.close()});
for(const img of $$('img[data-asset-error]'))img.hidden=true;
if(reduced){$('#motion-toggle').textContent='Motion reduced';$('#motion-toggle').setAttribute('aria-pressed','true')}
if(member)populateCard();
loadVoice();
caption('Walk to the entrance when you are ready.');
window.__leolaLibrary={get phase(){return body.dataset.phase},get view(){return body.dataset.view},get member(){return member?{name:member.name,card:member.card,saved:member.saved}:null},get book(){return selectedBook},assetErrors:()=>$$('[data-asset-error]').map(n=>({asset:n.dataset.asset,error:n.dataset.assetError}))};
