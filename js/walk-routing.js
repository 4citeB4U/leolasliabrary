// Pure 2D navigation: no renderer, phase mutation, or collision-response side effects.
const CLEARANCE = .025, STEP = .4;
function obstacles(world) {
  const all=[...(world.solidObstacles||[])];
  for(const [npc,r] of [[world.librarianHelper,1.35],[world.leola,1.25]])
    if(npc?.group)all.push({type:'cylinder',x:npc.group.position.x,z:npc.group.position.z,r});
  return all;
}
function free(world,p,obs) {
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
  if(world.phase==='park')return p.x>=21.5&&p.x<=34&&p.z>=-12&&p.z<=3;
  if(p.z<4.2){if(Math.abs(p.x)>13||p.z<(Math.abs(p.x)<=.70?-35.5:-33))return false;}
  else if(p.z<=5.6){if(Math.abs(p.x)>2.8)return false;}
  else if(Math.abs(p.x)>14.5||p.z>24.2)return false;
  const r=(world.playerRadius??.42)+CLEARANCE;
  return obs.every(o=>o.type==='cylinder'?Math.hypot(p.x-o.x,p.z-o.z)>=o.r+r:o.type!=='box'||p.x<=o.minX-r||p.x>=o.maxX+r||p.z<=o.minZ-r||p.z>=o.maxZ+r);
}
function segment(world,a,b,obs){const count=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.08);for(let i=0;i<=count;i++){const t=count?i/count:0;if(!free(world,{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},obs))return false;}return true;}
export const isWalkPointFree=(world,p)=>free(world,p,obstacles(world));
export const isWalkSegmentFree=(world,a,b)=>segment(world,a,b,obstacles(world));
class Heap {
  a=[];
  push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p;}a[i]=v;}
  pop(){const a=this.a,root=a[0],tail=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=tail.f)break;a[i]=a[c];i=c;}a[i]=tail;}return root;}
}
/** Points include a safe start and goal. Null means unreachable. A blocked endpoint
 * is snapped to nearby free space; callers must place an embedded seated avatar at
 * points[0] before following the remaining route, not walk through its chair. */
export function findWalkPath(world,start,goal) {
  if(![start?.x,start?.z,goal?.x,goal?.z].every(Number.isFinite))return null;
  const obs=obstacles(world),park=world.phase==='park',minX=park?21.6:-14.4,maxX=park?34:14.4,minZ=park?-12:-35.2,maxZ=park?2.8:24;
  const cols=Math.round((maxX-minX)/STEP)+1,rows=Math.round((maxZ-minZ)/STEP)+1,n=cols*rows;
  const pos=id=>({x:minX+(id%cols)*STEP,z:minZ+Math.floor(id/cols)*STEP});
  const usable=new Uint8Array(n);for(let i=0;i<n;i++)usable[i]=Number(free(world,pos(i),obs));
  const nearest=p=>{let id=-1,best=Infinity;for(let i=0;i<n;i++){if(!usable[i])continue;const q=pos(i),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<best){id=i;best=d;}}return id;};
  // Valid endpoints connect only through collision-free segments to their grid.
  const anchor=p=>{if(!free(world,p,obs)){const id=nearest(p);return id<0?null:{id,p:pos(id)};}let id=-1,best=Infinity;for(let i=0;i<n;i++){if(!usable[i])continue;const q=pos(i),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<best&&segment(world,p,q,obs)){best=d;id=i;if(d<.001)break;}}return id<0?null:{id,p:{x:p.x,z:p.z}};};
  const a=anchor(start),b=anchor(goal);if(!a||!b)return null;
  if(segment(world,a.p,b.p,obs))return [a.p,b.p];
  const cost=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1),closed=new Uint8Array(n),heap=new Heap();cost[a.id]=0;heap.push({id:a.id,f:0});
  while(heap.a.length){const {id}=heap.pop();if(closed[id])continue;closed[id]=1;if(id===b.id)break;const x=id%cols,z=Math.floor(id/cols),p=pos(id);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=cols||nz<0||nz>=rows)continue;const ni=nz*cols+nx;if(!usable[ni]||closed[ni])continue;const q=pos(ni);if(!segment(world,p,q,obs))continue;const next=cost[id]+Math.hypot(dx,dz)*STEP;if(next>=cost[ni])continue;cost[ni]=next;prev[ni]=id;heap.push({id:ni,f:next+Math.hypot(q.x-b.p.x,q.z-b.p.z)});}
  }
  if(!closed[b.id])return null;
  const grid=[];for(let id=b.id;id!==-1;id=prev[id]){grid.push(pos(id));if(id===a.id)break;}grid.reverse();
  const raw=[a.p,...grid,b.p],points=[a.p];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!segment(world,raw[i],raw[j],obs))j--;points.push(raw[j]);i=j;}return points;
}
