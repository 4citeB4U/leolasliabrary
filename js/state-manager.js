/* REGION: LEOLA.DATA | TAG: HYBRID.STATE.CORE.V2
WHAT: durable device state for the hybrid clay library routes.
WHO: Creator-approved LL-CLAY-01. WHY: one visitor journey across index/reader/training/Game House.
HOW: IndexedDB primary + localStorage fallback + BroadcastChannel enhancement + legacy migration.
LICENSE: MIT. Device state is not cloud membership and contains no private voice source. */

export const STATE_SCHEMA_VERSION=2;
const DB_NAME='leola-learning-library';
const DB_VERSION=1;
const STORE='state';
const ROOT_KEY='app';
const FALLBACK_KEY='leola.learning.library.state.v2';
const LEGACY_KEYS={
 learning:'leola.learning.v1',
 cozy:'leola.cozy.member.v1',
 member:'leola.learning.library.member.v2',
 games:'leola.game.progress.v1'
};
const ROOMS=['loop','tension','pattern','amigurumi','yarnfolk'];
const BOOKS=['needle-and-yarn','crochet-mastery'];

export function freshState(){
 return {
  schemaVersion:STATE_SCHEMA_VERSION,
  migrationVersion:1,
  guest:{name:'',cardId:null,issuedAt:null},
  location:{route:'index.html',view:'outside',updatedAt:null},
  carryingBook:null,
  books:{},
  lessons:{},
  games:Object.fromEntries(ROOMS.map(id=>[id,{complete:false,bestScore:0,progress:0,updatedAt:null}])),
  settings:{sound:true,reducedMotion:false,captions:true},
  updatedAt:null
 };
}

function object(v){return v&&typeof v==='object'&&!Array.isArray(v)}
function text(v,max=120){return typeof v==='string'?v.trim().slice(0,max):''}
function iso(v){return typeof v==='string'&&Number.isFinite(Date.parse(v))?v:null}
function num(v,min=0,max=Number.MAX_SAFE_INTEGER){v=Number(v);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):min}

export function normalizeState(raw){
 const base=freshState();if(!object(raw))return base;
 const guest=object(raw.guest)?raw.guest:{};
 base.guest={name:text(guest.name,60),cardId:text(guest.cardId,40)||null,issuedAt:iso(guest.issuedAt)};
 const loc=object(raw.location)?raw.location:{};
 base.location={route:text(loc.route,100)||'index.html',view:text(loc.view,40)||'outside',updatedAt:iso(loc.updatedAt)};
 base.carryingBook=['story','instruction'].includes(raw.carryingBook)?raw.carryingBook:null;
 if(object(raw.books))for(const [id,b] of Object.entries(raw.books)){if(!BOOKS.includes(id)||!object(b))continue;base.books[id]={page:num(b.page,0,10000),count:num(b.count,1,10000),bookmark:text(b.bookmark,200)||null,lastRead:iso(b.lastRead)}}
 if(object(raw.lessons))for(const [id,l] of Object.entries(raw.lessons)){if(!/^CM-[A-Z0-9-]{1,60}$/.test(id)||!object(l))continue;base.lessons[id]={watchedSeconds:num(l.watchedSeconds,0,86400),completed:Boolean(l.completed),updatedAt:iso(l.updatedAt)}}
 if(object(raw.games))for(const id of ROOMS){const g=raw.games[id];if(!object(g))continue;base.games[id]={complete:Boolean(g.complete||g.isComplete),bestScore:num(g.bestScore??g.score,0,1000000),progress:num(g.progress??g.completed,0,1000000),updatedAt:iso(g.updatedAt||g.savedAt)}}
 const settings=object(raw.settings)?raw.settings:{};
 base.settings={sound:settings.sound!==false,reducedMotion:Boolean(settings.reducedMotion),captions:settings.captions!==false};
 base.updatedAt=iso(raw.updatedAt);
 return base;
}

