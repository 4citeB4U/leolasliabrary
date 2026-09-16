/* REGION: LEOLA.DATA | TAG: DEVICE.PROGRESS.V1
WHAT: versioned local learning state, never represented as cloud membership.
WHO: LeeWay; WHY: honest recoverable progress; WHERE: browser; WHEN: 2026-09-16;
HOW: validated bounded storage; LICENSE: MIT. No contact information. */
export const STORE_KEY='leola.learning.v1';
const fresh=()=>({version:1,displayName:'',cardId:null,books:{},games:{},badges:[],updatedAt:null});
let available=true;
export function loadState(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return fresh();const s=JSON.parse(raw);if(!s||s.version!==1||!s.books||typeof s.books!=='object'||Array.isArray(s.books)||!s.games||typeof s.games!=='object'||Array.isArray(s.games)||!Array.isArray(s.badges))return fresh();return {...fresh(),...s,displayName:typeof s.displayName==='string'?s.displayName.slice(0,40):'',badges:s.badges.filter(x=>typeof x==='string').slice(0,100)};}catch{available=false;return fresh();}}
export function saveState(s){try{s.version=1;s.updatedAt=new Date().toISOString();localStorage.setItem(STORE_KEY,JSON.stringify(s));available=true;return true;}catch{available=false;return false;}}
export function storageAvailable(){return available;}
export function saveName(name){const s=loadState();s.displayName=String(name).trim().slice(0,40);s.cardId=s.cardId||'DEVICE-'+crypto.randomUUID().slice(0,8).toUpperCase();return {ok:saveState(s),state:s};}
export function saveBook(bookId,page,count){if(!['needle-and-yarn','crochet-mastery'].includes(bookId)||!Number.isInteger(page)||!Number.isInteger(count)||page<0||page>=count)return false;const s=loadState();s.books[bookId]={page,count,lastRead:new Date().toISOString()};return saveState(s);}
export function saveGame(id,record){if(!['loop','tension','pattern','amigurumi','yarnfolk'].includes(id))return false;const s=loadState();s.games[id]={...record,savedAt:new Date().toISOString()};return saveState(s);}
export function award(id){if(!/^[a-z0-9-]{1,60}$/.test(id))return false;const s=loadState();if(s.badges.includes(id))return false;s.badges.push(id);return saveState(s);}
export function safeSetting(key,value){try{if(arguments.length===1)return localStorage.getItem('leola.'+key);localStorage.setItem('leola.'+key,String(value));return true;}catch{return null;}}
