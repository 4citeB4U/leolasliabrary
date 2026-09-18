const MAP={
 desk:['../assets/base64/desk.webp.b64','image/webp'],card:['../assets/base64/card.webp.b64','image/webp'],leola:['../assets/base64/leola.webp.b64','image/webp'],
 'game-loop':['../assets/base64/game-loop.webp.b64','image/webp'],'game-tension':['../assets/base64/game-tension.webp.b64','image/webp'],'game-pattern':['../assets/base64/game-pattern.webp.b64','image/webp'],'game-amigurumi':['../assets/base64/game-amigurumi.webp.b64','image/webp'],'game-yarnfolk':['../assets/base64/game-yarnfolk.webp.b64','image/webp'],
 lesson1:['../assets/base64/lesson1.mp4.b64','video/mp4'],lesson2:['../assets/base64/lesson2.mp4.b64','video/mp4'],lesson3:['../assets/base64/lesson3.mp4.b64','video/mp4']
};
const cache=new Map();
export async function assetUrl(id){if(cache.has(id))return cache.get(id);const item=MAP[id];if(!item)throw Error('Unknown asset '+id);const r=await fetch(new URL(item[0],import.meta.url));if(!r.ok)throw Error('Asset '+id+' returned '+r.status);const b64=(await r.text()).trim();const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:item[1]}));cache.set(id,url);return url}
export async function hydrateAssets(root=document){const nodes=[...root.querySelectorAll('[data-asset]')];await Promise.all(nodes.map(async n=>{try{n.src=await assetUrl(n.dataset.asset)}catch(e){n.dataset.assetError=e.message;n.alt=(n.alt||'Asset')+' unavailable'}}));return nodes.length}
addEventListener('pagehide',()=>{for(const u of cache.values())URL.revokeObjectURL(u);cache.clear()});
