import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOM,clampAsset,QUESTS} from '../app/src/model.js';
import {WALK_STOPS,awardDiscovery} from '../app/src/walkthrough.js';
import {validateRevision} from '../app/src/layout-editor.js';
test('room matches measured main bay and ceiling',()=>{assert.deepEqual(ROOM,{width:2.022,depth:2.157,height:2.61});assert.equal((ROOM.width*ROOM.depth).toFixed(2),'4.36');});
test('movable props stay inside the room',()=>{assert.deepEqual(clampAsset(-4,20),{x:.15,z:1.95});assert.deepEqual(clampAsset(.8,1.2),{x:.8,z:1.2});});
test('five discoveries require distinct real actions and award only once',()=>{
 assert.equal(QUESTS.length,5);let progress=new Set();
 for(const station of WALK_STOPS)progress=awardDiscovery(progress,station.event);
 assert.equal(progress.size,5);assert.equal(awardDiscovery(progress,'garment').size,5);
 assert.equal(awardDiscovery(progress,'unknown').size,5);assert.equal(awardDiscovery(new Set(),'orientation').size,1);
});
test('discovery viewpoints retain eye height and clear the entrance rack',()=>{
 for(const station of WALK_STOPS){const p=station.position;assert.equal(p[1],1.6);assert.ok(p[0]>.15&&p[0]<1.472);if(p[2]>1.807)assert.ok(p[0]<.806);}
});
test('revision import rejects incompatible rooms, unknown objects and invalid numbers',()=>{
 const data={version:1,units:'mm',roomMM:[2022,2157,2610],furniture:[{id:'chest',position:[22,0,0],rotation:0}]};
 assert.equal(validateRevision(data,['chest']).length,1);
 assert.throws(()=>validateRevision({...data,roomMM:[4000,4000,3000]},['chest']));
 assert.throws(()=>validateRevision({...data,furniture:[{id:'unknown',position:[0,0,0],rotation:0}]},['chest']));
 assert.throws(()=>validateRevision({...data,furniture:[{id:'chest',position:[NaN,0,0],rotation:0}]},['chest']));
});
