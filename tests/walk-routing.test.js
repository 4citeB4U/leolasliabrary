import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findWalkPath,isWalkPointFree,isWalkSegmentFree} from '../js/walk-routing.js';
const source=fs.readFileSync(new URL('../js/world-3d.js',import.meta.url),'utf8');
const match=source.slice(source.indexOf('  initCollisionSystem() {')).match(/this\.solidObstacles = (\[[\s\S]*?\n    \]);/);
const world={playerRadius:.42,phase:'inside',solidObstacles:Function('return '+match[1])()};
function verify(start,goal){const path=findWalkPath(world,start,goal);assert.ok(path?.length>=2);for(const point of path)assert.ok(isWalkPointFree(world,point));for(let i=1;i<path.length;i++){assert.ok(isWalkSegmentFree(world,path[i-1],path[i]));for(let j=0;j<=100;j++){const t=j/100;assert.ok(isWalkPointFree(world,{x:path[i-1].x+(path[i].x-path[i-1].x)*t,z:path[i-1].z+(path[i].z-path[i-1].z)*t}));}}return path;}
 test('desk to arcade routes around desk and study tables',()=>{const p=verify({x:0,z:-3.9},{x:12.9,z:-20});assert.ok(p.length>2);});
 test('reading seat and both author seats find safe routes to exterior door',()=>{for(const start of [{x:-8.5,z:-13.8},{x:-8.4,z:-4},{x:8.4,z:-4}]){const p=verify(start,{x:0,z:10});assert.deepEqual(p.at(-1),{x:0,z:10});}});
 test('outdoor to back aisle and reverse honor doorway gap',()=>{verify({x:12,z:22},{x:-8,z:-28});verify({x:-8,z:-28},{x:12,z:22});});
 test('blocked destination snaps to safe floor and no-path returns null',()=>{const p=verify({x:0,z:10},{x:0,z:-9});assert.notDeepEqual(p.at(-1),{x:0,z:-9});assert.equal(findWalkPath({...world,solidObstacles:[{type:'box',minX:-100,maxX:100,minZ:-100,maxZ:100}]},{x:0,z:0},{x:2,z:2}),null);assert.equal(findWalkPath(world,{x:NaN,z:0},{x:0,z:10}),null);});