export function migrateLegacy(read=(k)=>localStorage.getItem(k)){
 const next=freshState();
 const parse=k=>{try{return JSON.parse(read(k)||'null')}catch{return null}};
 const learning=parse(LEGACY_KEYS.learning);
 if(object(learning)){
  next.guest.name=text(learning.displayName,60);
  next.guest.cardId=text(learning.cardId,40)||null;
  if(object(learning.books))next.books=normalizeState({books:learning.books}).books;
  if(object(learning.games))for(const id of ROOMS){const g=learning.games[id];if(object(g))next.games[id]={complete:Boolean(g.isComplete),bestScore:num(g.bestScore??g.score),progress:num(g.completed),updatedAt:iso(g.savedAt)}}
 }
 const member=parse(LEGACY_KEYS.member)||parse(LEGACY_KEYS.cozy);
 if(object(member)){
  next.guest.name=next.guest.name||text(member.name,60);
  next.guest.cardId=next.guest.cardId||text(member.card||member.cardId,40)||null;
  next.guest.issuedAt=iso(member.issuedAt||member.createdAt);
 }
 const games=parse(LEGACY_KEYS.games);
 if(object(games))for(const id of ROOMS){const g=games[id];if(object(g))next.games[id]={complete:Boolean(g.complete||g.isComplete),bestScore:num(g.bestScore??g.score),progress:num(g.progress??g.count??g.completed),updatedAt:iso(g.updatedAt||g.savedAt)}}
 return normalizeState(next);
}

function openDb(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB'in globalThis)){reject(Error('IndexedDB unavailable'));return}
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('IndexedDB open failed'))
 })
}
async function idbGet(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(ROOT_KEY);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close()})}
async function idbSet(value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,ROOT_KEY);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}

function fallbackRead(){try{return JSON.parse(localStorage.getItem(FALLBACK_KEY)||'null')}catch{return null}}
function fallbackWrite(v){try{localStorage.setItem(FALLBACK_KEY,JSON.stringify(v));return true}catch{return false}}

class StateManager extends EventTarget{
 constructor(){super();this.state=freshState();this.ready=this.init();this.channel=null;try{this.channel=new BroadcastChannel('leola-learning-library-v2');this.channel.onmessage=e=>this.receive(e.data)}catch{}}
 async init(){
  let raw=null;
  try{raw=await idbGet()}catch{raw=fallbackRead()}
  if(!raw){raw=migrateLegacy();await this.write(raw)}
  this.state=normalizeState(raw);return this.snapshot()
 }
 snapshot(){return structuredClone?structuredClone(this.state):JSON.parse(JSON.stringify(this.state))}
 async write(value,{broadcast=true}={}){
  const next=normalizeState({...value,updatedAt:new Date().toISOString()});
  let persisted=false;try{persisted=await idbSet(next)}catch{persisted=fallbackWrite(next)}
  this.state=next;if(broadcast)this.channel?.postMessage({type:'state',state:next});
  this.dispatchEvent(new CustomEvent('change',{detail:{state:this.snapshot(),persisted}}));return persisted
 }
 async patch(patch){await this.ready;const next={...this.state,...patch};if(object(patch.guest))next.guest={...this.state.guest,...patch.guest};if(object(patch.location))next.location={...this.state.location,...patch.location};if(object(patch.settings))next.settings={...this.state.settings,...patch.settings};if(object(patch.books))next.books={...this.state.books,...patch.books};if(object(patch.lessons))next.lessons={...this.state.lessons,...patch.lessons};if(object(patch.games))next.games={...this.state.games,...patch.games};return this.write(next)}
 async setGame(id,record){if(!ROOMS.includes(id))throw Error('Unknown game room');return this.patch({games:{[id]:{...this.state.games[id],...record,updatedAt:new Date().toISOString()}}})}
 async setBook(id,record){if(!BOOKS.includes(id))throw Error('Unknown book');return this.patch({books:{[id]:{...(this.state.books[id]||{}),...record,lastRead:new Date().toISOString()}}})}
 async setLesson(id,record){if(!/^CM-[A-Z0-9-]{1,60}$/.test(id))throw Error('Invalid lesson id');return this.patch({lessons:{[id]:{...(this.state.lessons[id]||{}),...record,updatedAt:new Date().toISOString()}}})}
 receive(msg){if(msg?.type!=='state'||!object(msg.state))return;const incoming=normalizeState(msg.state);if((Date.parse(incoming.updatedAt)||0)<=(Date.parse(this.state.updatedAt)||0))return;this.state=incoming;this.dispatchEvent(new CustomEvent('change',{detail:{state:this.snapshot(),remote:true}}))}
 close(){this.channel?.close()}
}
export const appState=globalThis.__leolaStateManager||(globalThis.__leolaStateManager=new StateManager());
